"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  // Sync control
  SYNC_ENABLE: "sync:enable",
  SYNC_DISABLE: "sync:disable",
  SYNC_PAUSE: "sync:pause",
  SYNC_RESUME: "sync:resume",
  SYNC_GET_STATE: "sync:get-state",
  SYNC_STATE_CHANGED: "sync:state-changed",
  // Folder management
  FOLDER_ADD: "folder:add",
  FOLDER_REMOVE: "folder:remove",
  FOLDER_ENABLE: "folder:enable",
  FOLDER_DISABLE: "folder:disable",
  FOLDER_SELECT: "folder:select",
  // Queue management
  QUEUE_GET: "queue:get",
  QUEUE_CLEAR: "queue:clear",
  QUEUE_REMOVE_ITEM: "queue:remove-item",
  QUEUE_UPDATED: "queue:updated",
  // Telegram auth
  TELEGRAM_AUTH_START: "telegram:auth-start",
  TELEGRAM_AUTH_CODE: "telegram:auth-code",
  TELEGRAM_AUTH_PASSWORD: "telegram:auth-password",
  TELEGRAM_AUTH_STATE: "telegram:auth-state",
  TELEGRAM_AUTH_LOGOUT: "telegram:auth-logout",
  // Channel management
  CHANNEL_LIST: "channel:list",
  CHANNEL_SELECT: "channel:select",
  CHANNEL_CREATE: "channel:create",
  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_UPDATE: "settings:update",
  // App control
  APP_MINIMIZE: "app:minimize",
  APP_CLOSE: "app:close",
  APP_GET_VERSION: "app:get-version"
};
const electronAPI = {
  sync: {
    enable: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SYNC_ENABLE),
    disable: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SYNC_DISABLE),
    pause: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SYNC_PAUSE),
    resume: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SYNC_RESUME),
    getState: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SYNC_GET_STATE),
    onStateChanged: (callback) => {
      const handler = (_, state) => callback(state);
      electron.ipcRenderer.on(IPC_CHANNELS.SYNC_STATE_CHANGED, handler);
      return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.SYNC_STATE_CHANGED, handler);
    }
  },
  folder: {
    select: () => electron.ipcRenderer.invoke(IPC_CHANNELS.FOLDER_SELECT),
    add: (path, remoteFolderName) => electron.ipcRenderer.invoke(IPC_CHANNELS.FOLDER_ADD, path, remoteFolderName),
    remove: (folderId) => electron.ipcRenderer.invoke(IPC_CHANNELS.FOLDER_REMOVE, folderId),
    enable: (folderId) => electron.ipcRenderer.invoke(IPC_CHANNELS.FOLDER_ENABLE, folderId),
    disable: (folderId) => electron.ipcRenderer.invoke(IPC_CHANNELS.FOLDER_DISABLE, folderId)
  },
  queue: {
    get: () => electron.ipcRenderer.invoke(IPC_CHANNELS.QUEUE_GET),
    clear: () => electron.ipcRenderer.invoke(IPC_CHANNELS.QUEUE_CLEAR),
    removeItem: (itemId) => electron.ipcRenderer.invoke(IPC_CHANNELS.QUEUE_REMOVE_ITEM, itemId),
    onUpdated: (callback) => {
      const handler = (_, queue) => callback(queue);
      electron.ipcRenderer.on(IPC_CHANNELS.QUEUE_UPDATED, handler);
      return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.QUEUE_UPDATED, handler);
    }
  },
  telegram: {
    startAuth: (phoneNumber) => electron.ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_START, phoneNumber),
    submitCode: (code) => electron.ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_CODE, code),
    submit2FAPassword: (password) => electron.ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_PASSWORD, password),
    getAuthState: () => electron.ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_STATE),
    logout: () => electron.ipcRenderer.invoke(IPC_CHANNELS.TELEGRAM_AUTH_LOGOUT)
  },
  channel: {
    list: () => electron.ipcRenderer.invoke(IPC_CHANNELS.CHANNEL_LIST),
    select: (channelId) => electron.ipcRenderer.invoke(IPC_CHANNELS.CHANNEL_SELECT, channelId),
    create: (name) => electron.ipcRenderer.invoke(IPC_CHANNELS.CHANNEL_CREATE, name)
  },
  settings: {
    get: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (settings) => electron.ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings)
  },
  app: {
    minimize: () => electron.ipcRenderer.invoke(IPC_CHANNELS.APP_MINIMIZE),
    close: () => electron.ipcRenderer.invoke(IPC_CHANNELS.APP_CLOSE),
    getVersion: () => electron.ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION)
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
