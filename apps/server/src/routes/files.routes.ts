import { Router, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { versionService } from '../services/version.service';
import { prisma } from '../lib/prisma';

const router: Router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max (Telegram limit)
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

// Upload file
router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new ApiError('No file provided', 400);
  }

  const { folderId } = req.body;

  // Get user's storage channel
  const storageChannel = await prisma.storageChannel.findFirst({
    where: { userId: req.user!.id },
  });

  if (!storageChannel) {
    throw new ApiError('No storage channel found. Please reconnect your Telegram account.', 400);
  }

  const file = await storageService.uploadFile({
    userId: req.user!.id,
    file: req.file.buffer,
    fileName: req.file.originalname,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    folderId,
    channelId: storageChannel.channelId,
  });

  res.json({
    success: true,
    data: file,
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

// Download file
router.get('/:id/download', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { buffer, fileName, mimeType } = await storageService.downloadFile(
    req.user!.id,
    id
  );

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
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
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
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
