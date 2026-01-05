import { TelegramClient } from 'telegram';
import { prisma } from '../lib/prisma';
import { telegramService } from './telegram.service';
import crypto from 'crypto';

// Telegram limit is 2GB, use 1.9GB chunks for safety margin
const TELEGRAM_LIMIT = 2 * 1024 * 1024 * 1024; // 2 GB
const CHUNK_SIZE = 1.9 * 1024 * 1024 * 1024;   // 1.9 GB per chunk

interface ChunkUploadParams {
  client: TelegramClient;
  channelId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  onProgress?: (progress: number) => void;
}

interface ChunkUploadResult {
  isChunked: boolean;
  checksum: string;
  telegramFileId: string;
  telegramMessageId: number;
  chunks?: Array<{
    chunkIndex: number;
    telegramFileId: string;
    telegramMessageId: number;
    size: number;
  }>;
}

export class ChunkService {
  /**
   * Check if a file needs to be chunked
   */
  needsChunking(size: number): boolean {
    return size > TELEGRAM_LIMIT;
  }

  /**
   * Upload a file - automatically chunks if > 2GB
   */
  async uploadFile(params: ChunkUploadParams): Promise<ChunkUploadResult> {
    const { client, channelId, buffer, fileName, mimeType, onProgress } = params;
    const checksum = crypto.createHash('md5').update(buffer).digest('hex');

    // Direct upload if under 2GB
    if (buffer.length <= TELEGRAM_LIMIT) {
      const result = await telegramService.uploadFile(
        client,
        channelId,
        buffer,
        fileName,
        mimeType,
        onProgress
      );

      return {
        isChunked: false,
        checksum,
        telegramFileId: result.fileId,
        telegramMessageId: result.messageId,
      };
    }

    // Chunked upload for files > 2GB
    return this.uploadInChunks(params, checksum);
  }

  /**
   * Upload a file in chunks
   */
  private async uploadInChunks(
    params: ChunkUploadParams,
    checksum: string
  ): Promise<ChunkUploadResult> {
    const { client, channelId, buffer, fileName, mimeType, onProgress } = params;
    const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);
    const chunks: ChunkUploadResult['chunks'] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, buffer.length);
      const chunk = buffer.slice(start, end);

      // Calculate overall progress
      const chunkProgress = (progress: number) => {
        if (onProgress) {
          const overallProgress = ((i + progress / 100) / totalChunks) * 100;
          onProgress(overallProgress);
        }
      };

      const result = await telegramService.uploadFile(
        client,
        channelId,
        chunk,
        `${fileName}.part${i + 1}of${totalChunks}`,
        'application/octet-stream',
        chunkProgress
      );

      chunks.push({
        chunkIndex: i,
        telegramFileId: result.fileId,
        telegramMessageId: result.messageId,
        size: chunk.length,
      });
    }

    // Return first chunk's info as the main file reference
    return {
      isChunked: true,
      checksum,
      telegramFileId: chunks[0].telegramFileId,
      telegramMessageId: chunks[0].telegramMessageId,
      chunks,
    };
  }

  /**
   * Download a file - handles both chunked and non-chunked files
   */
  async downloadFile(
    client: TelegramClient,
    fileId: string,
    onProgress?: (progress: number) => void
  ): Promise<Buffer> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Non-chunked file - simple download
    if (!file.isChunked || file.chunks.length === 0) {
      return telegramService.downloadFile(
        client,
        file.channelId,
        file.telegramMessageId,
        onProgress
      );
    }

    // Chunked file - download all chunks and combine
    const buffers: Buffer[] = [];
    const totalChunks = file.chunks.length;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.chunks[i];
      
      const chunkProgress = (progress: number) => {
        if (onProgress) {
          const overallProgress = ((i + progress / 100) / totalChunks) * 100;
          onProgress(overallProgress);
        }
      };

      const buffer = await telegramService.downloadFile(
        client,
        chunk.channelId,
        chunk.telegramMessageId,
        chunkProgress
      );

      buffers.push(buffer);
    }

    // Combine all chunks
    const combinedBuffer = Buffer.concat(buffers);

    // Verify checksum if available
    if (file.checksum) {
      const downloadedChecksum = crypto.createHash('md5').update(combinedBuffer).digest('hex');
      if (downloadedChecksum !== file.checksum) {
        throw new Error('File integrity check failed - checksum mismatch');
      }
    }

    return combinedBuffer;
  }

  /**
   * Delete a file and all its chunks from Telegram
   */
  async deleteFile(client: TelegramClient, fileId: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        chunks: true,
      },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Delete chunks if chunked file
    if (file.isChunked && file.chunks.length > 0) {
      for (const chunk of file.chunks) {
        try {
          await telegramService.deleteFile(client, chunk.channelId, chunk.telegramMessageId);
        } catch (error) {
          console.error(`Failed to delete chunk ${chunk.chunkIndex}:`, error);
        }
      }
    } else {
      // Delete single file
      await telegramService.deleteFile(client, file.channelId, file.telegramMessageId);
    }
  }
}

export const chunkService = new ChunkService();
