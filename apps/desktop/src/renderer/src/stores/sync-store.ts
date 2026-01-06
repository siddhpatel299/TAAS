/**
 * Sync Store
 * 
 * Zustand store for managing sync state in the renderer.
 */

import { create } from 'zustand';
import {
  SyncState,
  SyncFolder,
  QueuedUpload,
  SyncSettings,
  TelegramAuthState,
  DEFAULT_SYNC_SETTINGS,
} from '../../../shared/types';

interface SyncStore {
  // State
  syncState: SyncState;
  authState: TelegramAuthState;
  settings: SyncSettings;
  channels: Array<{ id: string; name: string; isSelected: boolean }>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSyncState: (state: SyncState) => void;
  setAuthState: (state: TelegramAuthState) => void;
  setSettings: (settings: SyncSettings) => void;
  setChannels: (channels: Array<{ id: string; name: string; isSelected: boolean }>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API calls
  initialize: () => Promise<void>;
  enableSync: () => Promise<void>;
  disableSync: () => Promise<void>;
  pauseSync: () => Promise<void>;
  resumeSync: () => Promise<void>;
  addFolder: (path: string, remoteName: string) => Promise<SyncFolder | null>;
  removeFolder: (folderId: string) => Promise<void>;
  enableFolder: (folderId: string) => Promise<void>;
  disableFolder: (folderId: string) => Promise<void>;
  selectFolder: () => Promise<string | null>;
  clearQueue: () => Promise<void>;
  removeQueueItem: (itemId: string) => Promise<void>;
  startAuth: (phoneNumber: string) => Promise<{ success: boolean; needsCode: boolean }>;
  submitAuthCode: (code: string) => Promise<{ success: boolean; needs2FA?: boolean; error?: string }>;
  submit2FAPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadChannels: () => Promise<void>;
  selectChannel: (channelId: string) => Promise<void>;
  createChannel: (name: string) => Promise<void>;
  updateSettings: (settings: Partial<SyncSettings>) => Promise<void>;
}

const initialSyncState: SyncState = {
  isEnabled: false,
  isPaused: false,
  isAuthenticated: false,
  folders: [],
  queue: [],
  totalUploaded: 0,
};

export const useSyncStore = create<SyncStore>((set, get) => ({
  syncState: initialSyncState,
  authState: { isAuthenticated: false },
  settings: DEFAULT_SYNC_SETTINGS,
  channels: [],
  isLoading: true,
  error: null,

  setSyncState: (state) => set({ syncState: state }),
  setAuthState: (state) => set({ authState: state }),
  setSettings: (settings) => set({ settings }),
  setChannels: (channels) => set({ channels }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get initial states
      const [syncState, authState, settings] = await Promise.all([
        window.electronAPI.sync.getState(),
        window.electronAPI.telegram.getAuthState(),
        window.electronAPI.settings.get(),
      ]);

      set({ syncState, authState, settings, isLoading: false });

      // Set up state change listener
      window.electronAPI.sync.onStateChanged((newState) => {
        set({ syncState: newState });
      });

      // Load channels if authenticated
      if (authState.isAuthenticated) {
        get().loadChannels();
      }
    } catch (error) {
      set({ error: 'Failed to initialize', isLoading: false });
      console.error('Init error:', error);
    }
  },

  enableSync: async () => {
    try {
      await window.electronAPI.sync.enable();
    } catch (error) {
      set({ error: 'Failed to enable sync' });
    }
  },

  disableSync: async () => {
    try {
      await window.electronAPI.sync.disable();
    } catch (error) {
      set({ error: 'Failed to disable sync' });
    }
  },

  pauseSync: async () => {
    try {
      await window.electronAPI.sync.pause();
    } catch (error) {
      set({ error: 'Failed to pause sync' });
    }
  },

  resumeSync: async () => {
    try {
      await window.electronAPI.sync.resume();
    } catch (error) {
      set({ error: 'Failed to resume sync' });
    }
  },

  addFolder: async (path, remoteName) => {
    try {
      return await window.electronAPI.folder.add(path, remoteName);
    } catch (error) {
      set({ error: 'Failed to add folder' });
      return null;
    }
  },

  removeFolder: async (folderId) => {
    try {
      await window.electronAPI.folder.remove(folderId);
    } catch (error) {
      set({ error: 'Failed to remove folder' });
    }
  },

  enableFolder: async (folderId) => {
    try {
      await window.electronAPI.folder.enable(folderId);
    } catch (error) {
      set({ error: 'Failed to enable folder' });
    }
  },

  disableFolder: async (folderId) => {
    try {
      await window.electronAPI.folder.disable(folderId);
    } catch (error) {
      set({ error: 'Failed to disable folder' });
    }
  },

  selectFolder: async () => {
    try {
      return await window.electronAPI.folder.select();
    } catch (error) {
      set({ error: 'Failed to select folder' });
      return null;
    }
  },

  clearQueue: async () => {
    try {
      await window.electronAPI.queue.clear();
    } catch (error) {
      set({ error: 'Failed to clear queue' });
    }
  },

  removeQueueItem: async (itemId) => {
    try {
      await window.electronAPI.queue.removeItem(itemId);
    } catch (error) {
      set({ error: 'Failed to remove item from queue' });
    }
  },

  startAuth: async (phoneNumber) => {
    try {
      set({ error: null });
      return await window.electronAPI.telegram.startAuth(phoneNumber);
    } catch (error) {
      set({ error: 'Failed to start authentication' });
      return { success: false, needsCode: false };
    }
  },

  submitAuthCode: async (code) => {
    try {
      set({ error: null });
      const result = await window.electronAPI.telegram.submitCode(code);
      if (result.success) {
        const authState = await window.electronAPI.telegram.getAuthState();
        set({ authState });
        get().loadChannels();
      }
      return result;
    } catch (error) {
      set({ error: 'Failed to verify code' });
      return { success: false, error: 'Unknown error' };
    }
  },

  submit2FAPassword: async (password) => {
    try {
      set({ error: null });
      const result = await window.electronAPI.telegram.submit2FAPassword(password);
      if (result.success) {
        const authState = await window.electronAPI.telegram.getAuthState();
        set({ authState });
        get().loadChannels();
      }
      return result;
    } catch (error) {
      set({ error: 'Failed to verify password' });
      return { success: false, error: 'Unknown error' };
    }
  },

  logout: async () => {
    try {
      await window.electronAPI.telegram.logout();
      set({
        authState: { isAuthenticated: false },
        channels: [],
        syncState: { ...get().syncState, isEnabled: false, isAuthenticated: false },
      });
    } catch (error) {
      set({ error: 'Failed to logout' });
    }
  },

  loadChannels: async () => {
    try {
      const channels = await window.electronAPI.channel.list();
      set({ channels });
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  },

  selectChannel: async (channelId) => {
    try {
      await window.electronAPI.channel.select(channelId);
      await get().loadChannels();
    } catch (error) {
      set({ error: 'Failed to select channel' });
    }
  },

  createChannel: async (name) => {
    try {
      await window.electronAPI.channel.create(name);
      await get().loadChannels();
    } catch (error) {
      set({ error: 'Failed to create channel' });
    }
  },

  updateSettings: async (settings) => {
    try {
      await window.electronAPI.settings.update(settings);
      const newSettings = await window.electronAPI.settings.get();
      set({ settings: newSettings });
    } catch (error) {
      set({ error: 'Failed to update settings' });
    }
  },
}));
