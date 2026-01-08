import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { subscriptionService } from '../services/subscription.service';

const router: Router = Router();

// Dashboard
router.get('/dashboard', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await subscriptionService.getDashboard(req.user!.id);
  res.json({ success: true, data });
}));

// Get categories
router.get('/categories', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = await subscriptionService.getCategories(req.user!.id);
  res.json({ success: true, data: categories });
}));

// Get all subscriptions
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, category, search, sortBy, sortOrder } = req.query;
  const subscriptions = await subscriptionService.getSubscriptions(req.user!.id, {
    status: status as string,
    category: category as string,
    search: search as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as string,
  });
  res.json({ success: true, data: subscriptions });
}));

// Get single subscription
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const subscription = await subscriptionService.getSubscription(req.user!.id, req.params.id);
  if (!subscription) {
    return res.status(404).json({ success: false, error: 'Subscription not found' });
  }
  res.json({ success: true, data: subscription });
}));

// Create subscription
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const subscription = await subscriptionService.createSubscription(req.user!.id, req.body);
  res.status(201).json({ success: true, data: subscription });
}));

// Update subscription
router.patch('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await subscriptionService.updateSubscription(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: { updated: true } });
}));

// Delete subscription
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await subscriptionService.deleteSubscription(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// Cancel subscription
router.post('/:id/cancel', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await subscriptionService.cancelSubscription(req.user!.id, req.params.id);
  res.json({ success: true, data: { cancelled: true } });
}));

// Pause subscription
router.post('/:id/pause', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await subscriptionService.pauseSubscription(req.user!.id, req.params.id);
  res.json({ success: true, data: { paused: true } });
}));

// Resume subscription
router.post('/:id/resume', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await subscriptionService.resumeSubscription(req.user!.id, req.params.id);
  res.json({ success: true, data: { resumed: true } });
}));

// Record payment
router.post('/:id/payments', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await subscriptionService.recordPayment(req.user!.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: payment });
}));

// Get payment history
router.get('/:id/payments', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const payments = await subscriptionService.getPaymentHistory(req.user!.id, req.params.id);
  res.json({ success: true, data: payments });
}));

export default router;
