/**
 * Preload Script
 * 
 * Exposes safe APIs to the renderer process via contextBridge.
 * This is the only way the renderer can communicate with the main process.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, SyncSettings, SyncState, TelegramAuthState, SyncFolder, QueuedUpload } from '../shared/types';

// Type-safe API for the renderer
export interface ElectronAPI {
  // Sync control
  sync: {
    enable: () => Promise<boolean>;
    disable: () => Promise<boolean>;
    pause: () => Promise<boolean>;
    resume: () => Promise<boolean>;
    getState: () => Promise<SyncState>;
    onStateChanged: (callback: (state: SyncState) => void) => () => void;
  };

  // Folder management
  folder: {
    select: () => Promise<string | null>;
    add: (path: string, remoteFolderName: string) => Promise<SyncFolder>;
    remove: (folderId: string) => Promise<boolean>;
    enable: (folderId: string) => Promise<boolean>;
    disable: (folderId: string) => Promise<boolean>;
  };

  // Queue management
  queue: {
    get: () => Promise<QueuedUpload[]>;
    clear: () => Promise<boolean>;
    removeItem: (itemId: string) => Promise<boolean>;
    onUpdated: (callback: (queue: QueuedUpload[]) => void) => () => void;
  };

  // Telegram auth
  telegram: {
    startAuth: (phoneNumber: string) => Promise<{ success: boolean; needsCode: boolean }>;
    submitCode: (code: string) => Promise<{ success: boolean; needs2FA?: boolean; error?: string }>;
    submit2FAPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
    getAuthState: () => Promise<TelegramAuthState>;
    logout: () => Promise<boolean>;
  };

  // Channel management
  channel: {
    list: () => Promise<Array<{ id: string; name: string; isSelected: boolean }>>;
    select: (channelId: string) => Promise<boolean>;
    create: (name: string) => Promise<{ id: string; name: string }>;
  };

  // Settings
  settings: {
    get: () => Promise<SyncSettings>;
    update: (settings: Partial<SyncSettings>) => Promise<boolean>;
  };

  // App control
  app: {
    minimize: () => Promise<void>;
    close: () => Promise<void>;
    getVersion: () => Promise<string>;
  };
}

const electronAPI: ElectronAPI = {
  sync: {
    enable: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC_ENABLE),
    disable: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC_DISABLE),
    pause: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC_PAUSE),
    resume: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC_RESUME),
    getState: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC_GET_STATE),
    onStateChanged: (callback) => {
      const handler = (_: unknown, state: SyncState) => callback(state);
      ipcRenderer.on(IPC_CHANNELS.SYNC_STATE_CHANGED, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SYNC_STATE_CHANGED, handler);
    },
  },

  folder: {
    select: () => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_SELECT),
    add: (path, remoteFolderName) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_ADD, path, remoteFolderName),
    remove: (folderId) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_REMOVE, folderId),
    enable: (folderId) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_ENABLE, folderId),
    disable: (folderId) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_DISABLE, folderId),
  },

  queue: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.QUEUE_GET),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.QUEUE_CLEAR),
    removeItem: (itemId) => ipcRenderer.invoke(IPC_CHANNELS.QUEUE_REMOVE_ITEM, itemId),
    onUpdated: (callback) => {
      const handler = (_: unknown, queue: QueuedUpload[]) => callback(queue);
      ipcRenderer.on(IPC_CHANNELS.QUEUE_UPDATED, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.QUEUE_UPDATED, handler);
    },
  },

  telegram: {
    startAuth: (phoneNumber) => ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_START, phoneNumber),
    submitCode: (code) => ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_CODE, code),
    submit2FAPassword: (password) => ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_PASSWORD, password),
    getAuthState: () => ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_STATE),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_LOGOUT),
  },

  channel: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.CHANNEL_LIST),
    select: (channelId) => ipcRenderer.invoke(IPC_CHANNELS.CHANNEL_SELECT, channelId),
    create: (name) => ipcRenderer.invoke(IPC_CHANNELS.CHANNEL_CREATE, name),
  },

  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (settings) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),
  },

  app: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.APP_MINIMIZE),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.APP_CLOSE),
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
