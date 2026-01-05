import { Router, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { prisma } from '../lib/prisma';

const router = Router();

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

export default router;
