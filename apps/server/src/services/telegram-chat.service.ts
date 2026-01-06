import { TelegramClient, Api } from 'telegram';
import bigInt from 'big-integer';
import { telegramService } from './telegram.service';
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
  hasAudio: boolean;
  audio?: {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    duration: number;
    title?: string;
    performer?: string;
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
   * Supports filtering by file type.
   * This is a manual operation triggered by user action.
   */
  async getChatMessages(
    userId: string,
    chatId: string,
    options: { 
      limit?: number; 
      offsetId?: number; 
      filesOnly?: boolean;
      fileType?: 'all' | 'video' | 'photo' | 'document' | 'audio';
    } = {}
  ): Promise<{ messages: TelegramMessage[]; hasMore: boolean; counts: { video: number; photo: number; document: number; audio: number; total: number } }> {
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    const { limit = 50, offsetId, filesOnly = true, fileType = 'all' } = options;

    // Get the chat entity
    const entity = await this.getChatEntity(client, chatId);

    const messages = await client.getMessages(entity, {
      limit: limit + 1, // Fetch one extra to check if there's more
      offsetId,
    });

    const hasMore = messages.length > limit;
    const messagesToProcess = hasMore ? messages.slice(0, limit) : messages;

    const result: TelegramMessage[] = [];
    const counts = { video: 0, photo: 0, document: 0, audio: 0, total: 0 };

    for (const msg of messagesToProcess) {
      const message = this.parseMessage(msg, chatId);
      
      // Count by type
      if (message.hasVideo) counts.video++;
      if (message.hasPhoto) counts.photo++;
      if (message.hasDocument) counts.document++;
      if (message.hasAudio) counts.audio++;
      if (message.hasDocument || message.hasPhoto || message.hasVideo || message.hasAudio) {
        counts.total++;
      }
      
      // If filesOnly is true, only include messages with media
      if (filesOnly) {
        const hasMedia = message.hasDocument || message.hasPhoto || message.hasVideo || message.hasAudio;
        if (!hasMedia) continue;
        
        // Apply file type filter
        if (fileType !== 'all') {
          if (fileType === 'video' && !message.hasVideo) continue;
          if (fileType === 'photo' && !message.hasPhoto) continue;
          if (fileType === 'document' && !message.hasDocument) continue;
          if (fileType === 'audio' && !message.hasAudio) continue;
        }
        
        result.push(message);
      } else {
        result.push(message);
      }
    }

    return {
      messages: result,
      hasMore,
      counts,
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
   * STREAMING IMPLEMENTATION - Memory Efficient!
   * File is streamed directly: Telegram → Server (minimal buffer) → TAAS Storage
   * Does NOT load entire file into RAM.
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
      // For photos, estimate size (actual will be determined during transfer)
      const photo = message.media.photo as Api.Photo;
      const sizes = photo.sizes || [];
      const largestSize = sizes[sizes.length - 1];
      size = largestSize && 'size' in largestSize ? largestSize.size : 0;
    } else {
      throw new Error('Unsupported media type');
    }

    // STREAMING TRANSFER: Pipe directly from source chat to storage channel
    // This doesn't load the entire file into memory!
    const uploadResult = await telegramService.streamTransfer(
      client,
      message.media,
      storageChannel.channelId,
      fileName,
      mimeType,
      size
    );

    // Save to database
    const savedFile = await prisma.file.create({
      data: {
        name: fileName,
        originalName: fileName,
        mimeType,
        size: BigInt(size),
        telegramFileId: uploadResult.fileId,
        telegramMessageId: uploadResult.messageId,
        channelId: storageChannel.channelId,
        folderId,
        userId,
        isChunked: false,
        checksum: null, // Checksum would require full buffer - skip for streaming
      },
    });

    // Update storage channel stats
    await prisma.storageChannel.update({
      where: {
        channelId_userId: { channelId: storageChannel.channelId, userId },
      },
      data: {
        usedBytes: { increment: BigInt(size) },
        fileCount: { increment: 1 },
      },
    });

    return {
      success: true,
      fileId: savedFile.id,
      fileName: savedFile.name,
      size: Number(savedFile.size),
    };
  }

  /**
   * Stream media directly from Telegram for preview.
   * 
   * STREAMING: Memory efficient - doesn't load entire file.
   * Enables video/audio preview without importing to TAAS.
   * 
   * @param userId - The TAAS user ID
   * @param chatId - The Telegram chat ID
   * @param messageId - The specific message ID containing media
   */
  async streamMediaFromMessage(
    userId: string,
    chatId: string,
    messageId: number
  ): Promise<{ stream: import('stream').Readable; mimeType: string; size: number; fileName: string }> {
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
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
      throw new Error('Message has no media attached');
    }

    // Determine file info
    let fileName: string;
    let mimeType: string;
    let size: number;

    if (message.media instanceof Api.MessageMediaDocument) {
      const doc = message.media.document as Api.Document;
      const fileNameAttr = doc.attributes?.find(
        (attr): attr is Api.DocumentAttributeFilename => 
          attr instanceof Api.DocumentAttributeFilename
      );
      fileName = fileNameAttr?.fileName || `media_${messageId}`;
      mimeType = doc.mimeType || 'application/octet-stream';
      size = Number(doc.size);
    } else if (message.media instanceof Api.MessageMediaPhoto) {
      fileName = `photo_${messageId}.jpg`;
      mimeType = 'image/jpeg';
      const photo = message.media.photo as Api.Photo;
      const sizes = photo.sizes || [];
      const largestSize = sizes[sizes.length - 1];
      size = largestSize && 'size' in largestSize ? largestSize.size : 0;
    } else {
      throw new Error('Unsupported media type for streaming');
    }

    // Get streaming download
    const stream = await telegramService.downloadFileAsStream(
      client,
      message.media,
      size
    );

    return {
      stream,
      mimeType,
      size,
      fileName,
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
      hasAudio: false,
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
        
        // Check if it's audio
        const audioAttr = doc.attributes?.find(
          (attr): attr is Api.DocumentAttributeAudio => 
            attr instanceof Api.DocumentAttributeAudio
        );
        
        const fileNameAttr = doc.attributes?.find(
          (attr): attr is Api.DocumentAttributeFilename => 
            attr instanceof Api.DocumentAttributeFilename
        );
        
        if (videoAttr) {
          message.hasVideo = true;
          message.video = {
            id: doc.id.toString(),
            fileName: fileNameAttr?.fileName || `video_${msg.id}.mp4`,
            mimeType: doc.mimeType || 'video/mp4',
            size: Number(doc.size),
            duration: videoAttr.duration,
          };
        } else if (audioAttr) {
          message.hasAudio = true;
          message.audio = {
            id: doc.id.toString(),
            fileName: fileNameAttr?.fileName || `audio_${msg.id}.mp3`,
            mimeType: doc.mimeType || 'audio/mpeg',
            size: Number(doc.size),
            duration: audioAttr.duration,
            title: audioAttr.title,
            performer: audioAttr.performer,
          };
        } else {
          // Regular document
          message.hasDocument = true;
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
