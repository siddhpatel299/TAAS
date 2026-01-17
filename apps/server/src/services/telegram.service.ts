import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CustomFile } from 'telegram/client/uploads';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { NewMessage } from 'telegram/events';
import bigInt from 'big-integer';
import { Readable, PassThrough } from 'stream';

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

    // If there's an existing disconnected client, clean it up
    if (existing) {
      try {
        await existing.client.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      activeSessions.delete(userId);
    }

    const client = new TelegramClient(
      new StringSession(sessionString),
      this.apiId,
      this.apiHash,
      {
        connectionRetries: 5,
      }
    );

    try {
      await client.connect();

      // Populate entity cache by fetching dialogs
      // This is necessary to resolve channel IDs later
      await client.getDialogs({ limit: 100 });

      activeSessions.set(userId, { client, userId });

      return client;
    } catch (error: any) {
      // Handle AUTH_KEY_DUPLICATED - this means session was used elsewhere
      if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
        console.log('[Telegram] AUTH_KEY_DUPLICATED - session may be in use elsewhere');
        // Clean up and throw - user may need to re-login
        try {
          await client.disconnect();
        } catch (e) {
          // Ignore
        }
        activeSessions.delete(userId);
      }
      throw error;
    }
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

    // For large files (> 100MB), write to temp file first
    // CustomFile has issues with large buffers
    const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB
    let customFile: CustomFile;
    let tempFilePath: string | null = null;

    if (file.length > LARGE_FILE_THRESHOLD) {
      // Write to temp file for large uploads
      const os = await import('os');
      const path = await import('path');
      const fs = await import('fs/promises');

      tempFilePath = path.join(os.tmpdir(), `taas-upload-${Date.now()}-${fileName}`);
      await fs.writeFile(tempFilePath, file);
      console.log(`[Upload] Using temp file for large upload: ${tempFilePath}`);

      // CustomFile with file path instead of buffer
      customFile = new CustomFile(fileName, file.length, tempFilePath);
    } else {
      // CustomFile(name, size, path, buffer) - path is empty string when using buffer
      customFile = new CustomFile(fileName, file.length, '', file);
    }

    try {
      const result = await client.sendFile(channel, {
        file: customFile,
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
    } finally {
      // Clean up temp file if created
      if (tempFilePath) {
        const fs = await import('fs/promises');
        try {
          await fs.unlink(tempFilePath);
          console.log(`[Upload] Cleaned up temp file: ${tempFilePath}`);
        } catch (e) {
          console.error(`[Upload] Failed to clean up temp file: ${tempFilePath}`, e);
        }
      }
    }
  }

  /**
   * Upload file to Telegram with chunking for better reliability
   * Splits large files into 25MB chunks for faster/more reliable uploads
   * Note: Uses sequential upload due to Telegram's AUTH_KEY_DUPLICATED limitation
   */
  async uploadFileParallel(
    client: TelegramClient,
    channelId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: number) => void
  ): Promise<{ messageId: number; fileId: string; chunks?: Array<{ messageId: number; fileId: string; size: number; index: number }> }> {
    const PARALLEL_THRESHOLD = 50 * 1024 * 1024; // 50MB
    const CHUNK_SIZE = 25 * 1024 * 1024; // 25MB chunks

    // For small files, use regular upload
    if (file.length <= PARALLEL_THRESHOLD) {
      return this.uploadFile(client, channelId, file, fileName, mimeType, onProgress);
    }

    console.log(`[ChunkedUpload] Starting chunked upload: ${fileName} (${(file.length / 1024 / 1024).toFixed(1)} MB)`);

    const channel = await this.getChannelEntity(client, channelId);
    const totalChunks = Math.ceil(file.length / CHUNK_SIZE);
    const chunks: Array<{ messageId: number; fileId: string; size: number; index: number }> = [];

    // Create temp files for each chunk
    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs/promises');

    const tempFiles: string[] = [];

    try {
      // Write chunks to temp files first
      console.log(`[ChunkedUpload] Splitting into ${totalChunks} chunks...`);
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.length);
        const chunkBuffer = file.slice(start, end);

        const tempPath = path.join(os.tmpdir(), `taas-chunk-${Date.now()}-${i}-${fileName}`);
        await fs.writeFile(tempPath, chunkBuffer);
        tempFiles.push(tempPath);
      }

      // Upload chunks sequentially (parallel causes AUTH_KEY_DUPLICATED)
      console.log(`[ChunkedUpload] Uploading ${totalChunks} chunks sequentially...`);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.length);
        const chunkSize = end - start;
        const chunkName = `${fileName}.part${i + 1}of${totalChunks}`;

        console.log(`[ChunkedUpload] Uploading chunk ${i + 1}/${totalChunks}...`);

        const customFile = new CustomFile(chunkName, chunkSize, tempFiles[i]);

        const result = await client.sendFile(channel, {
          file: customFile,
          caption: `📦 ${chunkName}`,
          progressCallback: (progress) => {
            if (onProgress) {
              // Calculate overall progress
              const chunkProgress = (i + progress) / totalChunks * 100;
              onProgress(chunkProgress);
            }
          },
          forceDocument: true,
        });

        const message = result as Api.Message;
        const document = message.media as Api.MessageMediaDocument;
        const doc = document.document as Api.Document;

        chunks.push({
          index: i,
          messageId: message.id,
          fileId: doc.id.toString(),
          size: chunkSize,
        });
      }

      console.log(`[ChunkedUpload] Completed: ${fileName} (${chunks.length} chunks)`);

      return {
        messageId: chunks[0].messageId,
        fileId: chunks[0].fileId,
        chunks,
      };
    } finally {
      // Clean up temp files
      for (const tempPath of tempFiles) {
        try {
          await fs.unlink(tempPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      console.log(`[ChunkedUpload] Cleaned up ${tempFiles.length} temp files`);
    }
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

  /**
   * STREAMING: Download file from Telegram as a readable stream
   * Memory efficient - doesn't load entire file into RAM
   */
  async downloadFileAsStream(
    client: TelegramClient,
    media: Api.TypeMessageMedia,
    fileSize: number
  ): Promise<Readable> {
    const stream = new PassThrough();

    // Use iterDownload for streaming - processes in chunks
    const downloadChunkSize = 512 * 1024; // 512KB chunks

    // Start async download and pipe to stream
    (async () => {
      try {
        let offset = 0;

        for await (const chunk of client.iterDownload({
          file: media,
          requestSize: downloadChunkSize,
        })) {
          stream.write(chunk);
          offset += chunk.length;
        }

        stream.end();
      } catch (error) {
        stream.destroy(error as Error);
      }
    })();

    return stream;
  }

  /**
   * STREAMING: Upload from a readable stream to Telegram
   * Collects chunks and uploads when complete
   * For very large files, consider chunked upload approach
   */
  async uploadFileFromStream(
    client: TelegramClient,
    channelId: string,
    stream: Readable,
    fileName: string,
    mimeType: string,
    fileSize: number,
    onProgress?: (progress: number) => void
  ): Promise<{ messageId: number; fileId: string }> {
    const channel = await this.getChannelEntity(client, channelId);

    // Collect stream into buffer for upload
    // Note: For files > 2GB, use chunked upload instead
    const chunks: Buffer[] = [];
    let receivedBytes = 0;

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      receivedBytes += chunk.length;

      if (onProgress && fileSize > 0) {
        onProgress((receivedBytes / fileSize) * 50); // First 50% is receiving
      }
    }

    const buffer = Buffer.concat(chunks);

    // Upload to Telegram using CustomFile
    // CustomFile(name, size, path, buffer) - path is empty string when using buffer
    const customFile = new CustomFile(fileName, buffer.length, '', buffer);

    const result = await client.sendFile(channel, {
      file: customFile,
      caption: `📁 ${fileName}`,
      progressCallback: onProgress
        ? (progress) => onProgress(50 + progress * 50) // Last 50% is uploading
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

  /**
   * STREAMING: Pipe directly from source to destination
   * Most memory-efficient approach - minimal buffering
   */
  async streamTransfer(
    client: TelegramClient,
    sourceMedia: Api.TypeMessageMedia,
    destChannelId: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    onProgress?: (progress: number) => void
  ): Promise<{ messageId: number; fileId: string }> {
    // Get download stream
    const downloadStream = await this.downloadFileAsStream(client, sourceMedia, fileSize);

    // Upload from stream
    return this.uploadFileFromStream(
      client,
      destChannelId,
      downloadStream,
      fileName,
      mimeType,
      fileSize,
      onProgress
    );
  }
}

export const telegramService = new TelegramService();
