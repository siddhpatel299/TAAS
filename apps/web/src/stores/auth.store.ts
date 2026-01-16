import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface StorageChannel {
  channelId: string;
  channelName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  storageChannel: StorageChannel | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setStorageChannel: (channel: StorageChannel | null) => void;
  login: (user: User, token: string, storageChannel?: StorageChannel | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      storageChannel: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token });
      },
      setStorageChannel: (storageChannel) => set({ storageChannel }),
      login: (user, token, storageChannel = null) => {
        localStorage.setItem('token', token);
        set({ user, token, storageChannel, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, storageChannel: null, isAuthenticated: false });
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, storageChannel: state.storageChannel }),
    }
  )
);
