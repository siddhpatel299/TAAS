import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OSWindowState {
  id: string;
  appId: string;
  route: string;
  title: string;
  isMinimized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  zIndex: number;
}

export interface OSNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
}

export type ColorMode = 'light' | 'dark';
export type OSStyle = 'normal' | 'hud';
export type SnapPosition = 'left' | 'right' | 'full';

interface OSState {
  windows: OSWindowState[];
  activeWindowId: string | null;
  isStartMenuOpen: boolean;
  bootComplete: boolean;
  wallpaper: string;
  desktopIconSize: 'small' | 'medium' | 'large';
  colorMode: ColorMode;
  osStyle: OSStyle;
  nextZIndex: number;
  notifications: OSNotification[];
  showNotificationCenter: boolean;
  showSpotlight: boolean;
  hudSoundMuted: boolean;

  openApp: (appId: string, route: string, title: string) => void;
  closeWindow: (windowId: string) => string | null;
  minimizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  setBootComplete: (v: boolean) => void;
  setWallpaper: (w: string) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  setOSStyle: (style: OSStyle) => void;
  toggleOSStyle: () => void;
  updateWindowRoute: (windowId: string, route: string, title?: string) => void;
  getWindowByRoute: (route: string) => OSWindowState | undefined;

  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  bringToFront: (windowId: string) => void;
  minimizeAllWindows: () => void;
  snapWindow: (windowId: string, position: SnapPosition) => void;

  addNotification: (notification: Omit<OSNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  toggleNotificationCenter: () => void;
  toggleSpotlight: () => void;
  closeSpotlight: () => void;
  toggleHudSoundMuted: () => void;
}

let windowCounter = 0;
let notificationCounter = 0;

const DEFAULT_WIDTH = 80;   // percentage of viewport
const DEFAULT_HEIGHT = 80;
const STACK_OFFSET = 30;    // px offset per stacked window

export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindowId: null,
      isStartMenuOpen: false,
      bootComplete: false,
      wallpaper: 'gradient-mesh',
      desktopIconSize: 'medium',
      colorMode: 'dark' as ColorMode,
      osStyle: 'normal' as OSStyle,
      nextZIndex: 10,
      notifications: [],
      showNotificationCenter: false,
      showSpotlight: false,
      hudSoundMuted: false,

      openApp: (appId, route, title) => {
        const existing = get().windows.find(
          (w) => w.appId === appId && !w.isMinimized
        );
        if (existing) {
          const nz = get().nextZIndex + 1;
          set({
            windows: get().windows.map((w) =>
              w.id === existing.id ? { ...w, zIndex: nz } : w
            ),
            activeWindowId: existing.id,
            isStartMenuOpen: false,
            nextZIndex: nz,
          });
          return;
        }

        const minimized = get().windows.find(
          (w) => w.appId === appId && w.isMinimized
        );
        if (minimized) {
          const nz = get().nextZIndex + 1;
          set({
            windows: get().windows.map((w) =>
              w.id === minimized.id ? { ...w, isMinimized: false, zIndex: nz } : w
            ),
            activeWindowId: minimized.id,
            isStartMenuOpen: false,
            nextZIndex: nz,
          });
          return;
        }

        const id = `win-${++windowCounter}-${Date.now()}`;
        const stackIdx = get().windows.length;
        const nz = get().nextZIndex + 1;

        const newWindow: OSWindowState = {
          id,
          appId,
          route,
          title,
          isMinimized: false,
          x: 10 + stackIdx * STACK_OFFSET,
          y: 10 + stackIdx * STACK_OFFSET,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          isMaximized: true,
          zIndex: nz,
        };

        set({
          windows: [...get().windows, newWindow],
          activeWindowId: id,
          isStartMenuOpen: false,
          nextZIndex: nz,
        });
      },

      closeWindow: (windowId) => {
        const windows = get().windows.filter((w) => w.id !== windowId);
        const wasActive = get().activeWindowId === windowId;
        const nextActive = wasActive
          ? windows.filter((w) => !w.isMinimized).pop()?.id ?? null
          : get().activeWindowId;

        set({ windows, activeWindowId: nextActive });
        return nextActive
          ? windows.find((w) => w.id === nextActive)?.route ?? null
          : null;
      },

      minimizeWindow: (windowId) => {
        const windows = get().windows.map((w) =>
          w.id === windowId ? { ...w, isMinimized: true } : w
        );
        const visibleWindows = windows.filter((w) => !w.isMinimized);
        const nextActive = visibleWindows.pop()?.id ?? null;

        set({ windows, activeWindowId: nextActive });
      },

      focusWindow: (windowId) => {
        const nz = get().nextZIndex + 1;
        set({
          windows: get().windows.map((w) =>
            w.id === windowId ? { ...w, isMinimized: false, zIndex: nz } : w
          ),
          activeWindowId: windowId,
          isStartMenuOpen: false,
          nextZIndex: nz,
        });
      },

      toggleStartMenu: () => set({ isStartMenuOpen: !get().isStartMenuOpen }),
      closeStartMenu: () => set({ isStartMenuOpen: false }),
      setBootComplete: (v) => set({ bootComplete: v }),
      setWallpaper: (w) => set({ wallpaper: w }),
      setColorMode: (mode) => set({ colorMode: mode }),
      toggleColorMode: () =>
        set({ colorMode: get().colorMode === 'dark' ? 'light' : 'dark' }),
      setOSStyle: (style) => set({ osStyle: style }),
      toggleOSStyle: () =>
        set({ osStyle: get().osStyle === 'normal' ? 'hud' : 'normal' }),

      updateWindowRoute: (windowId, route, title) => {
        set({
          windows: get().windows.map((w) =>
            w.id === windowId ? { ...w, route, ...(title ? { title } : {}) } : w
          ),
        });
      },

      getWindowByRoute: (route) => {
        return get().windows.find((w) => w.route === route);
      },

      // Window management
      updateWindowPosition: (windowId, x, y) => {
        set({
          windows: get().windows.map((w) =>
            w.id === windowId ? { ...w, x, y } : w
          ),
        });
      },

      updateWindowSize: (windowId, width, height) => {
        set({
          windows: get().windows.map((w) =>
            w.id === windowId ? { ...w, width, height } : w
          ),
        });
      },

      maximizeWindow: (windowId) => {
        const nz = get().nextZIndex + 1;
        set({
          windows: get().windows.map((w) =>
            w.id === windowId ? { ...w, isMaximized: true, zIndex: nz } : w
          ),
          activeWindowId: windowId,
          nextZIndex: nz,
        });
      },

      restoreWindow: (windowId) => {
        set({
          windows: get().windows.map((w) =>
            w.id === windowId ? { ...w, isMaximized: false } : w
          ),
        });
      },

      bringToFront: (windowId) => {
        const nz = get().nextZIndex + 1;
        set({
          windows: get().windows.map((w) =>
            w.id === windowId ? { ...w, zIndex: nz } : w
          ),
          activeWindowId: windowId,
          nextZIndex: nz,
        });
      },

      minimizeAllWindows: () => {
        set({
          windows: get().windows.map((w) => ({ ...w, isMinimized: true })),
          activeWindowId: null,
        });
      },

      snapWindow: (windowId, position) => {
        const nz = get().nextZIndex + 1;
        let updates: Partial<OSWindowState> = { isMaximized: false, zIndex: nz };

        switch (position) {
          case 'left':
            updates = { ...updates, x: 0, y: 0, width: 50, height: 100 };
            break;
          case 'right':
            updates = { ...updates, x: 50, y: 0, width: 50, height: 100 };
            break;
          case 'full':
            updates = { ...updates, isMaximized: true };
            break;
        }

        set({
          windows: get().windows.map((w) =>
            w.id === windowId ? { ...w, ...updates } : w
          ),
          activeWindowId: windowId,
          nextZIndex: nz,
        });
      },

      // Notifications
      addNotification: (notification) => {
        const id = `notif-${++notificationCounter}-${Date.now()}`;
        const newNotif: OSNotification = {
          ...notification,
          id,
          timestamp: Date.now(),
          read: false,
        };
        set({ notifications: [newNotif, ...get().notifications].slice(0, 50) });
      },

      markNotificationRead: (id) => {
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        });
      },

      clearNotifications: () => set({ notifications: [] }),

      toggleNotificationCenter: () =>
        set({ showNotificationCenter: !get().showNotificationCenter }),
      toggleSpotlight: () => set({ showSpotlight: !get().showSpotlight }),
      closeSpotlight: () => set({ showSpotlight: false }),
      toggleHudSoundMuted: () => set((s) => ({ hudSoundMuted: !s.hudSoundMuted })),
    }),
    {
      name: 'taas-os-state',
      partialize: (state) => ({
        wallpaper: state.wallpaper,
        desktopIconSize: state.desktopIconSize,
        colorMode: state.colorMode,
        osStyle: state.osStyle,
        bootComplete: state.bootComplete,
        notifications: state.notifications,
        hudSoundMuted: state.hudSoundMuted,
      }),
    }
  )
);
