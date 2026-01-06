/**
 * Shared Types for TAAS Desktop
 * 
 * Types used across main and renderer processes
 */

// Sync configuration for a folder
export interface SyncFolder {
  id: string;
  localPath: string;
  remoteFolderId?: string;
  remoteFolderName: string;
  enabled: boolean;
  createdAt: number;
  lastSyncedAt?: number;
}

// Upload queue item
export interface QueuedUpload {
  id: string;
  filePath: string;
  relativePath: string;
  syncFolderId: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'encrypting' | 'uploading' | 'completed' | 'error';
  error?: string;
  progress: number;
  addedAt: number;
  scheduledFor: number; // Timestamp when upload should start
  startedAt?: number;
  completedAt?: number;
}

// Sync status for a folder
export interface SyncStatus {
  folderId: string;
  isWatching: boolean;
  isPaused: boolean;
  pendingUploads: number;
  lastActivity?: number;
  currentUpload?: QueuedUpload;
}

// Global sync state
export interface SyncState {
  isEnabled: boolean;
  isPaused: boolean;
  isAuthenticated: boolean;
  channelId?: string;
  channelName?: string;
  folders: SyncFolder[];
  queue: QueuedUpload[];
  totalUploaded: number;
  lastUploadTime?: number;
}

// Telegram authentication state
export interface TelegramAuthState {
  isAuthenticated: boolean;
  phoneNumber?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
}

// Sync settings
export interface SyncSettings {
  // Delay settings (in seconds)
  minUploadDelay: number; // Default: 30
  maxUploadDelay: number; // Default: 120
  
  // Jitter settings
  jitterFactor: number; // Default: 0.3 (30% variation)
  
  // Behavior settings
  pauseOnError: boolean; // Default: true
  maxRetries: number; // Default: 3
  
  // File settings
  maxFileSize: number; // Default: 2GB (Telegram limit)
  ignoredPatterns: string[]; // Default: ['.DS_Store', 'Thumbs.db', '.git', 'node_modules']
}

// IPC channel names
export const IPC_CHANNELS = {
  // Sync control
  SYNC_ENABLE: 'sync:enable',
  SYNC_DISABLE: 'sync:disable',
  SYNC_PAUSE: 'sync:pause',
  SYNC_RESUME: 'sync:resume',
  SYNC_GET_STATE: 'sync:get-state',
  SYNC_STATE_CHANGED: 'sync:state-changed',
  
  // Folder management
  FOLDER_ADD: 'folder:add',
  FOLDER_REMOVE: 'folder:remove',
  FOLDER_ENABLE: 'folder:enable',
  FOLDER_DISABLE: 'folder:disable',
  FOLDER_SELECT: 'folder:select',
  
  // Queue management
  QUEUE_GET: 'queue:get',
  QUEUE_CLEAR: 'queue:clear',
  QUEUE_REMOVE_ITEM: 'queue:remove-item',
  QUEUE_UPDATED: 'queue:updated',
  
  // Telegram auth
  TELEGRAM_AUTH_START: 'telegram:auth-start',
  TELEGRAM_AUTH_CODE: 'telegram:auth-code',
  TELEGRAM_AUTH_PASSWORD: 'telegram:auth-password',
  TELEGRAM_AUTH_STATE: 'telegram:auth-state',
  TELEGRAM_AUTH_LOGOUT: 'telegram:auth-logout',
  
  // Channel management
  CHANNEL_LIST: 'channel:list',
  CHANNEL_SELECT: 'channel:select',
  CHANNEL_CREATE: 'channel:create',
  
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  
  // App control
  APP_MINIMIZE: 'app:minimize',
  APP_CLOSE: 'app:close',
  APP_GET_VERSION: 'app:get-version',
} as const;

// Default sync settings
export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  minUploadDelay: 30,
  maxUploadDelay: 120,
  jitterFactor: 0.3,
  pauseOnError: true,
  maxRetries: 3,
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  ignoredPatterns: [
    '.DS_Store',
    'Thumbs.db',
    '.git',
    '.gitignore',
    'node_modules',
    '.env',
    '.env.local',
    '*.tmp',
    '*.temp',
    '*.swp',
    '*~',
  ],
};

// File change event from watcher
export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  syncFolderId: string;
  timestamp: number;
}
