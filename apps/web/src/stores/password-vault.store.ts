import { create } from 'zustand';
import { 
  passwordVaultApi, 
  PasswordEntry, 
  PasswordCategory, 
  PasswordSecurityEvent,
  PasswordStrengthCheck,
  PasswordGenerationOptions
} from '@/lib/plugins-api';

interface PasswordVaultState {
  // Data
  passwords: PasswordEntry[];
  selectedPassword: PasswordEntry | null;
  categories: PasswordCategory[];
  securityEvents: PasswordSecurityEvent[];
  dashboardStats: any;
  
  // Pagination
  totalPasswords: number;
  currentPage: number;
  hasMore: boolean;
  
  // Filters
  filters: {
    category?: string;
    search?: string;
    tags?: string[];
    isFavorite?: boolean;
  };
  sortBy: 'name' | 'createdAt' | 'lastUsedAt' | 'category';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
  
  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Master key management (in a real app, this should be handled more securely)
  masterKey: string | null;
  isMasterKeySet: boolean;

  // Actions - Dashboard
  fetchDashboard: () => Promise<void>;
  
  // Actions - Passwords
  fetchPasswords: (page?: number) => Promise<void>;
  fetchPassword: (id: string) => Promise<void>;
  createPassword: (data: {
    name: string;
    username?: string;
    password: string;
    url?: string;
    notes?: string;
    category?: string;
    tags?: string[];
    customFields?: any;
  }) => Promise<PasswordEntry>;
  updatePassword: (id: string, data: Partial<PasswordEntry>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  copyPassword: (id: string) => Promise<void>;
  
  // Actions - Categories
  fetchCategories: () => Promise<void>;
  createCategory: (data: {
    name: string;
    color?: string;
    icon?: string;
  }) => Promise<PasswordCategory>;
  updateCategory: (id: string, data: Partial<PasswordCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Actions - Security
  fetchSecurityEvents: () => Promise<void>;
  
  // Actions - Password Generation
  generatePassword: (options?: PasswordGenerationOptions) => Promise<string>;
  checkPasswordStrength: (password: string) => Promise<PasswordStrengthCheck>;
  
  // Actions - Export
  exportPasswords: () => Promise<void>;
  
  // Actions - Master Key
  setMasterKey: (key: string) => void;
  clearMasterKey: () => void;
  
  // Actions - Filters & Sorting
  setFilters: (filters: Partial<PasswordVaultState['filters']>) => void;
  setSorting: (sortBy: PasswordVaultState['sortBy'], sortOrder: PasswordVaultState['sortOrder']) => void;
  setViewMode: (mode: PasswordVaultState['viewMode']) => void;
  
  // Actions - UI State
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const usePasswordVaultStore = create<PasswordVaultState>((set, get) => ({
  // Initial State
  passwords: [],
  selectedPassword: null,
  categories: [],
  securityEvents: [],
  dashboardStats: null,
  
  totalPasswords: 0,
  currentPage: 1,
  hasMore: false,
  
  filters: {},
  sortBy: 'name',
  sortOrder: 'asc',
  viewMode: 'list',
  
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  
  masterKey: null,
  isMasterKeySet: false,

  // Actions - Dashboard
  fetchDashboard: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await passwordVaultApi.getDashboard();
      set({ 
        dashboardStats: response.data.data,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch dashboard data',
        isLoading: false 
      });
    }
  },

  // Actions - Passwords
  fetchPasswords: async (page = 1) => {
    try {
      set({ isLoading: true, error: null });
      const { filters, sortBy, sortOrder } = get();
      
      const response = await passwordVaultApi.getPasswords({
        ...filters,
        sortBy,
        sortOrder,
        page,
        limit: 50
      });
      
      set({ 
        passwords: page === 1 ? response.data.data : [...get().passwords, ...response.data.data],
        totalPasswords: response.data.meta.total,
        currentPage: page,
        hasMore: response.data.meta.hasMore,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch passwords',
        isLoading: false 
      });
    }
  },

  fetchPassword: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const { masterKey } = get();
      
      if (!masterKey) {
        throw new Error('Master key is required to decrypt password');
      }
      
      const response = await passwordVaultApi.getPassword(id, masterKey);
      set({ 
        selectedPassword: response.data.data,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch password',
        isLoading: false 
      });
    }
  },

  createPassword: async (data) => {
    try {
      set({ isCreating: true, error: null });
      const { masterKey } = get();
      
      if (!masterKey) {
        throw new Error('Master key is required to encrypt password');
      }
      
      const response = await passwordVaultApi.createPassword(data, masterKey);
      const newPassword = response.data.data;
      
      set(state => ({ 
        passwords: [newPassword, ...state.passwords],
        totalPasswords: state.totalPasswords + 1,
        isCreating: false 
      }));
      
      return newPassword;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to create password',
        isCreating: false 
      });
      throw error;
    }
  },

  updatePassword: async (id: string, data) => {
    try {
      set({ isUpdating: true, error: null });
      const { masterKey } = get();
      
      if (!masterKey) {
        throw new Error('Master key is required to encrypt password');
      }
      
      const response = await passwordVaultApi.updatePassword(id, data, masterKey);
      const updatedPassword = response.data.data;
      
      set(state => ({
        passwords: state.passwords.map(p => p.id === id ? updatedPassword : p),
        selectedPassword: state.selectedPassword?.id === id ? updatedPassword : state.selectedPassword,
        isUpdating: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to update password',
        isUpdating: false 
      });
    }
  },

  deletePassword: async (id: string) => {
    try {
      set({ isDeleting: true, error: null });
      await passwordVaultApi.deletePassword(id);
      
      set(state => ({
        passwords: state.passwords.filter(p => p.id !== id),
        selectedPassword: state.selectedPassword?.id === id ? null : state.selectedPassword,
        totalPasswords: state.totalPasswords - 1,
        isDeleting: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to delete password',
        isDeleting: false 
      });
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      const password = get().passwords.find(p => p.id === id);
      if (!password) return;
      
      await get().updatePassword(id, { isFavorite: !password.isFavorite });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  },

  copyPassword: async (id: string) => {
    try {
      const { masterKey } = get();
      if (!masterKey) {
        throw new Error('Master key is required');
      }
      
      const response = await passwordVaultApi.getPassword(id, masterKey);
      const password = response.data.data.password;
      
      if (password) {
        await navigator.clipboard.writeText(password);
        // Update last used
        await passwordVaultApi.updatePassword(id, { lastUsedAt: new Date().toISOString() }, masterKey);
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to copy password',
      });
    }
  },

  // Actions - Categories
  fetchCategories: async () => {
    try {
      const response = await passwordVaultApi.getCategories();
      set({ categories: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  },

  createCategory: async (data) => {
    try {
      const response = await passwordVaultApi.createCategory(data);
      const newCategory = response.data.data;
      
      set(state => ({
        categories: [...state.categories, newCategory]
      }));
      
      return newCategory;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to create category',
      });
      throw error;
    }
  },

  updateCategory: async (id: string, data) => {
    try {
      const response = await passwordVaultApi.updateCategory(id, data);
      const updatedCategory = response.data.data;
      
      set(state => ({
        categories: state.categories.map(c => c.id === id ? updatedCategory : c)
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to update category',
      });
    }
  },

  deleteCategory: async (id: string) => {
    try {
      await passwordVaultApi.deleteCategory(id);
      
      set(state => ({
        categories: state.categories.filter(c => c.id !== id)
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to delete category',
      });
    }
  },

  // Actions - Security
  fetchSecurityEvents: async () => {
    try {
      const response = await passwordVaultApi.getSecurityEvents(50);
      set({ securityEvents: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch security events:', error);
    }
  },

  // Actions - Password Generation
  generatePassword: async (options) => {
    try {
      const response = await passwordVaultApi.generatePassword(options);
      return response.data.data.password;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to generate password',
      });
      throw error;
    }
  },

  checkPasswordStrength: async (password: string) => {
    try {
      const response = await passwordVaultApi.checkPasswordStrength(password);
      return response.data.data;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to check password strength',
      });
      throw error;
    }
  },

  // Actions - Export
  exportPasswords: async () => {
    try {
      const { masterKey } = get();
      if (!masterKey) {
        throw new Error('Master key is required to export passwords');
      }
      
      const response = await passwordVaultApi.exportCSV(masterKey);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'passwords.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to export passwords',
      });
    }
  },

  // Actions - Master Key
  setMasterKey: (key: string) => {
    set({ 
      masterKey: key,
      isMasterKeySet: true 
    });
    // In a real app, you might want to store this securely (e.g., in session storage with encryption)
  },

  clearMasterKey: () => {
    set({ 
      masterKey: null,
      isMasterKeySet: false,
      selectedPassword: null 
    });
  },

  // Actions - Filters & Sorting
  setFilters: (filters) => {
    set(state => ({ 
      filters: { ...state.filters, ...filters },
      currentPage: 1 
    }));
    get().fetchPasswords(1);
  },

  setSorting: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().fetchPasswords(1);
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  // Actions - UI State
  clearError: () => set({ error: null }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
