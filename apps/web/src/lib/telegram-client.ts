/**
 * Browser-based Telegram Client Manager
 * 
 * Manages MTProto client lifecycle in the browser.
 * Session is stored encrypted in IndexedDB for persistence.
 * 
 * This allows direct browser-to-Telegram communication,
 * bypassing the server for file uploads/downloads.
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

// IndexedDB configuration
const DB_NAME = 'taas-telegram';
const DB_VERSION = 1;
const STORE_NAME = 'session';
const SESSION_KEY = 'telegram-session';

// Telegram API credentials (safe to expose - identifies app, not user)
const API_ID = parseInt(import.meta.env.VITE_TELEGRAM_API_ID || '0');
const API_HASH = import.meta.env.VITE_TELEGRAM_API_HASH || '';

// Singleton client instance
let clientInstance: TelegramClient | null = null;
let isInitializing = false;
let initPromise: Promise<TelegramClient> | null = null;

/**
 * IndexedDB wrapper for session storage
 */
class SessionStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async saveSession(sessionString: string): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Encrypt the session before storing (basic XOR with timestamp)
      // In production, use a proper encryption key derived from user's master password
      const encrypted = this.encrypt(sessionString);
      
      const request = store.put(encrypted, SESSION_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadSession(): Promise<string | null> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(SESSION_KEY);

      request.onsuccess = () => {
        const encrypted = request.result;
        if (encrypted) {
          resolve(this.decrypt(encrypted));
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearSession(): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(SESSION_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Simple encryption for session storage
  // This provides obfuscation, not security
  // For true security, derive key from user's master password
  private encrypt(data: string): string {
    const key = this.getEncryptionKey();
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  private decrypt(encrypted: string): string {
    const key = this.getEncryptionKey();
    const data = atob(encrypted);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }

  private getEncryptionKey(): string {
    // Use a combination of static + dynamic values
    // This is obfuscation, not cryptographic security
    const ua = navigator.userAgent.slice(0, 32);
    const host = window.location.host;
    return `taas-${ua}-${host}`.slice(0, 32);
  }
}

// Singleton session storage
const sessionStorage = new SessionStorage();

/**
 * Initialize or get existing Telegram client
 * 
 * @param sessionString - Optional session string from server
 * @returns Initialized TelegramClient
 */
export async function getTelegramClient(sessionString?: string): Promise<TelegramClient> {
  // Return existing client if connected
  if (clientInstance?.connected) {
    return clientInstance;
  }

  // Wait if already initializing
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // Start initialization
  isInitializing = true;
  initPromise = initializeClient(sessionString);

  try {
    const client = await initPromise;
    return client;
  } finally {
    isInitializing = false;
    initPromise = null;
  }
}

async function initializeClient(providedSession?: string): Promise<TelegramClient> {
  // Validate API credentials
  if (!API_ID || !API_HASH) {
    throw new Error(
      'Telegram API credentials not configured. ' +
      'Set VITE_TELEGRAM_API_ID and VITE_TELEGRAM_API_HASH in .env'
    );
  }

  // Try to load session from storage, or use provided session
  let sessionString = providedSession;
  
  if (!sessionString) {
    sessionString = await sessionStorage.loadSession() || '';
  }

  console.log('[TelegramClient] Initializing with session:', sessionString ? 'Existing' : 'New');

  const session = new StringSession(sessionString);
  
  clientInstance = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
    useWSS: true, // Use WebSocket Secure for browser
  });

  await clientInstance.connect();

  // If we have a session, verify it's valid
  if (sessionString) {
    try {
      await clientInstance.getMe();
      console.log('[TelegramClient] Session valid, connected');
    } catch (error) {
      console.log('[TelegramClient] Session invalid, clearing');
      await sessionStorage.clearSession();
      // Session is invalid, but client is still connected
      // User will need to authenticate
    }
  }

  // Populate entity cache
  try {
    await clientInstance.getDialogs({ limit: 50 });
    console.log('[TelegramClient] Entity cache populated');
  } catch (error) {
    console.warn('[TelegramClient] Failed to populate entity cache:', error);
  }

  return clientInstance;
}

/**
 * Save the current session to IndexedDB
 * Call this after successful authentication
 */
export async function saveSession(): Promise<void> {
  if (!clientInstance) {
    throw new Error('No client initialized');
  }

  const sessionString = clientInstance.session.save() as unknown as string;
  await sessionStorage.saveSession(sessionString);
  console.log('[TelegramClient] Session saved to IndexedDB');
}

/**
 * Get session string for backup or transfer
 */
export function getSessionString(): string | null {
  if (!clientInstance) {
    return null;
  }
  return clientInstance.session.save() as unknown as string;
}

/**
 * Set session from server (during login)
 * The server authenticates and provides session, we store it locally
 */
export async function setSessionFromServer(sessionString: string): Promise<TelegramClient> {
  // Clear any existing session
  if (clientInstance) {
    await clientInstance.disconnect();
    clientInstance = null;
  }

  // Initialize with new session
  const client = await getTelegramClient(sessionString);
  
  // Save to IndexedDB
  await sessionStorage.saveSession(sessionString);
  
  return client;
}

/**
 * Check if client is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const client = await getTelegramClient();
    if (!client.connected) {
      return false;
    }
    await client.getMe();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Disconnect and clear session
 */
export async function logout(): Promise<void> {
  if (clientInstance) {
    try {
      await clientInstance.disconnect();
    } catch (error) {
      console.warn('[TelegramClient] Error disconnecting:', error);
    }
    clientInstance = null;
  }
  
  await sessionStorage.clearSession();
  console.log('[TelegramClient] Logged out and session cleared');
}

/**
 * Get user info from Telegram
 */
export async function getTelegramUser() {
  const client = await getTelegramClient();
  return await client.getMe();
}

/**
 * Get user's dialogs (channels, groups, chats)
 */
export async function getDialogs() {
  const client = await getTelegramClient();
  return await client.getDialogs({ limit: 100 });
}

/**
 * Resolve a channel/chat by ID
 */
export async function getEntity(entityId: string) {
  const client = await getTelegramClient();
  return await client.getEntity(entityId);
}

/**
 * Export for direct client access when needed
 */
export function getClient(): TelegramClient | null {
  return clientInstance;
}
