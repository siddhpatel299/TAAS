import { TelegramClient, Api } from 'telegram';
import { prisma } from '../lib/prisma';
import { telegramService } from './telegram.service';
import bigInt from 'big-integer';

interface SyncResult {
  synced: number;
  skipped: number;
  errors: number;
  files: Array<{
    name: string;
    size: bigint;
    messageId: number;
  }>;
}

interface SyncStatus {
  userId: string;
  isRunning: boolean;
  lastSync: Date | null;
  lastResult: SyncResult | null;
  progress: number;
}

// Track sync status per user
const syncStatuses = new Map<string, SyncStatus>();

export class SyncService {
  
  // Get sync status for a user
  getSyncStatus(userId: string): SyncStatus {
    return syncStatuses.get(userId) || {
      userId,
      isRunning: false,
      lastSync: null,
      lastResult: null,
      progress: 0,
    };
  }

  // Update sync status
  private updateStatus(userId: string, update: Partial<SyncStatus>): void {
    const current = this.getSyncStatus(userId);
    syncStatuses.set(userId, { ...current, ...update });
  }

  // Sync files from Telegram channel to TAAS database
  async syncFromTelegram(userId: string, channelId?: string): Promise<SyncResult> {
    const status = this.getSyncStatus(userId);
    
    if (status.isRunning) {
      throw new Error('Sync already in progress');
    }

    this.updateStatus(userId, { isRunning: true, progress: 0 });

    const result: SyncResult = {
      synced: 0,
      skipped: 0,
      errors: 0,
      files: [],
    };

    try {
      // Get Telegram client
      const client = await telegramService.getClient(userId);
      if (!client) {
        throw new Error('Telegram client not connected');
      }

      // Get storage channels for the user
      const channels = channelId
        ? await prisma.storageChannel.findMany({
            where: { userId, channelId },
          })
        : await prisma.storageChannel.findMany({
            where: { userId },
          });

      if (channels.length === 0) {
        throw new Error('No storage channels found');
      }

      // Get existing message IDs to avoid duplicates
      const existingFiles = await prisma.file.findMany({
        where: { userId },
        select: { telegramMessageId: true, channelId: true },
      });

      const existingMessageIds = new Set(
        existingFiles.map((f) => `${f.channelId}:${f.telegramMessageId}`)
      );

      let totalMessages = 0;
      let processedMessages = 0;

      // Process each channel
      for (const channel of channels) {
        try {
          const messages = await this.getChannelMessages(client, channel.channelId);
          totalMessages += messages.length;

          for (const message of messages) {
            processedMessages++;
            this.updateStatus(userId, {
              progress: Math.round((processedMessages / totalMessages) * 100),
            });

            try {
              const syncedFile = await this.processMessage(
                userId,
                channel.channelId,
                message,
                existingMessageIds
              );

              if (syncedFile) {
                if (syncedFile.skipped) {
                  result.skipped++;
                } else {
                  result.synced++;
                  result.files.push({
                    name: syncedFile.name,
                    size: syncedFile.size,
                    messageId: message.id,
                  });
                }
              }
            } catch (error) {
              console.error(`Error processing message ${message.id}:`, error);
              result.errors++;
            }
          }
        } catch (error) {
          console.error(`Error syncing channel ${channel.channelId}:`, error);
          result.errors++;
        }
      }

      this.updateStatus(userId, {
        isRunning: false,
        lastSync: new Date(),
        lastResult: result,
        progress: 100,
      });

      return result;
    } catch (error) {
      this.updateStatus(userId, {
        isRunning: false,
        progress: 0,
      });
      throw error;
    }
  }

  // Get messages from a Telegram channel
  private async getChannelMessages(
    client: TelegramClient,
    channelId: string,
    limit: number = 500
  ): Promise<Api.Message[]> {
    try {
      // Get channel entity
      let channel: Api.TypeInputPeer;
      try {
        channel = await client.getInputEntity(channelId);
      } catch {
        // Try with numeric ID
        await client.getDialogs({ limit: 100 });
        try {
          channel = await client.getInputEntity(channelId);
        } catch {
          const numericId = bigInt(channelId);
          channel = new Api.InputPeerChannel({
            channelId: numericId,
            accessHash: bigInt(0),
          });
        }
      }

      // Fetch messages
      const messages = await client.getMessages(channel, {
        limit,
        filter: new Api.InputMessagesFilterDocument(),
      });

      return messages.filter((m): m is Api.Message => 
        m instanceof Api.Message && m.media !== undefined
      );
    } catch (error) {
      console.error(`Error fetching messages from channel ${channelId}:`, error);
      throw error;
    }
  }

  // Process a single Telegram message and sync to database
  private async processMessage(
    userId: string,
    channelId: string,
    message: Api.Message,
    existingMessageIds: Set<string>
  ): Promise<{ name: string; size: bigint; skipped: boolean } | null> {
    // Skip if no media
    if (!message.media) {
      return null;
    }

    // Check if already synced
    const messageKey = `${channelId}:${message.id}`;
    if (existingMessageIds.has(messageKey)) {
      return { name: '', size: BigInt(0), skipped: true };
    }

    // Extract file info from message
    const fileInfo = this.extractFileInfo(message);
    if (!fileInfo) {
      return null;
    }

    // Create file record in database
    await prisma.file.create({
      data: {
        name: fileInfo.name,
        originalName: fileInfo.name,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size,
        telegramFileId: fileInfo.fileId,
        telegramMessageId: message.id,
        channelId: channelId,
        userId: userId,
        folderId: null, // Root folder
        isStarred: false,
        isTrashed: false,
      },
    });

    // Update storage channel stats
    await prisma.storageChannel.updateMany({
      where: { channelId, userId },
      data: {
        usedBytes: { increment: fileInfo.size },
        fileCount: { increment: 1 },
      },
    });

    return { name: fileInfo.name, size: fileInfo.size, skipped: false };
  }

  // Extract file information from a Telegram message
  private extractFileInfo(message: Api.Message): {
    name: string;
    mimeType: string;
    size: bigint;
    fileId: string;
  } | null {
    if (!message.media) return null;

    // Handle document messages
    if (message.media instanceof Api.MessageMediaDocument) {
      const doc = message.media.document;
      if (doc instanceof Api.Document) {
        // Get filename from attributes
        let fileName = 'unknown';
        for (const attr of doc.attributes) {
          if (attr instanceof Api.DocumentAttributeFilename) {
            fileName = attr.fileName;
            break;
          }
        }

        return {
          name: fileName,
          mimeType: doc.mimeType,
          size: BigInt(doc.size.toString()),
          fileId: doc.id.toString(),
        };
      }
    }

    // Handle photo messages
    if (message.media instanceof Api.MessageMediaPhoto) {
      const photo = message.media.photo;
      if (photo instanceof Api.Photo) {
        // Get largest size
        const sizes = photo.sizes.filter(
          (s): s is Api.PhotoSize => s instanceof Api.PhotoSize
        );
        const largestSize = sizes.reduce(
          (prev, curr) => (curr.size > prev.size ? curr : prev),
          sizes[0]
        );

        const date = new Date(message.date * 1000);
        const fileName = `photo_${date.toISOString().split('T')[0]}_${message.id}.jpg`;

        return {
          name: fileName,
          mimeType: 'image/jpeg',
          size: BigInt(largestSize?.size || 0),
          fileId: photo.id.toString(),
        };
      }
    }

    // Handle video messages
    if (message.media instanceof Api.MessageMediaDocument) {
      const doc = message.media.document;
      if (doc instanceof Api.Document) {
        // Check if it's a video
        const isVideo = doc.attributes.some(
          (attr) => attr instanceof Api.DocumentAttributeVideo
        );
        if (isVideo) {
          let fileName = `video_${message.id}.mp4`;
          for (const attr of doc.attributes) {
            if (attr instanceof Api.DocumentAttributeFilename) {
              fileName = attr.fileName;
              break;
            }
          }
          return {
            name: fileName,
            mimeType: doc.mimeType,
            size: BigInt(doc.size.toString()),
            fileId: doc.id.toString(),
          };
        }
      }
    }

    return null;
  }

  // Setup real-time message listener for a user
  async setupMessageListener(userId: string): Promise<void> {
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not connected');
    }

    const channels = await prisma.storageChannel.findMany({
      where: { userId },
    });

    if (channels.length === 0) {
      return;
    }

    const channelIds = new Set(channels.map((c) => c.channelId));

    // Get existing message IDs
    const existingFiles = await prisma.file.findMany({
      where: { userId },
      select: { telegramMessageId: true, channelId: true },
    });

    const existingMessageIds = new Set(
      existingFiles.map((f) => `${f.channelId}:${f.telegramMessageId}`)
    );

    // Add event handler for new messages
    client.addEventHandler(async (event: any) => {
      try {
        const message = event.message;
        if (!message || !message.media) return;

        // Get chat/channel ID
        const chatId = message.peerId?.channelId?.toString() || 
                       message.chatId?.toString() ||
                       message.peerId?.toString();

        if (!chatId || !channelIds.has(chatId)) {
          return;
        }

        // Check if this is a document/file message
        if (!(message.media instanceof Api.MessageMediaDocument) &&
            !(message.media instanceof Api.MessageMediaPhoto)) {
          return;
        }

        // Process and sync the message
        const result = await this.processMessage(
          userId,
          chatId,
          message,
          existingMessageIds
        );

        if (result && !result.skipped) {
          console.log(`[Sync] Auto-synced file: ${result.name}`);
          // Add to existing set to prevent duplicates
          existingMessageIds.add(`${chatId}:${message.id}`);
        }
      } catch (error) {
        console.error('[Sync] Error processing new message:', error);
      }
    });

    console.log(`[Sync] Message listener set up for user ${userId}`);
  }

  // Perform periodic background sync
  async performBackgroundSync(): Promise<void> {
    console.log('[Sync] Starting background sync for all users...');

    const users = await prisma.user.findMany({
      where: { sessionData: { not: null } },
      select: { id: true },
    });

    for (const user of users) {
      const status = this.getSyncStatus(user.id);
      if (status.isRunning) {
        continue;
      }

      try {
        await this.syncFromTelegram(user.id);
        console.log(`[Sync] Completed background sync for user ${user.id}`);
      } catch (error) {
        console.error(`[Sync] Background sync failed for user ${user.id}:`, error);
      }
    }
  }
}

export const syncService = new SyncService();
