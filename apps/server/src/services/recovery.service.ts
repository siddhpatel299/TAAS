/**
 * Recovery Service
 * 
 * Handles file recovery using only:
 * 1. Encrypted chunks from Telegram
 * 2. Metadata from the database
 * 3. User-provided passphrase
 */

import { prisma } from '../lib/prisma';
import { telegramService } from './telegram.service';
import { integrityService } from './integrity.service';

export interface RecoveryMetadata {
  fileId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: bigint;
  isChunked: boolean;
  originalHash: string;
  encryptedFileKey: string;
  fileKeyIv: string;
  chunks: Array<{
    chunkIndex: number;
    telegramFileId: string;
    telegramMessageId: number;
    channelId: string;
    size: bigint;
    hash: string;
  }>;
}

export interface RecoveryResult {
  success: boolean;
  encryptedChunks: Array<{
    chunkIndex: number;
    data: Buffer;
    hash: string;
    verified: boolean;
  }>;
  metadata: RecoveryMetadata;
  errors: string[];
}

export class RecoveryService {
  /**
   * Export recovery metadata for a file
   * This metadata + passphrase = complete recovery capability
   */
  async exportRecoveryMetadata(
    userId: string,
    fileId: string
  ): Promise<RecoveryMetadata> {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Get encryption metadata
    const encryptionMeta = await prisma.fileEncryption.findUnique({
      where: { fileId },
    });

    if (!encryptionMeta) {
      throw new Error('Encryption metadata not found');
    }

    return {
      fileId: file.id,
      fileName: file.name,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      isChunked: file.isChunked,
      originalHash: encryptionMeta.originalHash,
      encryptedFileKey: encryptionMeta.encryptedFileKey,
      fileKeyIv: encryptionMeta.fileKeyIv,
      chunks: file.isChunked
        ? file.chunks.map(c => ({
            chunkIndex: c.chunkIndex,
            telegramFileId: c.telegramFileId,
            telegramMessageId: c.telegramMessageId,
            channelId: c.channelId,
            size: c.size,
            hash: c.hash || '', // Default to empty string if null
          }))
        : [{
            chunkIndex: 0,
            telegramFileId: file.telegramFileId,
            telegramMessageId: file.telegramMessageId,
            channelId: file.channelId,
            size: file.size,
            hash: encryptionMeta.originalHash, // For single-chunk files
          }],
    };
  }

  /**
   * Recover encrypted chunks from Telegram
   */
  async recoverEncryptedChunks(
    userId: string,
    metadata: RecoveryMetadata
  ): Promise<RecoveryResult> {
    const errors: string[] = [];
    const encryptedChunks: RecoveryResult['encryptedChunks'] = [];

    // Get Telegram client
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Telegram client not available');
    }

    // Download each chunk
    for (const chunkMeta of metadata.chunks) {
      try {
        // Download from Telegram
        const data = await telegramService.downloadFile(
          client,
          chunkMeta.channelId,
          chunkMeta.telegramMessageId
        );

        // Verify integrity
        const computedHash = integrityService.calculateHash(data);
        const verified = computedHash === chunkMeta.hash;

        if (!verified) {
          errors.push(
            `Chunk ${chunkMeta.chunkIndex} integrity verification failed. ` +
            `Expected: ${chunkMeta.hash}, Got: ${computedHash}`
          );
        }

        encryptedChunks.push({
          chunkIndex: chunkMeta.chunkIndex,
          data,
          hash: chunkMeta.hash,
          verified,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to download chunk ${chunkMeta.chunkIndex}: ${errorMessage}`);
      }
    }

    // Sort by chunk index
    encryptedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    return {
      success: errors.length === 0 && encryptedChunks.length === metadata.chunks.length,
      encryptedChunks,
      metadata,
      errors,
    };
  }

  /**
   * Export all recovery data for backup
   * User should store this securely along with their passphrase
   */
  async exportFullBackup(userId: string): Promise<{
    exportDate: string;
    userId: string;
    files: RecoveryMetadata[];
    encryptionData: {
      salt: string;
      verificationHash: string;
    };
  }> {
    // Get user's encryption data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        encryptionSalt: true,
        encryptionVerificationHash: true,
      },
    });

    if (!user?.encryptionSalt || !user?.encryptionVerificationHash) {
      throw new Error('User encryption not initialized');
    }

    // Get all files
    const files = await prisma.file.findMany({
      where: { userId, isTrashed: false },
      select: { id: true },
    });

    // Export metadata for each file
    const fileMetadata: RecoveryMetadata[] = [];
    for (const file of files) {
      try {
        const metadata = await this.exportRecoveryMetadata(userId, file.id);
        fileMetadata.push(metadata);
      } catch (error) {
        console.error(`Failed to export metadata for file ${file.id}:`, error);
      }
    }

    return {
      exportDate: new Date().toISOString(),
      userId,
      files: fileMetadata,
      encryptionData: {
        salt: user.encryptionSalt,
        verificationHash: user.encryptionVerificationHash,
      },
    };
  }

  /**
   * Verify that a file can be fully recovered
   */
  async verifyRecoverability(
    userId: string,
    fileId: string
  ): Promise<{
    recoverable: boolean;
    issues: string[];
    chunkStatus: Array<{
      chunkIndex: number;
      accessible: boolean;
      integrityValid: boolean;
    }>;
  }> {
    const issues: string[] = [];
    const chunkStatus: Array<{
      chunkIndex: number;
      accessible: boolean;
      integrityValid: boolean;
    }> = [];

    try {
      const metadata = await this.exportRecoveryMetadata(userId, fileId);
      const result = await this.recoverEncryptedChunks(userId, metadata);

      for (const chunk of result.encryptedChunks) {
        chunkStatus.push({
          chunkIndex: chunk.chunkIndex,
          accessible: true,
          integrityValid: chunk.verified,
        });

        if (!chunk.verified) {
          issues.push(`Chunk ${chunk.chunkIndex} failed integrity check`);
        }
      }

      // Check for missing chunks
      const downloadedIndices = new Set(result.encryptedChunks.map(c => c.chunkIndex));
      for (const chunkMeta of metadata.chunks) {
        if (!downloadedIndices.has(chunkMeta.chunkIndex)) {
          chunkStatus.push({
            chunkIndex: chunkMeta.chunkIndex,
            accessible: false,
            integrityValid: false,
          });
          issues.push(`Chunk ${chunkMeta.chunkIndex} is not accessible`);
        }
      }

      issues.push(...result.errors);

      return {
        recoverable: issues.length === 0,
        issues,
        chunkStatus,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        recoverable: false,
        issues: [`Recovery verification failed: ${errorMessage}`],
        chunkStatus: [],
      };
    }
  }
}

export const recoveryService = new RecoveryService();
