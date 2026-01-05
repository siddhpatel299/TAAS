import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { syncService } from '../services/sync.service';
import { prisma } from '../lib/prisma';

const router: ReturnType<typeof Router> = Router();

// Helper for async route handlers
const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>) => 
  (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Get sync status
router.get('/status', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const status = syncService.getSyncStatus(userId);
  
  res.json({
    success: true,
    data: {
      isRunning: status.isRunning,
      lastSync: status.lastSync,
      lastResult: status.lastResult,
      progress: status.progress,
    },
  });
}));

// Start manual sync from Telegram
router.post('/start', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { channelId } = req.body;

  // Check if sync is already running
  const status = syncService.getSyncStatus(userId);
  if (status.isRunning) {
    return res.status(400).json({
      success: false,
      error: 'Sync already in progress',
    });
  }

  // Start sync in background (don't await)
  syncService.syncFromTelegram(userId, channelId).catch((error) => {
    console.error('[Sync] Error during sync:', error);
  });

  res.json({
    success: true,
    message: 'Sync started',
  });
}));

// Get sync result (when sync completes)
router.get('/result', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const status = syncService.getSyncStatus(userId);

  res.json({
    success: true,
    data: {
      isComplete: !status.isRunning,
      result: status.lastResult,
      lastSync: status.lastSync,
    },
  });
}));

// Get storage channels for the user
router.get('/channels', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const channels = await prisma.storageChannel.findMany({
    where: { userId },
    select: {
      id: true,
      channelId: true,
      channelName: true,
      usedBytes: true,
      fileCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    data: channels.map((c) => ({
      ...c,
      usedBytes: Number(c.usedBytes),
    })),
  });
}));

// Setup real-time listener (called after login)
router.post('/listen', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    await syncService.setupMessageListener(userId);
    res.json({
      success: true,
      message: 'Real-time sync listener activated',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to setup listener',
    });
  }
}));

export default router;
