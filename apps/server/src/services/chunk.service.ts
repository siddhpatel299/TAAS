import { TelegramClient } from 'telegram';
import { prisma } from '../lib/prisma';
import { telegramService } from './telegram.service';
import { integrityService } from './integrity.service';
import { throttleService } from './throttle.service';
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
  userId: string; // Required for throttling
  sessionId?: string; // Optional upload session for throttling
  onProgress?: (progress: number) => void;
}

interface ChunkUploadResult {
  isChunked: boolean;
  checksum: string; // SHA-256 hash of original data
  telegramFileId: string;
  telegramMessageId: number;
  chunks?: Array<{
    chunkIndex: number;
    telegramFileId: string;
    telegramMessageId: number;
    size: number;
    hash: string; // SHA-256 hash for each chunk
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
   * Calculate SHA-256 hash for integrity verification
   */
  calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Upload a file - automatically chunks if > 2GB
   * All uploads are throttled to avoid Telegram abuse detection
   */
  async uploadFile(params: ChunkUploadParams): Promise<ChunkUploadResult> {
    const { client, channelId, buffer, fileName, mimeType, userId, sessionId, onProgress } = params;

    // Use SHA-256 for checksum (more secure than MD5)
    const checksum = this.calculateHash(buffer);

    // Direct upload if under 2GB
    if (buffer.length <= TELEGRAM_LIMIT) {
      // Use regular upload (reverted from parallel due to AUTH_KEY issues)
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
   * Upload a file in chunks with throttling and integrity hashing
   */
  private async uploadInChunks(
    params: ChunkUploadParams,
    checksum: string
  ): Promise<ChunkUploadResult> {
    const { client, channelId, buffer, fileName, mimeType, userId, sessionId, onProgress } = params;
    const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);
    const chunks: ChunkUploadResult['chunks'] = [];

    // Create or get upload session for throttling
    const uploadSessionId = sessionId || crypto.randomUUID();
    if (!sessionId) {
      throttleService.startSession(userId, uploadSessionId, totalChunks);
    }

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, buffer.length);
        const chunk = buffer.slice(start, end);

        // Calculate SHA-256 hash for this chunk
        const chunkHash = this.calculateHash(chunk);

        // Calculate overall progress
        const chunkProgress = (progress: number) => {
          if (onProgress) {
            const overallProgress = ((i + progress / 100) / totalChunks) * 100;
            onProgress(overallProgress);
          }
        };

        // Upload with throttling (sequential, with delays)
        const result = await throttleService.executeWithThrottle(
          userId,
          async () => {
            return telegramService.uploadFile(
              client,
              channelId,
              chunk,
              `${fileName}.part${i + 1}of${totalChunks}`,
              'application/octet-stream',
              chunkProgress
            );
          },
          uploadSessionId
        );

        chunks.push({
          chunkIndex: i,
          telegramFileId: result.fileId,
          telegramMessageId: result.messageId,
          size: chunk.length,
          hash: chunkHash, // Store hash for integrity verification
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
    } finally {
      // Clean up session if we created it
      if (!sessionId) {
        throttleService.endSession(uploadSessionId);
      }
    }
  }

  /**
   * Download a file - handles both chunked and non-chunked files
   * Verifies integrity of each chunk before reassembly
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
      const buffer = await telegramService.downloadFile(
        client,
        file.channelId,
        file.telegramMessageId,
        onProgress
      );

      // Verify checksum
      if (file.checksum) {
        const downloadedChecksum = this.calculateHash(buffer);
        if (downloadedChecksum !== file.checksum) {
          throw new Error(
            `File integrity check FAILED - checksum mismatch! ` +
            `Expected: ${file.checksum}, Got: ${downloadedChecksum}. ` +
            `File may be corrupted or tampered with.`
          );
        }
      }

      return buffer;
    }

    // Chunked file - download all chunks and verify each
    const buffers: Buffer[] = [];
    const totalChunks = file.chunks.length;
    const failedChunks: number[] = [];

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

      // Verify chunk integrity using stored hash
      if (chunk.hash) {
        const verification = integrityService.verifyChunk(buffer, chunk.hash, chunk.chunkIndex);
        if (!verification.valid) {
          failedChunks.push(chunk.chunkIndex);
          throw new Error(
            `Chunk ${chunk.chunkIndex} integrity check FAILED! ` +
            `Expected: ${verification.expectedHash}, Got: ${verification.computedHash}. ` +
            `File may be corrupted or tampered with.`
          );
        }
      }

      buffers.push(buffer);
    }

    // Combine all chunks
    const combinedBuffer = Buffer.concat(buffers);

    // Final verification of complete file using SHA-256
    if (file.checksum) {
      const downloadedChecksum = this.calculateHash(combinedBuffer);
      if (downloadedChecksum !== file.checksum) {
        throw new Error(
          `Reassembled file integrity check FAILED - checksum mismatch! ` +
          `Expected: ${file.checksum}, Got: ${downloadedChecksum}. ` +
          `File may be corrupted or tampered with.`
        );
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
