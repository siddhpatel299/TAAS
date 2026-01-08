import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { billService } from '../services/bill.service';

const router: Router = Router();

// Dashboard
router.get('/dashboard', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await billService.getDashboard(req.user!.id);
  res.json({ success: true, data });
}));

// Get categories
router.get('/categories', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = await billService.getCategories(req.user!.id);
  res.json({ success: true, data: categories });
}));

// Get upcoming reminders
router.get('/reminders', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const reminders = await billService.getUpcomingReminders(req.user!.id);
  res.json({ success: true, data: reminders });
}));

// Get payment history
router.get('/payments', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { billId, limit } = req.query;
  const payments = await billService.getPaymentHistory(
    req.user!.id,
    billId as string,
    limit ? parseInt(limit as string) : undefined
  );
  res.json({ success: true, data: payments });
}));

// Get all bills
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, category, search, dateFrom, dateTo, sortBy, sortOrder } = req.query;
  
  // Update overdue bills first
  await billService.updateOverdueBills(req.user!.id);
  
  const bills = await billService.getBills(req.user!.id, {
    status: status as string,
    category: category as string,
    search: search as string,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as string,
  });
  res.json({ success: true, data: bills });
}));

// Get single bill
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const bill = await billService.getBill(req.user!.id, req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  res.json({ success: true, data: bill });
}));

// Create bill
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const bill = await billService.createBill(req.user!.id, req.body);
  res.status(201).json({ success: true, data: bill });
}));

// Update bill
router.patch('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await billService.updateBill(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: { updated: true } });
}));

// Delete bill
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await billService.deleteBill(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// Mark bill as paid
router.post('/:id/pay', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await billService.markAsPaid(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: { paid: true } });
}));

export default router;
