/**
 * TAAS Desktop - Main Process Entry Point
 * 
 * This is the main Electron process that handles:
 * - Window management
 * - IPC communication with renderer
 * - Folder watching
 * - Upload queue management
 * - Telegram MTProto integration
 */

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from './utils/electron-toolkit';
import { SyncManager } from './services/sync-manager';
import { TelegramService } from './services/telegram-service';
import { StoreService } from './services/store-service';
import { IPC_CHANNELS } from '../shared/types';

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let syncManager: SyncManager | null = null;
let telegramService: TelegramService | null = null;
let storeService: StoreService | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false, // Custom titlebar
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Initialize services
function initializeServices(): void {
  storeService = new StoreService();
  telegramService = new TelegramService(storeService);
  syncManager = new SyncManager(storeService, telegramService, (state) => {
    // Send state updates to renderer
    mainWindow?.webContents.send(IPC_CHANNELS.SYNC_STATE_CHANGED, state);
  });
}

// Set up IPC handlers
function setupIpcHandlers(): void {
  if (!syncManager || !telegramService || !storeService) {
    throw new Error('Services not initialized');
  }

  // === Sync Control ===
  ipcMain.handle(IPC_CHANNELS.SYNC_ENABLE, async () => {
    return syncManager!.enable();
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_DISABLE, async () => {
    return syncManager!.disable();
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_PAUSE, async () => {
    return syncManager!.pause();
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_RESUME, async () => {
    return syncManager!.resume();
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_GET_STATE, async () => {
    return syncManager!.getState();
  });

  // === Folder Management ===
  ipcMain.handle(IPC_CHANNELS.FOLDER_SELECT, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Folder to Sync',
      buttonLabel: 'Select Folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.FOLDER_ADD, async (_, folderPath: string, remoteFolderName: string) => {
    return syncManager!.addFolder(folderPath, remoteFolderName);
  });

  ipcMain.handle(IPC_CHANNELS.FOLDER_REMOVE, async (_, folderId: string) => {
    return syncManager!.removeFolder(folderId);
  });

  ipcMain.handle(IPC_CHANNELS.FOLDER_ENABLE, async (_, folderId: string) => {
    return syncManager!.enableFolder(folderId);
  });

  ipcMain.handle(IPC_CHANNELS.FOLDER_DISABLE, async (_, folderId: string) => {
    return syncManager!.disableFolder(folderId);
  });

  // === Queue Management ===
  ipcMain.handle(IPC_CHANNELS.QUEUE_GET, async () => {
    return syncManager!.getQueue();
  });

  ipcMain.handle(IPC_CHANNELS.QUEUE_CLEAR, async () => {
    return syncManager!.clearQueue();
  });

  ipcMain.handle(IPC_CHANNELS.QUEUE_REMOVE_ITEM, async (_, itemId: string) => {
    return syncManager!.removeFromQueue(itemId);
  });

  // === Telegram Auth ===
  ipcMain.handle(IPC_CHANNELS.TELEGRAM_AUTH_START, async (_, phoneNumber: string) => {
    return telegramService!.startAuth(phoneNumber);
  });

  ipcMain.handle(IPC_CHANNELS.TELEGRAM_AUTH_CODE, async (_, code: string) => {
    return telegramService!.submitCode(code);
  });

  ipcMain.handle(IPC_CHANNELS.TELEGRAM_AUTH_PASSWORD, async (_, password: string) => {
    return telegramService!.submit2FAPassword(password);
  });

  ipcMain.handle(IPC_CHANNELS.TELEGRAM_AUTH_STATE, async () => {
    return telegramService!.getAuthState();
  });

  ipcMain.handle(IPC_CHANNELS.TELEGRAM_AUTH_LOGOUT, async () => {
    await telegramService!.logout();
    await syncManager!.disable();
    return true;
  });

  // === Channel Management ===
  ipcMain.handle(IPC_CHANNELS.CHANNEL_LIST, async () => {
    return telegramService!.getChannels();
  });

  ipcMain.handle(IPC_CHANNELS.CHANNEL_SELECT, async (_, channelId: string) => {
    return syncManager!.selectChannel(channelId);
  });

  ipcMain.handle(IPC_CHANNELS.CHANNEL_CREATE, async (_, name: string) => {
    return telegramService!.createStorageChannel(name);
  });

  // === Settings ===
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    return storeService!.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, settings) => {
    storeService!.updateSettings(settings);
    syncManager!.applySettings(settings);
    return true;
  });

  // === App Control ===
  ipcMain.handle(IPC_CHANNELS.APP_MINIMIZE, async () => {
    mainWindow?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.APP_CLOSE, async () => {
    mainWindow?.close();
  });

  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, async () => {
    return app.getVersion();
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.taas.desktop');

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  initializeServices();
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Clean shutdown
  if (syncManager) {
    await syncManager.shutdown();
  }
  if (telegramService) {
    await telegramService.disconnect();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle second instance attempt
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
