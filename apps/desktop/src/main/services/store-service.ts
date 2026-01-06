/**
 * Store Service
 * 
 * Persistent storage for app configuration using electron-store.
 * All data is stored locally and encrypted.
 */

import Store from 'electron-store';
import {
  SyncFolder,
  SyncSettings,
  DEFAULT_SYNC_SETTINGS,
  TelegramAuthState,
} from '../../shared/types';

interface StoreSchema {
  // Telegram session (encrypted string from GramJS)
  telegramSession?: string;
  
  // Selected storage channel
  selectedChannelId?: string;
  selectedChannelName?: string;
  
  // Sync folders
  syncFolders: SyncFolder[];
  
  // Sync settings
  syncSettings: SyncSettings;
  
  // Master encryption key (base64 encoded, generated locally)
  masterKey?: string;
  
  // Statistics
  totalUploaded: number;
  lastUploadTime?: number;
}

export class StoreService {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'taas-desktop-config',
      encryptionKey: 'taas-desktop-local-encryption', // Basic encryption for config
      defaults: {
        syncFolders: [],
        syncSettings: DEFAULT_SYNC_SETTINGS,
        totalUploaded: 0,
      },
    });
  }

  // === Telegram Session ===
  getTelegramSession(): string | undefined {
    return this.store.get('telegramSession');
  }

  setTelegramSession(session: string): void {
    this.store.set('telegramSession', session);
  }

  clearTelegramSession(): void {
    this.store.delete('telegramSession');
  }

  // === Channel ===
  getSelectedChannel(): { id?: string; name?: string } {
    return {
      id: this.store.get('selectedChannelId'),
      name: this.store.get('selectedChannelName'),
    };
  }

  setSelectedChannel(id: string, name: string): void {
    this.store.set('selectedChannelId', id);
    this.store.set('selectedChannelName', name);
  }

  clearSelectedChannel(): void {
    this.store.delete('selectedChannelId');
    this.store.delete('selectedChannelName');
  }

  // === Sync Folders ===
  getSyncFolders(): SyncFolder[] {
    return this.store.get('syncFolders') || [];
  }

  setSyncFolders(folders: SyncFolder[]): void {
    this.store.set('syncFolders', folders);
  }

  addSyncFolder(folder: SyncFolder): void {
    const folders = this.getSyncFolders();
    folders.push(folder);
    this.setSyncFolders(folders);
  }

  updateSyncFolder(folderId: string, updates: Partial<SyncFolder>): void {
    const folders = this.getSyncFolders();
    const index = folders.findIndex((f) => f.id === folderId);
    if (index !== -1) {
      folders[index] = { ...folders[index], ...updates };
      this.setSyncFolders(folders);
    }
  }

  removeSyncFolder(folderId: string): void {
    const folders = this.getSyncFolders().filter((f) => f.id !== folderId);
    this.setSyncFolders(folders);
  }

  // === Settings ===
  getSettings(): SyncSettings {
    return this.store.get('syncSettings') || DEFAULT_SYNC_SETTINGS;
  }

  updateSettings(updates: Partial<SyncSettings>): void {
    const current = this.getSettings();
    this.store.set('syncSettings', { ...current, ...updates });
  }

  // === Master Key ===
  getMasterKey(): string | undefined {
    return this.store.get('masterKey');
  }

  setMasterKey(key: string): void {
    this.store.set('masterKey', key);
  }

  // === Statistics ===
  getTotalUploaded(): number {
    return this.store.get('totalUploaded') || 0;
  }

  incrementTotalUploaded(bytes: number): void {
    const current = this.getTotalUploaded();
    this.store.set('totalUploaded', current + bytes);
  }

  getLastUploadTime(): number | undefined {
    return this.store.get('lastUploadTime');
  }

  setLastUploadTime(time: number): void {
    this.store.set('lastUploadTime', time);
  }

  // === Full Reset ===
  clearAll(): void {
    this.store.clear();
  }
}
