import { Router, Response } from 'express';
import multer from 'multer';
import Busboy from 'busboy';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { versionService } from '../services/version.service';
import { prisma } from '../lib/prisma';
import { telegramService } from '../services/telegram.service';
import { botUploadService } from '../services/bot-upload.service';
import crypto from 'crypto';

const router: Router = Router();

// Configure multer for file uploads - use DISK storage to minimize memory usage
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir()); // Use system temp directory
  },
  filename: (req, file, cb) => {
    cb(null, `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max per chunk (slightly above our 20MB chunks)
  },
});

// Get all files with filters
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    folderId,
    starred,
    trash,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
  } = req.query;

  const result = await storageService.getFiles({
    userId: req.user!.id,
    folderId: folderId as string | undefined,
    isStarred: starred === 'true' ? true : undefined,
    isTrashed: trash === 'true',
    search: search as string | undefined,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 50,
  });

  res.json({
    success: true,
    data: result.files,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    },
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// STREAMING UPLOAD: Fast upload with minimal memory usage
// Streams file chunks directly to Telegram as they arrive
// ═══════════════════════════════════════════════════════════════════════════
router.post('/upload', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user's storage channel first
    const storageChannel = await prisma.storageChannel.findFirst({
      where: { userId },
    });

    if (!storageChannel) {
      res.status(400).json({
        success: false,
        error: 'No storage channel found. Please reconnect your Telegram account.',
      });
      return;
    }

    // Get Telegram client
    const client = await telegramService.getClient(userId);
    if (!client) {
      res.status(400).json({
        success: false,
        error: 'Not authenticated with Telegram',
      });
      return;
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB
      },
    });

    let folderId: string | undefined;
    let uploadResult: any;
    let fileName = '';
    let mimeType = 'application/octet-stream';
    let fileSize = 0;

    // Collect folderId from form fields
    busboy.on('field', (name: string, value: string) => {
      if (name === 'folderId' && value) {
        folderId = value;
      }
    });

    // Stream file directly to a buffer, but upload in chunks to avoid memory overflow for large files
    busboy.on('file', async (fieldname: string, fileStream: any, info: { filename: string; mimeType: string }) => {
      fileName = info.filename || 'unnamed_file';
      mimeType = info.mimeType || 'application/octet-stream';

      console.log(`[StreamUpload] Starting: ${fileName} `);

      // If bots are available, use streaming chunk upload
      if (botUploadService.isAvailable()) {
        const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB
        let currentChunkBuffer: Buffer = Buffer.alloc(0);
        let chunkIndex = 0;
        const uploadPromises: Promise<any>[] = [];
        const uploadedChunks: any[] = [];
        const MAX_CONCURRENT = botUploadService.getBotCount();
        const hash = crypto.createHash('sha256');

        fileStream.on('data', async (chunk: Buffer) => {
          // Pause stream processing to handle buffer
          fileStream.pause();

          hash.update(chunk);
          currentChunkBuffer = Buffer.concat([currentChunkBuffer, chunk]);
          fileSize += chunk.length;

          // If buffer exceeds chunk size, upload it
          if (currentChunkBuffer.length >= CHUNK_SIZE) {
            const chunkToUpload = currentChunkBuffer.slice(0, CHUNK_SIZE);
            currentChunkBuffer = currentChunkBuffer.slice(CHUNK_SIZE);

            const currentIndex = chunkIndex++;
            const botToken = botUploadService.getNextBotToken(currentIndex);

            // Wait if too many concurrent uploads
            if (uploadPromises.length >= MAX_CONCURRENT) {
              await Promise.race(uploadPromises);
            }

            const promise = botUploadService.uploadChunk(
              botToken,
              storageChannel.channelId,
              chunkToUpload,
              `${fileName}.part${currentIndex} `,
              mimeType
            ).then(result => {
              // Remove self from promises
              const pIndex = uploadPromises.indexOf(promise);
              if (pIndex > -1) uploadPromises.splice(pIndex, 1);

              uploadedChunks.push({
                chunkIndex: currentIndex,
                fileId: result.fileId,
                messageId: result.messageId,
                size: result.size
              });
              return result;
            }).catch(err => {
              console.error(`[StreamUpload] Chunk ${currentIndex} failed: `, err);
              throw err;
            });

            uploadPromises.push(promise);
          }

          fileStream.resume();
        });

        fileStream.on('end', async () => {
          try {
            console.log(`[StreamUpload] Stream ended, uploading remaining buffer...`);

            // Upload remaining buffer
            if (currentChunkBuffer.length > 0) {
              const currentIndex = chunkIndex++;
              const botToken = botUploadService.getNextBotToken(currentIndex);

              const promise = botUploadService.uploadChunk(
                botToken,
                storageChannel.channelId,
                currentChunkBuffer,
                `${fileName}.part${currentIndex} `,
                mimeType
              ).then(result => {
                uploadedChunks.push({
                  chunkIndex: currentIndex,
                  fileId: result.fileId,
                  messageId: result.messageId,
                  size: result.size
                });
                return result;
              });
              uploadPromises.push(promise);
            }

            // Wait for all uploads to finish
            await Promise.all(uploadPromises);

            // Sort chunks by index
            uploadedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

            // For single chunk files, use the first chunk as the file
            const telegramFileId = uploadedChunks[0].fileId;
            const telegramMessageId = uploadedChunks[0].messageId;

            const checksum = hash.digest('hex');

            console.log(`[StreamUpload] All chunks uploaded.Saving metadata...`);

            // Save upload result
            uploadResult = await storageService.saveUploadResult({
              userId,
              fileName,
              originalName: fileName,
              mimeType,
              size: fileSize,
              folderId,
              channelId: storageChannel.channelId,
              chunks: uploadedChunks,
              checksum,
              telegramFileId,
              telegramMessageId
            });

            console.log(`[StreamUpload] Completed: ${fileName} `);
          } catch (error: any) {
            console.error(`[StreamUpload] Failed: ${fileName} `, error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                error: error.message || 'Upload failed',
              });
            }
          }
        });
      } else {
        // Fallback to memory buffering (old behavior) for when bots are not available
        // Note: This might still crash 512MB limit for large files
        const chunks: Buffer[] = [];
        fileStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          fileSize += chunk.length;
        });

        fileStream.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            console.log(`[StreamUpload] Buffered ${fileSize} bytes, uploading to Telegram(Legacy)...`);

            const file = await storageService.uploadFile({
              userId,
              file: buffer,
              fileName,
              originalName: fileName,
              mimeType,
              size: fileSize,
              folderId,
              channelId: storageChannel.channelId,
            });

            uploadResult = file;
            console.log(`[StreamUpload] Completed: ${fileName} `);
          } catch (error: any) {
            console.error(`[StreamUpload] Failed: ${fileName} `, error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                error: error.message || 'Upload failed',
              });
            }
          }
        });
      }
    });

    busboy.on('finish', () => {
      // Wait a bit for the upload to complete, then send response
      const checkComplete = setInterval(() => {
        if (uploadResult) {
          clearInterval(checkComplete);
          if (!res.headersSent) {
            res.json({
              success: true,
              data: uploadResult,
            });
          }
        }
      }, 100);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkComplete);
        if (!res.headersSent) {
          res.status(504).json({
            success: false,
            error: 'Upload timeout',
          });
        }
      }, 5 * 60 * 1000);
    });

    busboy.on('error', (error: Error) => {
      console.error('[StreamUpload] Busboy error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message || 'Upload failed',
        });
      }
    });

    req.pipe(busboy);
  } catch (error: any) {
    console.error('[StreamUpload] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || 'Upload failed',
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MULTIPART UPLOAD: Client-side chunking for large files
// Client sends 20MB chunks individually to avoid timeouts
// ═══════════════════════════════════════════════════════════════════════════

// In-memory store for active uploads (use Redis in production)
const activeUploads = new Map<string, {
  userId: string;
  channelId: string;
  fileName: string;
  mimeType: string;
  folderId?: string;
  totalSize: number;
  totalParts: number;
  uploadedParts: { partNumber: number; fileId: string; messageId: number; size: number }[];
  createdAt: Date;
}>();

// Cleanup old uploads every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [uploadId, upload] of activeUploads) {
    if (now - upload.createdAt.getTime() > 30 * 60 * 1000) { // 30 min expiry
      activeUploads.delete(uploadId);
      console.log(`[MultipartUpload] Expired upload: ${uploadId}`);
    }
  }
}, 10 * 60 * 1000);

// Initialize multipart upload
router.post('/upload/init', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { fileName, mimeType, totalSize, totalParts, folderId } = req.body;

  if (!fileName || !totalSize || !totalParts) {
    throw new ApiError('Missing required fields: fileName, totalSize, totalParts', 400);
  }

  // Get user's storage channel
  const storageChannel = await prisma.storageChannel.findFirst({
    where: { userId },
  });

  if (!storageChannel) {
    throw new ApiError('No storage channel found. Please reconnect your Telegram account.', 400);
  }

  // Check if bots are available
  if (!botUploadService.isAvailable()) {
    throw new ApiError('Bot service not available', 500);
  }

  // Create upload session
  const uploadId = crypto.randomUUID();
  activeUploads.set(uploadId, {
    userId,
    channelId: storageChannel.channelId,
    fileName,
    mimeType: mimeType || 'application/octet-stream',
    folderId,
    totalSize,
    totalParts,
    uploadedParts: [],
    createdAt: new Date(),
  });

  console.log(`[MultipartUpload] Init: ${uploadId} - ${fileName} (${totalParts} parts, ${(totalSize / 1024 / 1024).toFixed(1)} MB)`);

  res.json({
    success: true,
    data: {
      uploadId,
      channelId: storageChannel.channelId,
    },
  });
}));

// Upload a single part
router.post('/upload/part', authMiddleware, upload.single('chunk'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { uploadId, partNumber } = req.body;

  if (!uploadId || partNumber === undefined || !req.file) {
    throw new ApiError('Missing required fields: uploadId, partNumber, chunk', 400);
  }

  const uploadSession = activeUploads.get(uploadId);
  if (!uploadSession) {
    throw new ApiError('Upload session not found or expired', 404);
  }

  if (uploadSession.userId !== userId) {
    throw new ApiError('Unauthorized', 403);
  }

  const partNum = parseInt(partNumber);

  // Get file info from disk (multer uses diskStorage)
  const tempFilePath = req.file.path;
  const fileSize = req.file.size;

  console.log(`[MultipartUpload] Part ${partNum + 1}/${uploadSession.totalParts} - ${(fileSize / 1024 / 1024).toFixed(1)} MB (streaming)`);

  try {
    // Get bot token for this part (round-robin)
    const botToken = botUploadService.getNextBotToken(partNum);

    // Upload chunk to Telegram using STREAMING (minimal memory)
    const chunkFileName = uploadSession.totalParts > 1
      ? `${uploadSession.fileName}.part${partNum + 1}of${uploadSession.totalParts}`
      : uploadSession.fileName;

    const result = await botUploadService.uploadChunkFromFile(
      botToken,
      uploadSession.channelId,
      tempFilePath,
      chunkFileName,
      uploadSession.mimeType,
      fileSize
    );

    // Store part info
    uploadSession.uploadedParts.push({
      partNumber: partNum,
      fileId: result.fileId,
      messageId: result.messageId,
      size: result.size,
    });

    res.json({
      success: true,
      data: {
        partNumber: partNum,
        fileId: result.fileId,
        messageId: result.messageId,
      },
    });
  } finally {
    // Always clean up temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (cleanupErr) {
      console.warn(`[MultipartUpload] Failed to cleanup temp file: ${tempFilePath}`);
    }
  }
}));

// Complete multipart upload
router.post('/upload/complete', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { uploadId } = req.body;

  if (!uploadId) {
    throw new ApiError('Missing uploadId', 400);
  }

  const uploadSession = activeUploads.get(uploadId);
  if (!uploadSession) {
    throw new ApiError('Upload session not found or expired', 404);
  }

  if (uploadSession.userId !== userId) {
    throw new ApiError('Unauthorized', 403);
  }

  // Check all parts uploaded
  if (uploadSession.uploadedParts.length !== uploadSession.totalParts) {
    throw new ApiError(`Missing parts: got ${uploadSession.uploadedParts.length}/${uploadSession.totalParts}`, 400);
  }

  // Sort parts by part number
  uploadSession.uploadedParts.sort((a, b) => a.partNumber - b.partNumber);

  // Calculate checksum placeholder (we don't have the full file on server)
  const checksum = crypto.randomUUID(); // Client should send real checksum

  // Save to database
  const savedFile = await storageService.saveUploadResult({
    userId,
    fileName: uploadSession.fileName,
    originalName: uploadSession.fileName,
    mimeType: uploadSession.mimeType,
    size: uploadSession.totalSize,
    folderId: uploadSession.folderId,
    channelId: uploadSession.channelId,
    chunks: uploadSession.uploadedParts.map(p => ({
      chunkIndex: p.partNumber,
      fileId: p.fileId,
      messageId: p.messageId,
      size: p.size,
    })),
    checksum,
    telegramFileId: uploadSession.uploadedParts[0].fileId,
    telegramMessageId: uploadSession.uploadedParts[0].messageId,
  });

  // Cleanup
  activeUploads.delete(uploadId);

  console.log(`[MultipartUpload] Complete: ${uploadSession.fileName}`);

  res.json({
    success: true,
    data: {
      ...savedFile,
      size: Number(savedFile.size),
    },
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// DIRECT UPLOAD: Register file metadata (file uploaded directly browser→Telegram)
// ═══════════════════════════════════════════════════════════════════════════
// This endpoint receives only metadata, NOT the actual file data.
// The file is uploaded directly from the browser to Telegram.
// Server memory usage: ~1KB per request (metadata only)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/register', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    telegramFileId,
    telegramMessageId,
    channelId,
    fileName,
    originalName,
    mimeType,
    size,
    checksum,
    folderId,
  } = req.body;

  // Validate required fields
  if (!telegramFileId || !telegramMessageId || !channelId || !fileName || !size) {
    throw new ApiError('Missing required fields: telegramFileId, telegramMessageId, channelId, fileName, size', 400);
  }

  // Verify the channel belongs to this user
  const storageChannel = await prisma.storageChannel.findFirst({
    where: {
      channelId,
      userId: req.user!.id,
    },
  });

  if (!storageChannel) {
    throw new ApiError('Invalid channel or channel not found for this user', 403);
  }

  // Verify folder if provided
  if (folderId) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: req.user!.id,
      },
    });

    if (!folder) {
      throw new ApiError('Folder not found', 404);
    }
  }

  // Create file record (metadata only)
  const file = await prisma.file.create({
    data: {
      name: fileName,
      originalName: originalName || fileName,
      mimeType: mimeType || 'application/octet-stream',
      size: BigInt(size),
      telegramFileId: String(telegramFileId),
      telegramMessageId: Number(telegramMessageId),
      channelId,
      checksum: checksum || null,
      folderId: folderId || null,
      userId: req.user!.id,
      isChunked: false, // Browser uploads handle chunking internally
    },
    include: {
      folder: {
        select: { id: true, name: true },
      },
    },
  });

  // Update storage channel stats
  await prisma.storageChannel.update({
    where: {
      channelId_userId: { channelId, userId: req.user!.id },
    },
    data: {
      usedBytes: { increment: BigInt(size) },
      fileCount: { increment: 1 },
    },
  });

  console.log(`[DirectUpload] File registered: ${fileName} (${size} bytes)`);

  res.json({
    success: true,
    data: {
      ...file,
      size: Number(file.size),
    },
  });
}));

// Download file - STREAMING with Bot API (avoids AUTH_KEY_DUPLICATED)
router.get('/:id/download', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get file info first
  const file = await prisma.file.findFirst({
    where: { id, userId: req.user!.id },
    include: { chunks: true },
  });

  if (!file) {
    throw new ApiError('File not found', 404);
  }

  // Send headers IMMEDIATELY - this triggers browser Save As dialog
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', file.size.toString());

  console.log(`[StreamDownload] Starting: ${file.originalName} (isChunked: ${file.isChunked}, chunks: ${file.chunks?.length || 0})`);

  // If file has chunks, stream them one by one
  if (file.isChunked && file.chunks && file.chunks.length > 0) {
    // Sort chunks by index
    const sortedChunks = [...file.chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);

    console.log(`[StreamDownload] Chunk file IDs:`, sortedChunks.map(c => ({ index: c.chunkIndex, fileId: c.telegramFileId?.substring(0, 20) + '...' })));

    for (const chunk of sortedChunks) {
      try {
        console.log(`[StreamDownload] Downloading chunk ${chunk.chunkIndex} with fileId: ${chunk.telegramFileId?.substring(0, 30)}...`);

        // Download this chunk using bot (one at a time to save memory)
        const chunkBuffer = await botUploadService.downloadSingleChunk(
          chunk.telegramFileId,
          chunk.chunkIndex
        );

        // Write to response immediately
        res.write(chunkBuffer);
        console.log(`[StreamDownload] Chunk ${chunk.chunkIndex + 1}/${sortedChunks.length} sent (${chunkBuffer.length} bytes)`);
      } catch (error: any) {
        console.error(`[StreamDownload] Chunk ${chunk.chunkIndex} FAILED:`, {
          error: error.message,
          fileId: chunk.telegramFileId,
          response: error.response?.data,
        });
        // If we've already started sending data, we can't send error
        if (!res.headersSent) {
          throw error;
        }
        res.end();
        return;
      }
    }
    res.end();
  } else {
    // Single file (not chunked) - download via bot service
    console.log(`[StreamDownload] Single file download: ${file.originalName} (telegramFileId: ${file.telegramFileId?.substring(0, 30)}...)`);
    const { buffer } = await storageService.downloadFile(req.user!.id, id);
    res.send(buffer);
  }

  console.log(`[StreamDownload] Complete: ${file.originalName}`);
}));

// Get file details
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const file = await prisma.file.findFirst({
    where: { id, userId: req.user!.id },
    include: {
      folder: {
        select: { id: true, name: true },
      },
    },
  });

  if (!file) {
    throw new ApiError('File not found', 404);
  }

  res.json({
    success: true,
    data: { ...file, size: Number(file.size) },
  });
}));

// Rename file
router.patch('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new ApiError('Name is required', 400);
  }

  const file = await storageService.renameFile(req.user!.id, id, name);

  res.json({
    success: true,
    data: file,
  });
}));

// Toggle star
router.post('/:id/star', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await storageService.toggleStar(req.user!.id, id);

  res.json({
    success: true,
    data: result,
  });
}));

// Move file to folder
router.post('/:id/move', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { folderId } = req.body;

  const result = await storageService.moveFile(req.user!.id, id, folderId || null);

  res.json({
    success: true,
    data: result,
  });
}));

// Move to trash
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { permanent } = req.query;

  const result = await storageService.deleteFile(
    req.user!.id,
    id,
    permanent === 'true'
  );

  res.json({
    success: true,
    data: result,
  });
}));

// Restore from trash
router.post('/:id/restore', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await storageService.restoreFile(req.user!.id, id);

  res.json({
    success: true,
    data: result,
  });
}));

// Empty trash
router.delete('/trash/empty', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await storageService.emptyTrash(req.user!.id);

  res.json({
    success: true,
    data: result,
  });
}));

// Get storage stats
router.get('/stats/usage', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await storageService.getStorageStats(req.user!.id);

  res.json({
    success: true,
    data: stats,
  });
}));

// Stream file for preview
router.get('/:id/preview', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { buffer, fileName, mimeType } = await storageService.downloadFile(
    req.user!.id,
    id
  );

  // Set appropriate headers for inline viewing
  res.setHeader('Content-Disposition', `inline; filename = "${encodeURIComponent(fileName)}"`);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(buffer);
}));

// Get file versions
router.get('/:id/versions', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Verify file belongs to user
  const file = await prisma.file.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!file) {
    throw new ApiError('File not found', 404);
  }

  const versions = await versionService.getVersions(id);

  res.json({
    success: true,
    data: versions.map(v => ({
      ...v,
      size: Number(v.size),
    })),
  });
}));

// Restore a specific version
router.post('/:id/versions/:version/restore', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, version } = req.params;

  const file = await prisma.file.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!file) {
    throw new ApiError('File not found', 404);
  }

  const versionData = await versionService.getVersion(id, parseInt(version));

  if (!versionData) {
    throw new ApiError('Version not found', 404);
  }

  // Save current as a version first
  await versionService.saveVersion(id);

  // Restore the old version
  const updated = await prisma.file.update({
    where: { id },
    data: {
      size: versionData.size,
      telegramFileId: versionData.telegramFileId,
      telegramMessageId: versionData.telegramMessageId,
      channelId: versionData.channelId,
    },
  });

  res.json({
    success: true,
    data: { ...updated, size: Number(updated.size) },
  });
}));

// Bulk operations
router.post('/bulk/delete', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileIds, permanent } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new ApiError('File IDs are required', 400);
  }

  const results = await Promise.allSettled(
    fileIds.map((id: string) =>
      storageService.deleteFile(req.user!.id, id, permanent === true)
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  res.json({
    success: true,
    data: { succeeded, failed, total: fileIds.length },
  });
}));

router.post('/bulk/move', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileIds, folderId } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new ApiError('File IDs are required', 400);
  }

  const results = await Promise.allSettled(
    fileIds.map((id: string) =>
      storageService.moveFile(req.user!.id, id, folderId || null)
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  res.json({
    success: true,
    data: { succeeded, failed, total: fileIds.length },
  });
}));

router.post('/bulk/star', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileIds, starred } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new ApiError('File IDs are required', 400);
  }

  await prisma.file.updateMany({
    where: {
      id: { in: fileIds },
      userId: req.user!.id,
    },
    data: { isStarred: starred },
  });

  res.json({
    success: true,
    data: { count: fileIds.length },
  });
}));

router.post('/bulk/restore', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileIds } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new ApiError('File IDs are required', 400);
  }

  const results = await Promise.allSettled(
    fileIds.map((id: string) =>
      storageService.restoreFile(req.user!.id, id)
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  res.json({
    success: true,
    data: { succeeded, failed, total: fileIds.length },
  });
}));

export default router;
