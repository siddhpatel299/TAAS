import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { notificationsService } from '../services/notifications.service';

const router: Router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { unreadOnly, limit, offset } = req.query;

  const result = await notificationsService.getForUser({
    userId: req.user!.id,
    unreadOnly: unreadOnly === 'true',
    limit: limit ? parseInt(limit as string, 10) : 20,
    offset: offset ? parseInt(offset as string, 10) : 0,
  });

  res.json({
    success: true,
    data: result.notifications,
    meta: { total: result.total },
  });
}));

router.get('/unread-count', asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await notificationsService.getUnreadCount(req.user!.id);
  res.json({ success: true, data: { count } });
}));

router.patch('/:id/read', asyncHandler(async (req: AuthRequest, res: Response) => {
  const notification = await notificationsService.markAsRead(req.params.id);
  res.json({ success: true, data: notification });
}));

router.post('/mark-all-read', asyncHandler(async (req: AuthRequest, res: Response) => {
  await notificationsService.markAllRead(req.user!.id);
  res.json({ success: true, data: { marked: true } });
}));

export default router;
