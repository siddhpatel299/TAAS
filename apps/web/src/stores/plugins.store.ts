import { create } from 'zustand';
import { pluginsApi, Plugin } from '@/lib/plugins-api';

interface PluginsState {
  availablePlugins: Plugin[];
  enabledPlugins: Plugin[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAvailablePlugins: () => Promise<void>;
  fetchEnabledPlugins: () => Promise<void>;
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
  isPluginEnabled: (pluginId: string) => boolean;
  clearError: () => void;
}

export const usePluginsStore = create<PluginsState>((set, get) => ({
  availablePlugins: [],
  enabledPlugins: [],
  isLoading: false,
  error: null,

  fetchAvailablePlugins: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await pluginsApi.getAvailable();
      set({ availablePlugins: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchEnabledPlugins: async () => {
    try {
      const response = await pluginsApi.getEnabled();
      set({ enabledPlugins: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch enabled plugins:', error);
    }
  },

  enablePlugin: async (pluginId: string) => {
    set({ isLoading: true, error: null });
    try {
      await pluginsApi.enable(pluginId);
      // Refresh both lists
      await get().fetchAvailablePlugins();
      await get().fetchEnabledPlugins();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  disablePlugin: async (pluginId: string) => {
    set({ isLoading: true, error: null });
    try {
      await pluginsApi.disable(pluginId);
      // Refresh both lists
      await get().fetchAvailablePlugins();
      await get().fetchEnabledPlugins();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  isPluginEnabled: (pluginId: string) => {
    const { availablePlugins } = get();
    const plugin = availablePlugins.find(p => p.id === pluginId);
    return plugin?.enabled || false;
  },

  clearError: () => set({ error: null }),
}));
