import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { investmentService } from '../services/investment.service';

const router: Router = Router();

// Dashboard
router.get('/dashboard', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await investmentService.getDashboard(req.user!.id);
  res.json({ success: true, data });
}));

// Get filters (types and sectors)
router.get('/filters', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = await investmentService.getFilters(req.user!.id);
  res.json({ success: true, data: filters });
}));

// Get all investments
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, sector, isWatchlist, search, sortBy, sortOrder } = req.query;
  const investments = await investmentService.getInvestments(req.user!.id, {
    type: type as string,
    sector: sector as string,
    isWatchlist: isWatchlist === 'true' ? true : isWatchlist === 'false' ? false : undefined,
    search: search as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as string,
  });
  res.json({ success: true, data: investments });
}));

// Get single investment
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const investment = await investmentService.getInvestment(req.user!.id, req.params.id);
  if (!investment) {
    return res.status(404).json({ success: false, error: 'Investment not found' });
  }
  res.json({ success: true, data: investment });
}));

// Create investment
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const investment = await investmentService.createInvestment(req.user!.id, req.body);
  res.status(201).json({ success: true, data: investment });
}));

// Update investment
router.patch('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await investmentService.updateInvestment(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: { updated: true } });
}));

// Delete investment
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await investmentService.deleteInvestment(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// Update price
router.patch('/:id/price', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { price } = req.body;
  await investmentService.updatePrice(req.user!.id, req.params.id, price);
  res.json({ success: true, data: { updated: true } });
}));

// ==================== TRANSACTIONS ====================

// Add transaction
router.post('/:id/transactions', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const transaction = await investmentService.addTransaction(req.user!.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: transaction });
}));

// Delete transaction
router.delete('/transactions/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await investmentService.deleteTransaction(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// ==================== DIVIDENDS ====================

// Add dividend
router.post('/:id/dividends', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const dividend = await investmentService.addDividend(req.user!.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: dividend });
}));

// Delete dividend
router.delete('/dividends/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await investmentService.deleteDividend(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

export default router;
