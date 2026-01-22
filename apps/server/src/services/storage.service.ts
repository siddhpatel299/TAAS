import { prisma } from '../lib/prisma';
import { telegramService } from './telegram.service';
import { chunkService } from './chunk.service';
import { botUploadService } from './bot-upload.service';
import { Prisma } from '@prisma/client';
import { flowService } from './flow.service';

interface FileUploadParams {
  userId: string;
  file: Buffer;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId?: string;
  channelId: string;
  onProgress?: (progress: number) => void;
}

interface FileListParams {
  userId: string;
  folderId?: string;
  isStarred?: boolean;
  isTrashed?: boolean;
  search?: string;
  sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class StorageService {
  // Upload a file (with automatic chunking for files > 2GB)
  async uploadFile(params: FileUploadParams) {
    const { userId, file, fileName, originalName, mimeType, size, folderId, channelId, onProgress } = params;

    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    // Upload to Telegram (automatically chunks if > 2GB)
    const uploadResult = await chunkService.uploadFile({
      client,
      channelId,
      buffer: file,
      fileName,
      mimeType,
      userId,
      onProgress,
    });

    // Save to database
    const savedFile = await prisma.file.create({
      data: {
        name: fileName,
        originalName,
        mimeType,
        size: BigInt(size),
        telegramFileId: uploadResult.telegramFileId,
        telegramMessageId: uploadResult.telegramMessageId,
        channelId,
        folderId,
        userId,
        isChunked: uploadResult.isChunked,
        checksum: uploadResult.checksum,
      },
    });

    // Save chunks if file was chunked
    if (uploadResult.isChunked && uploadResult.chunks) {
      await prisma.fileChunk.createMany({
        data: uploadResult.chunks.map(chunk => ({
          fileId: savedFile.id,
          chunkIndex: chunk.chunkIndex,
          telegramFileId: chunk.telegramFileId,
          telegramMessageId: chunk.telegramMessageId,
          channelId,
          size: BigInt(chunk.size),
        })),
      });
    }

    // Update storage channel stats
    await prisma.storageChannel.update({
      where: {
        channelId_userId: { channelId, userId },
      },
      data: {
        usedBytes: { increment: BigInt(size) },
      },
    });

    const fileResult = {
      ...savedFile,
      size: Number(savedFile.size),
    };

    // Emit Event
    flowService.emitEvent('STORAGE_FILE_UPLOADED', fileResult, userId).catch(console.error);

    return fileResult;
  }

  // Save upload result from streaming upload
  async saveUploadResult(params: {
    userId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    folderId?: string;
    channelId: string;
    chunks: any[];
    checksum: string;
    telegramFileId: string;
    telegramMessageId: number;
  }) {
    const { userId, fileName, originalName, mimeType, size, folderId, channelId, chunks, checksum, telegramFileId, telegramMessageId } = params;

    // Save to database
    const savedFile = await prisma.file.create({
      data: {
        name: fileName,
        originalName,
        mimeType,
        size: BigInt(size),
        telegramFileId,
        telegramMessageId,
        channelId,
        folderId,
        userId,
        isChunked: chunks.length > 1,
        checksum,
      },
    });

    // Save chunks if file was chunked
    if (chunks.length > 0) {
      await prisma.fileChunk.createMany({
        data: chunks.map(chunk => ({
          fileId: savedFile.id,
          chunkIndex: chunk.chunkIndex,
          telegramFileId: chunk.fileId, // Note: chunk.fileId from bot result
          telegramMessageId: chunk.messageId, // Note: chunk.messageId from bot result
          channelId,
          size: BigInt(chunk.size),
        })),
      });
    }

    // Update storage channel stats
    await prisma.storageChannel.update({
      where: {
        channelId_userId: { channelId, userId },
      },
      data: {
        usedBytes: { increment: BigInt(size) },
      },
    });

    const result = {
      ...savedFile,
      size: Number(savedFile.size),
    };

    // Emit Event
    flowService.emitEvent('STORAGE_FILE_UPLOADED', result, userId).catch(console.error);

    return result;
  }

  // Download a file - uses Bot API first to avoid AUTH_KEY_DUPLICATED
  async downloadFile(userId: string, fileId: string, onProgress?: (progress: number) => void) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Try Bot API first (avoids AUTH_KEY_DUPLICATED entirely)
    if (botUploadService.isAvailable()) {
      try {
        // For chunked files uploaded via bot
        if (file.isChunked && file.chunks.length > 0) {
          console.log(`[Storage] Bot download: ${file.originalName} (${file.chunks.length} chunks)`);
          const chunkInfos = file.chunks.map(c => ({
            fileId: c.telegramFileId,
            chunkIndex: c.chunkIndex,
          }));
          const buffer = await botUploadService.downloadFile(chunkInfos);
          return { buffer, fileName: file.originalName, mimeType: file.mimeType };
        }

        // For non-chunked files - try download by message ID (works for MTProto files!)
        // This forwards the message to get a Bot API file_id
        if (file.channelId && file.telegramMessageId) {
          console.log(`[Storage] Bot download by message ID: ${file.originalName}`);
          const buffer = await botUploadService.downloadByMessageId(
            file.channelId,
            file.telegramMessageId
          );
          return { buffer, fileName: file.originalName, mimeType: file.mimeType };
        }
      } catch (error) {
        console.error('[Storage] Bot download failed, trying MTProto:', error);
      }
    }

    // Fallback to MTProto (may cause AUTH_KEY_DUPLICATED if session is busy)
    console.log(`[Storage] MTProto fallback for: ${file.originalName}`);
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    const buffer = await chunkService.downloadFile(client, fileId, onProgress);
    return { buffer, fileName: file.originalName, mimeType: file.mimeType };
  }

  // Delete a file (move to trash or permanent delete)
  async deleteFile(userId: string, fileId: string, permanent: boolean = false) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
      include: { chunks: true },
    });

    if (!file) {
      throw new Error('File not found');
    }

    if (permanent || file.isTrashed) {
      // Permanent delete
      const client = await telegramService.getClient(userId);
      if (client) {
        try {
          // Use chunk service to delete (handles chunked files)
          await chunkService.deleteFile(client, fileId);
        } catch (error) {
          console.error('Failed to delete from Telegram:', error);
        }
      }

      await prisma.file.delete({ where: { id: fileId } });

      // Update storage channel stats
      await prisma.storageChannel.update({
        where: {
          channelId_userId: { channelId: file.channelId, userId },
        },
        data: {
          usedBytes: { decrement: file.size },
          fileCount: { decrement: 1 },
        },
      });

      return { deleted: true };
    } else {
      // Move to trash
      await prisma.file.update({
        where: { id: fileId },
        data: {
          isTrashed: true,
          trashedAt: new Date(),
        },
      });
      return { trashed: true };
    }
  }

  // Restore file from trash
  async restoreFile(userId: string, fileId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isTrashed: true },
    });

    if (!file) {
      throw new Error('File not found in trash');
    }

    await prisma.file.update({
      where: { id: fileId },
      data: {
        isTrashed: false,
        trashedAt: null,
      },
    });

    return { restored: true };
  }

  // Toggle star on file
  async toggleStar(userId: string, fileId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        isStarred: !file.isStarred,
      },
    });

    return { isStarred: updated.isStarred };
  }

  // Get files with filters
  async getFiles(params: FileListParams) {
    const {
      userId,
      folderId,
      isStarred,
      isTrashed = false,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = params;

    const where: Prisma.FileWhereInput = {
      userId,
      isTrashed,
    };

    // When filtering by starred or searching, don't apply folder filter
    // This allows starred files from any folder to appear
    if (isStarred !== undefined) {
      where.isStarred = isStarred;
      // Don't filter by folder when getting starred files - show from all folders
    } else if (search) {
      // Search across all files regardless of folder
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
      // Don't filter by folder when searching - search globally
    } else {
      // Not searching or filtering by starred - filter by folder
      // undefined means root level (folderId is null)
      // If folderId is explicitly passed, filter by that folder
      if (folderId === undefined) {
        where.folderId = null; // Only show root level files
      } else {
        where.folderId = folderId; // Show files in specific folder
      }
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          folder: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.file.count({ where }),
    ]);

    return {
      files: files.map((f) => ({ ...f, size: Number(f.size) })),
      total,
      page,
      limit,
      hasMore: total > page * limit,
    };
  }

  // Move file to folder
  async moveFile(userId: string, fileId: string, folderId: string | null) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId },
      });
      if (!folder) {
        throw new Error('Folder not found');
      }
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { folderId },
    });

    return { moved: true };
  }

  // Rename file
  async renameFile(userId: string, fileId: string, newName: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { name: newName },
    });

    return { ...updated, size: Number(updated.size) };
  }

  // Get storage stats
  // Get storage stats
  async getStorageStats(userId: string) {
    const channels = await prisma.storageChannel.findMany({
      where: { userId },
    });

    const totalUsed = channels.reduce((sum, c) => sum + Number(c.usedBytes), 0);
    const totalFiles = channels.reduce((sum, c) => sum + c.fileCount, 0);

    // Get file counts by category
    const files = await prisma.file.findMany({
      where: {
        userId,
        isTrashed: false,
      },
      select: {
        mimeType: true,
        size: true,
      },
    });

    const categories = {
      video: { count: 0, size: 0 },
      photo: { count: 0, size: 0 },
      document: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
    };

    files.forEach(file => {
      const size = Number(file.size);
      if (file.mimeType.startsWith('video/')) {
        categories.video.count++;
        categories.video.size += size;
      } else if (file.mimeType.startsWith('image/')) {
        categories.photo.count++;
        categories.photo.size += size;
      } else if (
        file.mimeType.includes('pdf') ||
        file.mimeType.includes('document') ||
        file.mimeType.includes('text')
      ) {
        categories.document.count++;
        categories.document.size += size;
      } else {
        categories.other.count++;
        categories.other.size += size;
      }
    });

    return {
      totalUsed,
      totalFiles,
      categories,
      channels: channels.map((c) => ({
        ...c,
        usedBytes: Number(c.usedBytes),
      })),
    };
  }

  // Empty trash (delete all trashed files permanently)
  async emptyTrash(userId: string) {
    const trashedFiles = await prisma.file.findMany({
      where: { userId, isTrashed: true },
      include: { chunks: true },
    });

    const client = await telegramService.getClient(userId);

    for (const file of trashedFiles) {
      if (client) {
        try {
          // Use chunk service to delete (handles chunked files)
          await chunkService.deleteFile(client, file.id);
        } catch (error) {
          console.error('Failed to delete from Telegram:', error);
        }
      }

      await prisma.storageChannel.update({
        where: {
          channelId_userId: { channelId: file.channelId, userId },
        },
        data: {
          usedBytes: { decrement: file.size },
          fileCount: { decrement: 1 },
        },
      });
    }

    await prisma.file.deleteMany({
      where: { userId, isTrashed: true },
    });

    return { deleted: trashedFiles.length };
  }
}

export const storageService = new StorageService();
