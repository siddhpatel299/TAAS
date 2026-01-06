/**
 * Sync Manager
 * 
 * The core orchestrator for intent-aware folder synchronization.
 * 
 * CRITICAL BEHAVIORS:
 * - Uploads are SEQUENTIAL (one at a time)
 * - Uploads are DELAYED (configurable 30-120 seconds)
 * - Uploads have JITTER (random variation to appear human)
 * - Sync is PAUSABLE and DISABLEABLE
 * - Errors PAUSE the queue (no silent failures)
 * - No instant mirroring, no batch uploads
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { FolderWatcherService } from './folder-watcher';
import { EncryptionService } from './encryption-service';
import { TelegramService } from './telegram-service';
import { StoreService } from './store-service';
import {
  SyncState,
  SyncFolder,
  SyncSettings,
  QueuedUpload,
  FileChangeEvent,
  DEFAULT_SYNC_SETTINGS,
} from '../../shared/types';

type StateCallback = (state: SyncState) => void;

export class SyncManager extends EventEmitter {
  private storeService: StoreService;
  private telegramService: TelegramService;
  private folderWatcher: FolderWatcherService;
  private encryptionService: EncryptionService;
  private stateCallback: StateCallback;

  private isEnabled: boolean = false;
  private isPaused: boolean = false;
  private settings: SyncSettings = DEFAULT_SYNC_SETTINGS;
  private folders: SyncFolder[] = [];
  private queue: QueuedUpload[] = [];
  private currentUpload: QueuedUpload | null = null;
  private uploadTimeout: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  constructor(
    storeService: StoreService,
    telegramService: TelegramService,
    stateCallback: StateCallback
  ) {
    super();
    this.storeService = storeService;
    this.telegramService = telegramService;
    this.stateCallback = stateCallback;
    
    this.folderWatcher = new FolderWatcherService();
    this.encryptionService = new EncryptionService(storeService);
    this.settings = storeService.getSettings();
    this.folders = storeService.getSyncFolders();

    // Set up file change handler
    this.folderWatcher.on('file-change', this.handleFileChange.bind(this));
    this.folderWatcher.on('error', this.handleWatcherError.bind(this));
  }

  // === Public API ===

  /**
   * Enable sync and start watching enabled folders
   */
  async enable(): Promise<boolean> {
    if (!this.telegramService.getAuthState().isAuthenticated) {
      console.error('Cannot enable sync: Not authenticated');
      return false;
    }

    const channel = this.storeService.getSelectedChannel();
    if (!channel.id) {
      console.error('Cannot enable sync: No channel selected');
      return false;
    }

    this.isEnabled = true;
    this.isPaused = false;

    // Start watching enabled folders
    for (const folder of this.folders) {
      if (folder.enabled) {
        this.folderWatcher.watchFolder(folder);
      }
    }

    // Resume queue processing if there are pending uploads
    this.scheduleNextUpload();

    this.notifyStateChange();
    console.log('Sync enabled');
    return true;
  }

  /**
   * Disable sync completely
   */
  async disable(): Promise<boolean> {
    this.isEnabled = false;
    this.isPaused = false;

    // Stop all watchers
    await this.folderWatcher.shutdown();

    // Cancel pending upload
    if (this.uploadTimeout) {
      clearTimeout(this.uploadTimeout);
      this.uploadTimeout = null;
    }

    this.notifyStateChange();
    console.log('Sync disabled');
    return true;
  }

  /**
   * Pause sync (keep watching but don't upload)
   */
  pause(): boolean {
    if (!this.isEnabled) return false;

    this.isPaused = true;
    this.folderWatcher.pause();

    if (this.uploadTimeout) {
      clearTimeout(this.uploadTimeout);
      this.uploadTimeout = null;
    }

    this.notifyStateChange();
    console.log('Sync paused');
    return true;
  }

  /**
   * Resume sync
   */
  resume(): boolean {
    if (!this.isEnabled) return false;

    this.isPaused = false;
    this.folderWatcher.resume();

    // Resume processing
    this.scheduleNextUpload();

    this.notifyStateChange();
    console.log('Sync resumed');
    return true;
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    const channel = this.storeService.getSelectedChannel();
    
    return {
      isEnabled: this.isEnabled,
      isPaused: this.isPaused,
      isAuthenticated: this.telegramService.getAuthState().isAuthenticated,
      channelId: channel.id,
      channelName: channel.name,
      folders: this.folders,
      queue: this.queue,
      totalUploaded: this.storeService.getTotalUploaded(),
      lastUploadTime: this.storeService.getLastUploadTime(),
    };
  }

  /**
   * Get upload queue
   */
  getQueue(): QueuedUpload[] {
    return [...this.queue];
  }

  // === Folder Management ===

  /**
   * Add a folder to sync
   */
  addFolder(localPath: string, remoteFolderName: string): SyncFolder {
    // Check if folder already exists
    const existing = this.folders.find((f) => f.localPath === localPath);
    if (existing) {
      return existing;
    }

    const folder: SyncFolder = {
      id: uuidv4(),
      localPath,
      remoteFolderName,
      enabled: false, // User must explicitly enable
      createdAt: Date.now(),
    };

    this.folders.push(folder);
    this.storeService.addSyncFolder(folder);
    this.notifyStateChange();

    console.log(`Added folder: ${localPath}`);
    return folder;
  }

  /**
   * Remove a folder from sync
   */
  async removeFolder(folderId: string): Promise<boolean> {
    const index = this.folders.findIndex((f) => f.id === folderId);
    if (index === -1) return false;

    // Stop watching
    await this.folderWatcher.unwatchFolder(folderId);

    // Remove from queue
    this.queue = this.queue.filter((q) => q.syncFolderId !== folderId);

    // Remove from list
    this.folders.splice(index, 1);
    this.storeService.removeSyncFolder(folderId);

    this.notifyStateChange();
    console.log(`Removed folder: ${folderId}`);
    return true;
  }

  /**
   * Enable a folder for syncing
   */
  enableFolder(folderId: string): boolean {
    const folder = this.folders.find((f) => f.id === folderId);
    if (!folder) return false;

    folder.enabled = true;
    this.storeService.updateSyncFolder(folderId, { enabled: true });

    if (this.isEnabled && !this.isPaused) {
      this.folderWatcher.watchFolder(folder);
    }

    this.notifyStateChange();
    console.log(`Enabled folder: ${folder.localPath}`);
    return true;
  }

  /**
   * Disable a folder (stop watching but keep in list)
   */
  async disableFolder(folderId: string): Promise<boolean> {
    const folder = this.folders.find((f) => f.id === folderId);
    if (!folder) return false;

    folder.enabled = false;
    this.storeService.updateSyncFolder(folderId, { enabled: false });

    await this.folderWatcher.unwatchFolder(folderId);

    // Remove pending uploads for this folder
    this.queue = this.queue.filter(
      (q) => q.syncFolderId !== folderId || q.status === 'uploading'
    );

    this.notifyStateChange();
    console.log(`Disabled folder: ${folder.localPath}`);
    return true;
  }

  // === Channel Management ===

  /**
   * Select a storage channel
   */
  selectChannel(channelId: string): boolean {
    // TODO: Get channel name from Telegram
    this.storeService.setSelectedChannel(channelId, 'Storage Channel');
    this.notifyStateChange();
    return true;
  }

  // === Queue Management ===

  /**
   * Clear all pending uploads
   */
  clearQueue(): boolean {
    // Keep only the currently uploading item
    this.queue = this.queue.filter((q) => q.status === 'uploading');
    this.notifyStateChange();
    console.log('Queue cleared');
    return true;
  }

  /**
   * Remove a specific item from queue
   */
  removeFromQueue(itemId: string): boolean {
    const index = this.queue.findIndex((q) => q.id === itemId);
    if (index === -1) return false;

    const item = this.queue[index];
    if (item.status === 'uploading') {
      console.log('Cannot remove item that is currently uploading');
      return false;
    }

    this.queue.splice(index, 1);
    this.notifyStateChange();
    console.log(`Removed from queue: ${item.filePath}`);
    return true;
  }

  // === Settings ===

  /**
   * Apply new settings
   */
  applySettings(settings: Partial<SyncSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.folderWatcher.updateSettings(this.settings);
  }

  // === Shutdown ===

  /**
   * Clean shutdown
   */
  async shutdown(): Promise<void> {
    await this.disable();
    this.removeAllListeners();
  }

  // === Private Methods ===

  /**
   * Handle file change from watcher
   */
  private handleFileChange(event: FileChangeEvent): void {
    if (!this.isEnabled || this.isPaused) return;

    const folder = this.folders.find((f) => f.id === event.syncFolderId);
    if (!folder) return;

    // Get file info
    let stats: fs.Stats;
    try {
      stats = fs.statSync(event.path);
    } catch {
      return; // File may have been deleted
    }

    // Check if already in queue (by path)
    const existingIndex = this.queue.findIndex(
      (q) => q.filePath === event.path && q.status === 'pending'
    );

    if (existingIndex !== -1) {
      // Update existing entry (file was modified again)
      this.queue[existingIndex].addedAt = event.timestamp;
      this.queue[existingIndex].scheduledFor = this.calculateScheduledTime();
      console.log(`Updated queue entry: ${event.path}`);
      return;
    }

    // Calculate the scheduled upload time
    const scheduledFor = this.calculateScheduledTime();

    // Add to queue
    const queueItem: QueuedUpload = {
      id: uuidv4(),
      filePath: event.path,
      relativePath: this.folderWatcher.getRelativePath(event.path, event.syncFolderId),
      syncFolderId: event.syncFolderId,
      fileSize: stats.size,
      mimeType: mime.lookup(event.path) || 'application/octet-stream',
      status: 'pending',
      progress: 0,
      addedAt: event.timestamp,
      scheduledFor,
    };

    this.queue.push(queueItem);
    console.log(`Queued for upload: ${event.path} (scheduled in ${Math.round((scheduledFor - Date.now()) / 1000)}s)`);

    // Schedule processing if not already running
    this.scheduleNextUpload();
    this.notifyStateChange();
  }

  /**
   * Calculate when the next upload should occur (with delay + jitter)
   */
  private calculateScheduledTime(): number {
    const { minUploadDelay, maxUploadDelay, jitterFactor } = this.settings;

    // Base delay (in milliseconds)
    const baseDelay = minUploadDelay + Math.random() * (maxUploadDelay - minUploadDelay);
    
    // Add jitter
    const jitter = baseDelay * jitterFactor * (Math.random() * 2 - 1);
    
    const delayMs = Math.max(minUploadDelay * 1000, (baseDelay + jitter) * 1000);
    
    return Date.now() + delayMs;
  }

  /**
   * Schedule the next upload
   */
  private scheduleNextUpload(): void {
    if (!this.isEnabled || this.isPaused || this.isProcessing) return;

    // Find the next pending upload
    const pendingItems = this.queue
      .filter((q) => q.status === 'pending')
      .sort((a, b) => a.scheduledFor - b.scheduledFor);

    if (pendingItems.length === 0) return;

    const next = pendingItems[0];
    const delay = Math.max(0, next.scheduledFor - Date.now());

    // Clear any existing timeout
    if (this.uploadTimeout) {
      clearTimeout(this.uploadTimeout);
    }

    // Schedule the upload
    this.uploadTimeout = setTimeout(() => {
      this.processNextUpload();
    }, delay);

    console.log(`Next upload scheduled in ${Math.round(delay / 1000)}s: ${next.relativePath}`);
  }

  /**
   * Process the next upload in queue
   */
  private async processNextUpload(): Promise<void> {
    if (!this.isEnabled || this.isPaused || this.isProcessing) return;

    // Get next pending item
    const pendingItems = this.queue
      .filter((q) => q.status === 'pending')
      .sort((a, b) => a.scheduledFor - b.scheduledFor);

    if (pendingItems.length === 0) {
      this.isProcessing = false;
      return;
    }

    const item = pendingItems[0];
    this.isProcessing = true;
    this.currentUpload = item;

    try {
      // Validate file still exists
      if (!fs.existsSync(item.filePath)) {
        console.log(`File no longer exists, skipping: ${item.filePath}`);
        item.status = 'error';
        item.error = 'File no longer exists';
        throw new Error('File no longer exists');
      }

      // Update status
      item.status = 'encrypting';
      item.startedAt = Date.now();
      this.notifyStateChange();

      console.log(`Encrypting: ${item.relativePath}`);

      // Encrypt the file
      const encrypted = await this.encryptionService.encryptFile(item.filePath);
      const uploadBuffer = this.encryptionService.packageForUpload(encrypted);

      // Update status
      item.status = 'uploading';
      this.notifyStateChange();

      console.log(`Uploading: ${item.relativePath}`);

      // Get channel ID
      const channel = this.storeService.getSelectedChannel();
      if (!channel.id) {
        throw new Error('No storage channel selected');
      }

      // Upload to Telegram
      await this.telegramService.uploadFile(
        channel.id,
        uploadBuffer,
        `${item.relativePath}.enc`, // Add .enc extension
        'application/octet-stream',
        (progress) => {
          item.progress = progress;
          this.notifyStateChange();
        }
      );

      // Success!
      item.status = 'completed';
      item.progress = 100;
      item.completedAt = Date.now();

      // Update statistics
      this.storeService.incrementTotalUploaded(item.fileSize);
      this.storeService.setLastUploadTime(Date.now());

      // Update folder last synced time
      const folder = this.folders.find((f) => f.id === item.syncFolderId);
      if (folder) {
        folder.lastSyncedAt = Date.now();
        this.storeService.updateSyncFolder(folder.id, { lastSyncedAt: folder.lastSyncedAt });
      }

      console.log(`Upload completed: ${item.relativePath}`);

      // Remove completed item from queue after a short delay
      setTimeout(() => {
        const index = this.queue.findIndex((q) => q.id === item.id);
        if (index !== -1) {
          this.queue.splice(index, 1);
          this.notifyStateChange();
        }
      }, 3000);

    } catch (error) {
      console.error(`Upload failed: ${item.relativePath}`, error);
      
      item.status = 'error';
      item.error = error instanceof Error ? error.message : 'Unknown error';

      // Pause on error if configured
      if (this.settings.pauseOnError) {
        console.log('Pausing sync due to error');
        this.pause();
        this.emit('error', { item, error });
      }
    }

    this.isProcessing = false;
    this.currentUpload = null;
    this.notifyStateChange();

    // Schedule next upload with additional delay between files
    if (!this.isPaused) {
      const betweenFileDelay = this.settings.minUploadDelay * 1000 * (0.5 + Math.random() * 0.5);
      setTimeout(() => {
        this.scheduleNextUpload();
      }, betweenFileDelay);
    }
  }

  /**
   * Handle watcher errors
   */
  private handleWatcherError(error: { folderId: string; error: Error }): void {
    console.error(`Watcher error for folder ${error.folderId}:`, error.error);
    
    if (this.settings.pauseOnError) {
      this.pause();
    }

    this.emit('watcher-error', error);
  }

  /**
   * Notify renderer of state changes
   */
  private notifyStateChange(): void {
    this.stateCallback(this.getState());
  }
}
