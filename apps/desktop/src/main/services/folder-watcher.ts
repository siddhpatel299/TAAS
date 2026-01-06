/**
 * Folder Watcher Service
 * 
 * Watches user-selected folders for file changes using chokidar.
 * Emits events for new/modified files that should be queued for sync.
 */

import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';
import { SyncFolder, FileChangeEvent, SyncSettings, DEFAULT_SYNC_SETTINGS } from '../../shared/types';

interface WatcherEntry {
  folderId: string;
  folderPath: string;
  watcher: chokidar.FSWatcher;
}

export class FolderWatcherService extends EventEmitter {
  private watchers: Map<string, WatcherEntry> = new Map();
  private settings: SyncSettings = DEFAULT_SYNC_SETTINGS;
  private isPaused: boolean = false;

  constructor() {
    super();
  }

  /**
   * Update settings (e.g., ignored patterns)
   */
  updateSettings(settings: SyncSettings): void {
    this.settings = settings;
    // Restart watchers with new ignored patterns
    for (const [folderId, entry] of this.watchers) {
      this.unwatchFolder(folderId);
      this.watchFolder({
        id: folderId,
        localPath: entry.folderPath,
        enabled: true,
        remoteFolderName: '',
        createdAt: Date.now(),
      });
    }
  }

  /**
   * Start watching a folder
   */
  watchFolder(folder: SyncFolder): void {
    if (this.watchers.has(folder.id)) {
      console.log(`Already watching folder: ${folder.localPath}`);
      return;
    }

    // Validate folder exists
    if (!fs.existsSync(folder.localPath)) {
      console.error(`Folder does not exist: ${folder.localPath}`);
      return;
    }

    const watcher = chokidar.watch(folder.localPath, {
      ignored: this.settings.ignoredPatterns.map((pattern) => {
        // Convert glob patterns to regex-friendly format
        if (pattern.startsWith('*')) {
          return new RegExp(pattern.replace(/\*/g, '.*'));
        }
        return pattern;
      }),
      persistent: true,
      ignoreInitial: true, // Don't sync existing files on start
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Wait 2s after last write
        pollInterval: 100,
      },
      depth: 99, // Watch nested folders
      usePolling: false, // Use native watchers when possible
    });

    // Handle file additions
    watcher.on('add', (filePath: string) => {
      if (this.isPaused) return;
      
      this.emitFileChange({
        type: 'add',
        path: filePath,
        syncFolderId: folder.id,
        timestamp: Date.now(),
      });
    });

    // Handle file modifications
    watcher.on('change', (filePath: string) => {
      if (this.isPaused) return;

      this.emitFileChange({
        type: 'change',
        path: filePath,
        syncFolderId: folder.id,
        timestamp: Date.now(),
      });
    });

    // Handle errors
    watcher.on('error', (error: Error) => {
      console.error(`Watcher error for ${folder.localPath}:`, error);
      this.emit('error', { folderId: folder.id, error });
    });

    // Handle ready state
    watcher.on('ready', () => {
      console.log(`Watching folder: ${folder.localPath}`);
      this.emit('ready', { folderId: folder.id });
    });

    this.watchers.set(folder.id, {
      folderId: folder.id,
      folderPath: folder.localPath,
      watcher,
    });
  }

  /**
   * Emit a file change event (with basic validation)
   */
  private emitFileChange(event: FileChangeEvent): void {
    // Skip if file doesn't exist (may have been deleted)
    if (!fs.existsSync(event.path)) {
      return;
    }

    // Skip if it's a directory
    const stats = fs.statSync(event.path);
    if (stats.isDirectory()) {
      return;
    }

    // Skip if file is too large
    if (stats.size > this.settings.maxFileSize) {
      console.warn(`File too large to sync: ${event.path} (${stats.size} bytes)`);
      this.emit('file-too-large', { path: event.path, size: stats.size });
      return;
    }

    // Skip empty files
    if (stats.size === 0) {
      return;
    }

    this.emit('file-change', event);
  }

  /**
   * Stop watching a folder
   */
  async unwatchFolder(folderId: string): Promise<void> {
    const entry = this.watchers.get(folderId);
    if (entry) {
      await entry.watcher.close();
      this.watchers.delete(folderId);
      console.log(`Stopped watching folder: ${entry.folderPath}`);
    }
  }

  /**
   * Pause all watchers (events still fire but are ignored)
   */
  pause(): void {
    this.isPaused = true;
    console.log('Folder watching paused');
  }

  /**
   * Resume all watchers
   */
  resume(): void {
    this.isPaused = false;
    console.log('Folder watching resumed');
  }

  /**
   * Check if a folder is being watched
   */
  isWatching(folderId: string): boolean {
    return this.watchers.has(folderId);
  }

  /**
   * Get the relative path within the sync folder
   */
  getRelativePath(filePath: string, syncFolderId: string): string {
    const entry = this.watchers.get(syncFolderId);
    if (!entry) return path.basename(filePath);
    return path.relative(entry.folderPath, filePath);
  }

  /**
   * Shutdown all watchers
   */
  async shutdown(): Promise<void> {
    for (const [folderId] of this.watchers) {
      await this.unwatchFolder(folderId);
    }
    this.removeAllListeners();
  }
}
