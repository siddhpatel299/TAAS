import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { telegramService } from '../services/telegram.service';
import { chunkService } from '../services/chunk.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

const router: Router = Router();

// Create a shared link for a file
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { fileId, expiresIn, password, maxDownloads } = req.body;

    // Verify file belongs to user
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Calculate expiration date if provided (in hours)
    let expiresAt: Date | null = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (password) {
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    }

    // Create shared link
    const sharedLink = await prisma.sharedLink.create({
      data: {
        fileId,
        userId,
        expiresAt,
        password: hashedPassword,
        maxDownloads: maxDownloads || null,
      },
    });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${sharedLink.token}`;

    res.json({
      id: sharedLink.id,
      token: sharedLink.token,
      url: shareUrl,
      expiresAt: sharedLink.expiresAt,
      hasPassword: !!password,
      maxDownloads: sharedLink.maxDownloads,
    });
  } catch (error) {
    next(error);
  }
});

// Get all shared links for a file
router.get('/file/:fileId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { fileId } = req.params;

    const links = await prisma.sharedLink.findMany({
      where: { fileId, userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(links.map(link => ({
      id: link.id,
      token: link.token,
      url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${link.token}`,
      expiresAt: link.expiresAt,
      hasPassword: !!link.password,
      maxDownloads: link.maxDownloads,
      downloadCount: link.downloadCount,
      isActive: link.isActive,
      createdAt: link.createdAt,
    })));
  } catch (error) {
    next(error);
  }
});

// Delete a shared link
router.delete('/:linkId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { linkId } = req.params;

    const link = await prisma.sharedLink.findFirst({
      where: { id: linkId, userId },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await prisma.sharedLink.delete({
      where: { id: linkId },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Toggle link active status
router.patch('/:linkId/toggle', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { linkId } = req.params;

    const link = await prisma.sharedLink.findFirst({
      where: { id: linkId, userId },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const updated = await prisma.sharedLink.update({
      where: { id: linkId },
      data: { isActive: !link.isActive },
    });

    res.json({ isActive: updated.isActive });
  } catch (error) {
    next(error);
  }
});

// Public: Get shared file info
router.get('/public/:token', async (req, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const link = await prisma.sharedLink.findUnique({
      where: { token },
      include: {
        file: {
          select: {
            id: true,
            name: true,
            originalName: true,
            mimeType: true,
            size: true,
          },
        },
      },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (!link.isActive) {
      return res.status(403).json({ error: 'This link has been disabled' });
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(403).json({ error: 'This link has expired' });
    }

    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      return res.status(403).json({ error: 'Download limit reached' });
    }

    res.json({
      file: link.file,
      requiresPassword: !!link.password,
      expiresAt: link.expiresAt,
      downloadsRemaining: link.maxDownloads ? link.maxDownloads - link.downloadCount : null,
    });
  } catch (error) {
    next(error);
  }
});

// Public: Download shared file
router.post('/public/:token/download', async (req, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const link = await prisma.sharedLink.findUnique({
      where: { token },
      include: {
        file: true,
        user: true,
      },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (!link.isActive) {
      return res.status(403).json({ error: 'This link has been disabled' });
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(403).json({ error: 'This link has expired' });
    }

    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      return res.status(403).json({ error: 'Download limit reached' });
    }

    // Check password if required
    if (link.password) {
      if (!password) {
        return res.status(401).json({ error: 'Password required' });
      }
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      if (hashedPassword !== link.password) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Get or restore Telegram client for file owner
    if (!link.user.sessionData) {
      return res.status(500).json({ error: 'Unable to access file storage' });
    }
    
    const client = await telegramService.restoreClient(link.user.id, link.user.sessionData);

    if (!client) {
      return res.status(500).json({ error: 'Unable to access file storage' });
    }

    // Download file (handles chunked files automatically)
    const buffer = await chunkService.downloadFile(
      client,
      link.file.id
    );

    // Increment download count
    await prisma.sharedLink.update({
      where: { id: link.id },
      data: { downloadCount: link.downloadCount + 1 },
    });

    // Send file
    res.setHeader('Content-Type', link.file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(link.file.originalName)}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
