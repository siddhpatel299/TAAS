import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CustomFile } from 'telegram/client/uploads';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { NewMessage } from 'telegram/events';
import bigInt from 'big-integer';

interface TelegramSession {
  client: TelegramClient;
  userId: string;
}

// Store active sessions in memory
const activeSessions = new Map<string, TelegramSession>();

export class TelegramService {
  private apiId: number;
  private apiHash: string;

  constructor() {
    this.apiId = config.telegram.apiId;
    this.apiHash = config.telegram.apiHash;
  }

  // Create a new client for authentication
  async createAuthClient(): Promise<TelegramClient> {
    const client = new TelegramClient(
      new StringSession(''),
      this.apiId,
      this.apiHash,
      {
        connectionRetries: 5,
      }
    );
    await client.connect();
    return client;
  }

  // Send verification code to phone
  async sendCode(client: TelegramClient, phoneNumber: string) {
    return await client.sendCode(
      {
        apiId: this.apiId,
        apiHash: this.apiHash,
      },
      phoneNumber
    );
  }

  // Sign in with code
  async signIn(
    client: TelegramClient,
    phoneNumber: string,
    phoneCodeHash: string,
    phoneCode: string
  ) {
    const result = await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode,
      })
    );
    return result;
  }

  // Sign in with 2FA password
  async signInWith2FA(client: TelegramClient, password: string) {
    const passwordInfo = await client.invoke(new Api.account.GetPassword());
    const result = await client.signInWithPassword(
      {
        apiId: this.apiId,
        apiHash: this.apiHash,
      },
      {
        password: async () => password,
        onError: (err) => {
          throw err;
        },
      }
    );
    return result;
  }

  // Get session string for storage
  getSessionString(client: TelegramClient): string {
    return client.session.save() as unknown as string;
  }

  // Restore client from saved session
  async restoreClient(userId: string, sessionString: string): Promise<TelegramClient> {
    // Check if already connected
    const existing = activeSessions.get(userId);
    if (existing && existing.client.connected) {
      return existing.client;
    }

    const client = new TelegramClient(
      new StringSession(sessionString),
      this.apiId,
      this.apiHash,
      {
        connectionRetries: 5,
      }
    );
    
    await client.connect();
    
    // Populate entity cache by fetching dialogs
    // This is necessary to resolve channel IDs later
    await client.getDialogs({ limit: 100 });
    
    activeSessions.set(userId, { client, userId });
    
    return client;
  }

  // Get user's Telegram info
  async getMe(client: TelegramClient) {
    return await client.getMe();
  }

  // Create a private channel for storage
  async createStorageChannel(client: TelegramClient, name: string = 'TAAS Storage'): Promise<Api.Channel> {
    const result = await client.invoke(
      new Api.channels.CreateChannel({
        title: name,
        about: 'Storage channel created by TAAS',
        megagroup: false,
        broadcast: true,
      })
    );

    if (result instanceof Api.Updates) {
      const channel = result.chats[0];
      if (channel instanceof Api.Channel) {
        return channel;
      }
    }
    
    throw new Error('Failed to create storage channel');
  }

  // Get user's channels/groups that can be used for storage
  async getDialogs(client: TelegramClient) {
    const dialogs = await client.getDialogs({});
    return dialogs.filter(
      (d) => d.isChannel || d.isGroup
    );
  }

  // Helper to get channel entity with fallback
  private async getChannelEntity(client: TelegramClient, channelId: string) {
    try {
      // Try direct resolution first
      return await client.getEntity(channelId);
    } catch (error) {
      // If that fails, refresh dialogs and try again
      console.log('Entity not found, refreshing dialogs...');
      await client.getDialogs({ limit: 100 });
      
      try {
        return await client.getEntity(channelId);
      } catch (e) {
        // Try with numeric ID and InputPeerChannel
        const numericId = bigInt(channelId);
        return await client.getEntity(new Api.PeerChannel({ channelId: numericId }));
      }
    }
  }

  // Upload file to Telegram
  async uploadFile(
    client: TelegramClient,
    channelId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: number) => void
  ): Promise<{ messageId: number; fileId: string }> {
    const channel = await this.getChannelEntity(client, channelId);
    
    const result = await client.sendFile(channel, {
      file: new CustomFile(fileName, file.length, '', file),
      caption: `📁 ${fileName}`,
      progressCallback: onProgress
        ? (progress) => onProgress(progress * 100)
        : undefined,
      forceDocument: true,
    });

    const message = result as Api.Message;
    const document = message.media as Api.MessageMediaDocument;
    const doc = document.document as Api.Document;

    return {
      messageId: message.id,
      fileId: doc.id.toString(),
    };
  }

  // Download file from Telegram
  async downloadFile(
    client: TelegramClient,
    channelId: string,
    messageId: number,
    onProgress?: (progress: number) => void
  ): Promise<Buffer> {
    const channel = await this.getChannelEntity(client, channelId);
    
    const messages = await client.getMessages(channel, {
      ids: [messageId],
    });

    if (!messages.length || !messages[0]) {
      throw new Error('Message not found');
    }

    const message = messages[0];
    if (!message.media) {
      throw new Error('Message has no media');
    }

    const buffer = await client.downloadMedia(message, {
      progressCallback: onProgress
        ? (downloaded, total) => {
            const progress = total ? (Number(downloaded) / Number(total)) * 100 : 0;
            onProgress(progress);
          }
        : undefined,
    });

    if (!buffer) {
      throw new Error('Failed to download file');
    }

    return buffer as Buffer;
  }

  // Delete file from Telegram
  async deleteFile(
    client: TelegramClient,
    channelId: string,
    messageId: number
  ): Promise<void> {
    const channel = await this.getChannelEntity(client, channelId);
    await client.deleteMessages(channel, [messageId], { revoke: true });
  }

  // Disconnect client
  async disconnect(userId: string): Promise<void> {
    const session = activeSessions.get(userId);
    if (session) {
      await session.client.disconnect();
      activeSessions.delete(userId);
    }
  }

  // Get active client for user
  async getClient(userId: string): Promise<TelegramClient | null> {
    const session = activeSessions.get(userId);
    if (session && session.client.connected) {
      return session.client;
    }

    // Try to restore from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionData: true },
    });

    if (user?.sessionData) {
      return await this.restoreClient(userId, user.sessionData);
    }

    return null;
  }
}

export const telegramService = new TelegramService();
