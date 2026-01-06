/**
 * Telegram Service for Desktop
 * 
 * Handles MTProto authentication and file uploads using GramJS.
 * This runs in the main Electron process.
 */

import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CustomFile } from 'telegram/client/uploads';
import bigInt from 'big-integer';
import { StoreService } from './store-service';
import { TelegramAuthState } from '../../shared/types';

// You must provide your own API credentials from https://my.telegram.org
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';

interface Channel {
  id: string;
  name: string;
  isSelected: boolean;
}

export class TelegramService {
  private client: TelegramClient | null = null;
  private storeService: StoreService;
  private authState: TelegramAuthState = { isAuthenticated: false };
  private pendingPhoneCodeHash: string | null = null;

  constructor(storeService: StoreService) {
    this.storeService = storeService;
    this.initFromSavedSession();
  }

  /**
   * Initialize client from saved session if available
   */
  private async initFromSavedSession(): Promise<void> {
    const savedSession = this.storeService.getTelegramSession();
    if (savedSession) {
      try {
        this.client = new TelegramClient(
          new StringSession(savedSession),
          API_ID,
          API_HASH,
          {
            connectionRetries: 5,
          }
        );
        await this.client.connect();

        const me = await this.client.getMe();
        if (me) {
          this.authState = {
            isAuthenticated: true,
            userId: me.id?.toString(),
            username: me.username || undefined,
            firstName: me.firstName || undefined,
            lastName: me.lastName || undefined,
            phoneNumber: me.phone || undefined,
          };
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        this.storeService.clearTelegramSession();
        this.authState = { isAuthenticated: false };
      }
    }
  }

  /**
   * Start authentication with phone number
   */
  async startAuth(phoneNumber: string): Promise<{ success: boolean; needsCode: boolean }> {
    try {
      this.client = new TelegramClient(
        new StringSession(''),
        API_ID,
        API_HASH,
        {
          connectionRetries: 5,
        }
      );
      await this.client.connect();

      const result = await this.client.sendCode(
        { apiId: API_ID, apiHash: API_HASH },
        phoneNumber
      );

      this.pendingPhoneCodeHash = result.phoneCodeHash;
      this.authState.phoneNumber = phoneNumber;

      return { success: true, needsCode: true };
    } catch (error) {
      console.error('Failed to start auth:', error);
      return { success: false, needsCode: false };
    }
  }

  /**
   * Submit verification code
   */
  async submitCode(code: string): Promise<{ success: boolean; needs2FA?: boolean; error?: string }> {
    if (!this.client || !this.pendingPhoneCodeHash || !this.authState.phoneNumber) {
      return { success: false, error: 'Authentication not started' };
    }

    try {
      await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: this.authState.phoneNumber,
          phoneCodeHash: this.pendingPhoneCodeHash,
          phoneCode: code,
        })
      );

      // Success - save session
      await this.finalizeAuth();
      return { success: true };
    } catch (error: unknown) {
      const telegramError = error as { errorMessage?: string };
      if (telegramError.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        return { success: false, needs2FA: true };
      }
      console.error('Failed to submit code:', error);
      return { success: false, error: 'Invalid code' };
    }
  }

  /**
   * Submit 2FA password
   */
  async submit2FAPassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' };
    }

    try {
      await this.client.signInWithPassword(
        { apiId: API_ID, apiHash: API_HASH },
        {
          password: async () => password,
          onError: (err) => {
            throw err;
          },
        }
      );

      await this.finalizeAuth();
      return { success: true };
    } catch (error) {
      console.error('Failed to submit 2FA password:', error);
      return { success: false, error: 'Invalid password' };
    }
  }

  /**
   * Finalize authentication and save session
   */
  private async finalizeAuth(): Promise<void> {
    if (!this.client) return;

    const me = await this.client.getMe();
    if (me) {
      this.authState = {
        isAuthenticated: true,
        userId: me.id?.toString(),
        username: me.username || undefined,
        firstName: me.firstName || undefined,
        lastName: me.lastName || undefined,
        phoneNumber: me.phone || undefined,
      };

      // Save session
      const sessionString = this.client.session.save() as unknown as string;
      this.storeService.setTelegramSession(sessionString);
    }

    this.pendingPhoneCodeHash = null;
  }

  /**
   * Get current auth state
   */
  getAuthState(): TelegramAuthState {
    return this.authState;
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    if (this.client) {
      try {
        await this.client.invoke(new Api.auth.LogOut());
      } catch (error) {
        console.error('Logout error:', error);
      }
      await this.client.disconnect();
      this.client = null;
    }

    this.storeService.clearTelegramSession();
    this.storeService.clearSelectedChannel();
    this.authState = { isAuthenticated: false };
    this.pendingPhoneCodeHash = null;
  }

  /**
   * Disconnect client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  /**
   * Get user's channels that can be used for storage
   */
  async getChannels(): Promise<Channel[]> {
    if (!this.client || !this.authState.isAuthenticated) {
      return [];
    }

    try {
      const dialogs = await this.client.getDialogs({});
      const selectedChannel = this.storeService.getSelectedChannel();

      return dialogs
        .filter((d) => d.isChannel && !d.entity?.megagroup)
        .map((d) => ({
          id: d.id?.toString() || '',
          name: d.title || 'Unnamed Channel',
          isSelected: d.id?.toString() === selectedChannel.id,
        }));
    } catch (error) {
      console.error('Failed to get channels:', error);
      return [];
    }
  }

  /**
   * Create a new storage channel
   */
  async createStorageChannel(name: string): Promise<{ id: string; name: string }> {
    if (!this.client) {
      throw new Error('Not authenticated');
    }

    const result = await this.client.invoke(
      new Api.channels.CreateChannel({
        title: name,
        about: 'Storage channel created by TAAS Desktop',
        megagroup: false,
        broadcast: true,
      })
    );

    if (result instanceof Api.Updates) {
      const channel = result.chats[0];
      if (channel instanceof Api.Channel) {
        const channelId = channel.id.toString();
        this.storeService.setSelectedChannel(channelId, name);
        return { id: channelId, name };
      }
    }

    throw new Error('Failed to create channel');
  }

  /**
   * Upload an encrypted file to the storage channel
   */
  async uploadFile(
    channelId: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: number) => void
  ): Promise<{ fileId: string; messageId: number }> {
    if (!this.client) {
      throw new Error('Not authenticated');
    }

    // Get the channel entity
    const channel = await this.client.getEntity(bigInt(channelId));

    // Create custom file for upload
    const file = new CustomFile(fileName, buffer.length, '', buffer);

    // Upload with progress tracking
    const result = await this.client.sendFile(channel, {
      file,
      caption: `📁 ${fileName}`,
      forceDocument: true,
      progressCallback: (progress) => {
        if (onProgress) {
          onProgress(Math.round(progress * 100));
        }
      },
    });

    // Extract file ID and message ID
    const message = result as Api.Message;
    const document = message.media as Api.MessageMediaDocument;
    const doc = document?.document as Api.Document;

    return {
      fileId: doc?.id?.toString() || '',
      messageId: message.id,
    };
  }

  /**
   * Get the client instance (for advanced operations)
   */
  getClient(): TelegramClient | null {
    return this.client;
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}
