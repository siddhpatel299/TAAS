import { prisma } from '../lib/prisma';
import { telegramService } from './telegram.service';
import { Prisma } from '@prisma/client';

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
  // Upload a file
  async uploadFile(params: FileUploadParams) {
    const { userId, file, fileName, originalName, mimeType, size, folderId, channelId, onProgress } = params;

    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    // Upload to Telegram
    const { messageId, fileId } = await telegramService.uploadFile(
      client,
      channelId,
      file,
      fileName,
      mimeType,
      onProgress
    );

    // Save to database
    const savedFile = await prisma.file.create({
      data: {
        name: fileName,
        originalName,
        mimeType,
        size: BigInt(size),
        telegramFileId: fileId,
        telegramMessageId: messageId,
        channelId,
        folderId,
        userId,
      },
    });

    // Update storage channel stats
    await prisma.storageChannel.update({
      where: {
        channelId_userId: { channelId, userId },
      },
      data: {
        usedBytes: { increment: BigInt(size) },
        fileCount: { increment: 1 },
      },
    });

    return {
      ...savedFile,
      size: Number(savedFile.size),
    };
  }

  // Download a file
  async downloadFile(userId: string, fileId: string, onProgress?: (progress: number) => void) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('Not authenticated with Telegram');
    }

    const buffer = await telegramService.downloadFile(
      client,
      file.channelId,
      file.telegramMessageId,
      onProgress
    );

    return {
      buffer,
      fileName: file.originalName,
      mimeType: file.mimeType,
    };
  }

  // Delete a file (move to trash or permanent delete)
  async deleteFile(userId: string, fileId: string, permanent: boolean = false) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    if (permanent || file.isTrashed) {
      // Permanent delete
      const client = await telegramService.getClient(userId);
      if (client) {
        try {
          await telegramService.deleteFile(client, file.channelId, file.telegramMessageId);
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

    if (folderId !== undefined) {
      where.folderId = folderId;
    }

    if (isStarred !== undefined) {
      where.isStarred = isStarred;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
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
  async getStorageStats(userId: string) {
    const channels = await prisma.storageChannel.findMany({
      where: { userId },
    });

    const totalUsed = channels.reduce((sum, c) => sum + Number(c.usedBytes), 0);
    const totalFiles = channels.reduce((sum, c) => sum + c.fileCount, 0);

    return {
      totalUsed,
      totalFiles,
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
    });

    const client = await telegramService.getClient(userId);

    for (const file of trashedFiles) {
      if (client) {
        try {
          await telegramService.deleteFile(client, file.channelId, file.telegramMessageId);
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
