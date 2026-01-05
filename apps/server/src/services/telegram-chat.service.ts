import { TelegramClient, Api } from 'telegram';
import bigInt from 'big-integer';
import { telegramService } from './telegram.service';
import { storageService } from './storage.service';
import { prisma } from '../lib/prisma';

/**
 * Telegram Chat Service
 * 
 * Provides manual, on-demand access to Telegram chats/groups/channels.
 * User can view messages and import individual files to TAAS.
 * 
 * Rules:
 * - Manual only - triggered by user action
 * - One file per action - no bulk imports
 * - No chat scanning, indexing, or polling
 * - No background sync or scheduled jobs
 */

export interface TelegramChat {
  id: string;
  title: string;
  type: 'user' | 'group' | 'supergroup' | 'channel';
  unreadCount: number;
  photoUrl?: string;
  lastMessage?: string;
  lastMessageDate?: Date;
}

export interface TelegramMessage {
  id: number;
  chatId: string;
  date: Date;
  text?: string;
  fromName?: string;
  hasDocument: boolean;
  document?: {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
  };
  hasPhoto: boolean;
  photo?: {
    id: string;
    size: number;
  };
  hasVideo: boolean;
  video?: {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    duration: number;
  };
}

export interface ImportResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  size?: number;
  error?: string;
}

class TelegramChatService {
  /**
   * Get user's Telegram chats (dialogs)
   * Returns all chats, groups, and channels the user is part of.
   * This is a manual operation triggered by user action.
   */
  async getChats(userId: string): Promise<TelegramChat[]> {
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    const dialogs = await client.getDialogs({ limit: 100 });
    
    const chats: TelegramChat[] = [];
    
    for (const dialog of dialogs) {
      let type: TelegramChat['type'] = 'user';
      
      if (dialog.isChannel) {
        type = 'channel';
      } else if (dialog.isGroup) {
        type = dialog.entity && 'megagroup' in dialog.entity && dialog.entity.megagroup 
          ? 'supergroup' 
          : 'group';
      }

      chats.push({
        id: dialog.id?.toString() || '',
        title: dialog.title || dialog.name || 'Unknown',
        type,
        unreadCount: dialog.unreadCount || 0,
        lastMessage: dialog.message?.message?.substring(0, 100),
        lastMessageDate: dialog.message?.date ? new Date(dialog.message.date * 1000) : undefined,
      });
    }

    return chats;
  }

  /**
   * Get messages from a specific chat with pagination.
   * Only fetches messages that contain files (documents, photos, videos).
   * This is a manual operation triggered by user action.
   */
  async getChatMessages(
    userId: string,
    chatId: string,
    options: { limit?: number; offsetId?: number; filesOnly?: boolean } = {}
  ): Promise<{ messages: TelegramMessage[]; hasMore: boolean }> {
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    const { limit = 50, offsetId, filesOnly = true } = options;

    // Get the chat entity
    const entity = await this.getChatEntity(client, chatId);

    const messages = await client.getMessages(entity, {
      limit: limit + 1, // Fetch one extra to check if there's more
      offsetId,
    });

    const hasMore = messages.length > limit;
    const messagesToProcess = hasMore ? messages.slice(0, limit) : messages;

    const result: TelegramMessage[] = [];

    for (const msg of messagesToProcess) {
      const message = this.parseMessage(msg, chatId);
      
      // If filesOnly is true, only include messages with media
      if (filesOnly) {
        if (message.hasDocument || message.hasPhoto || message.hasVideo) {
          result.push(message);
        }
      } else {
        result.push(message);
      }
    }

    return {
      messages: result,
      hasMore,
    };
  }

  /**
   * Get a single message by its ID.
   * Used to fetch message details before importing.
   */
  async getMessage(
    userId: string,
    chatId: string,
    messageId: number
  ): Promise<TelegramMessage | null> {
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    const entity = await this.getChatEntity(client, chatId);

    const messages = await client.getMessages(entity, {
      ids: [messageId],
    });

    if (!messages.length || !messages[0]) {
      return null;
    }

    return this.parseMessage(messages[0], chatId);
  }

  /**
   * Import a file from a specific Telegram message to TAAS.
   * 
   * CRITICAL: This only imports ONE file from ONE specific message.
   * No batch operations, no automatic imports.
   * 
   * @param userId - The TAAS user ID
   * @param chatId - The Telegram chat ID where the message is located
   * @param messageId - The specific message ID containing the file
   * @param folderId - Optional TAAS folder to import the file into
   */
  async importFileFromMessage(
    userId: string,
    chatId: string,
    messageId: number,
    folderId?: string
  ): Promise<ImportResult> {
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    // Get user's storage channel
    const storageChannel = await prisma.storageChannel.findFirst({
      where: { userId },
    });

    if (!storageChannel) {
      throw new Error('No storage channel found. Please reconnect your Telegram account.');
    }

    // Get the chat entity
    const entity = await this.getChatEntity(client, chatId);

    // Get the specific message
    const messages = await client.getMessages(entity, {
      ids: [messageId],
    });

    if (!messages.length || !messages[0]) {
      throw new Error('Message not found');
    }

    const message = messages[0];
    
    if (!message.media) {
      throw new Error('Message has no file attached');
    }

    // Determine file info based on media type
    let fileName: string;
    let mimeType: string;
    let size: number;

    if (message.media instanceof Api.MessageMediaDocument) {
      const doc = message.media.document as Api.Document;
      const fileNameAttr = doc.attributes?.find(
        (attr): attr is Api.DocumentAttributeFilename => 
          attr instanceof Api.DocumentAttributeFilename
      );
      fileName = fileNameAttr?.fileName || `file_${messageId}`;
      mimeType = doc.mimeType || 'application/octet-stream';
      size = Number(doc.size);
    } else if (message.media instanceof Api.MessageMediaPhoto) {
      fileName = `photo_${messageId}.jpg`;
      mimeType = 'image/jpeg';
      // Estimate size - actual size will be determined after download
      size = 0;
    } else {
      throw new Error('Unsupported media type');
    }

    // Download the file from the source chat
    const buffer = await client.downloadMedia(message, {});

    if (!buffer) {
      throw new Error('Failed to download file from chat');
    }

    const fileBuffer = buffer as Buffer;
    const actualSize = fileBuffer.length;

    // Upload to TAAS using existing storage service
    const savedFile = await storageService.uploadFile({
      userId,
      file: fileBuffer,
      fileName,
      originalName: fileName,
      mimeType,
      size: actualSize,
      folderId,
      channelId: storageChannel.channelId,
    });

    return {
      success: true,
      fileId: savedFile.id,
      fileName: savedFile.name,
      size: savedFile.size,
    };
  }

  /**
   * Helper to get chat entity with proper error handling
   */
  private async getChatEntity(client: TelegramClient, chatId: string) {
    try {
      // Try direct resolution first
      return await client.getEntity(chatId);
    } catch (error) {
      // If that fails, refresh dialogs and try again
      await client.getDialogs({ limit: 100 });
      
      try {
        return await client.getEntity(chatId);
      } catch (e) {
        // Try with numeric ID for channels
        try {
          const numericId = bigInt(chatId);
          return await client.getEntity(new Api.PeerChannel({ channelId: numericId }));
        } catch (e2) {
          // Try as a chat
          const numericId = bigInt(chatId);
          return await client.getEntity(new Api.PeerChat({ chatId: numericId }));
        }
      }
    }
  }

  /**
   * Parse a Telegram message into our format
   */
  private parseMessage(msg: Api.Message, chatId: string): TelegramMessage {
    const message: TelegramMessage = {
      id: msg.id,
      chatId,
      date: new Date(msg.date * 1000),
      text: msg.message || undefined,
      fromName: undefined,
      hasDocument: false,
      hasPhoto: false,
      hasVideo: false,
    };

    // Get sender name
    if (msg.fromId) {
      // We'll leave fromName as undefined for now - could be resolved if needed
    }

    // Parse media
    if (msg.media) {
      if (msg.media instanceof Api.MessageMediaDocument) {
        const doc = msg.media.document as Api.Document;
        
        // Check if it's a video
        const videoAttr = doc.attributes?.find(
          (attr): attr is Api.DocumentAttributeVideo => 
            attr instanceof Api.DocumentAttributeVideo
        );
        
        if (videoAttr) {
          message.hasVideo = true;
          const fileNameAttr = doc.attributes?.find(
            (attr): attr is Api.DocumentAttributeFilename => 
              attr instanceof Api.DocumentAttributeFilename
          );
          message.video = {
            id: doc.id.toString(),
            fileName: fileNameAttr?.fileName || `video_${msg.id}.mp4`,
            mimeType: doc.mimeType || 'video/mp4',
            size: Number(doc.size),
            duration: videoAttr.duration,
          };
        } else {
          // Regular document
          message.hasDocument = true;
          const fileNameAttr = doc.attributes?.find(
            (attr): attr is Api.DocumentAttributeFilename => 
              attr instanceof Api.DocumentAttributeFilename
          );
          message.document = {
            id: doc.id.toString(),
            fileName: fileNameAttr?.fileName || `file_${msg.id}`,
            mimeType: doc.mimeType || 'application/octet-stream',
            size: Number(doc.size),
          };
        }
      } else if (msg.media instanceof Api.MessageMediaPhoto) {
        message.hasPhoto = true;
        const photo = msg.media.photo as Api.Photo;
        // Get the largest size
        const sizes = photo.sizes || [];
        const largestSize = sizes[sizes.length - 1];
        let size = 0;
        if (largestSize && 'size' in largestSize) {
          size = largestSize.size;
        }
        message.photo = {
          id: photo.id.toString(),
          size,
        };
      }
    }

    return message;
  }
}

export const telegramChatService = new TelegramChatService();
