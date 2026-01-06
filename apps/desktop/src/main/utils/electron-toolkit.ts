/**
 * Electron Toolkit Utils
 * 
 * Minimal reimplementation of @electron-toolkit/utils
 * to avoid external dependency issues.
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { platform } from 'os';

/**
 * Check if running in development mode
 */
export const is = {
  dev: process.env.NODE_ENV === 'development' || !app.isPackaged,
  mac: platform() === 'darwin',
  windows: platform() === 'win32',
  linux: platform() === 'linux',
};

/**
 * Set the app user model ID for Windows
 */
export const electronApp = {
  setAppUserModelId: (id: string) => {
    if (is.windows) {
      app.setAppUserModelId(id);
    }
  },
};

/**
 * Watch window shortcuts (F12 for DevTools in dev mode)
 */
export const optimizer = {
  watchWindowShortcuts: (window: BrowserWindow) => {
    if (is.dev) {
      window.webContents.on('before-input-event', (event, input) => {
        // F12 to toggle DevTools
        if (input.key === 'F12') {
          window.webContents.toggleDevTools();
          event.preventDefault();
        }
        // Cmd/Ctrl+R to reload
        if ((input.meta || input.control) && input.key === 'r') {
          window.webContents.reload();
          event.preventDefault();
        }
      });
    }
  },
};

/**
 * Externalize dependencies plugin for electron-vite
 * This is a simple pass-through since we handle it in vite config
 */
export function externalizeDepsPlugin() {
  return {
    name: 'externalize-deps',
    enforce: 'pre' as const,
    resolveId(id: string) {
      // Externalize node built-ins and electron
      if (id.startsWith('node:') || id === 'electron') {
        return { id, external: true };
      }
      return null;
    },
  };
}
