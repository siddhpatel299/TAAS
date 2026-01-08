import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { expenseService } from '../services/expense.service';

const router: Router = Router();
router.use(authMiddleware);

// Categories
router.get('/categories', asyncHandler(async (req: AuthRequest, res: Response) => {
  const cats = await expenseService.getCategories(req.user!.id);
  res.json({ success: true, data: cats });
}));
router.post('/categories', asyncHandler(async (req: AuthRequest, res: Response) => {
  const cat = await expenseService.createCategory(req.user!.id, req.body);
  res.status(201).json({ success: true, data: cat });
}));
router.patch('/categories/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const cat = await expenseService.updateCategory(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: cat });
}));
router.delete('/categories/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await expenseService.deleteCategory(req.user!.id, req.params.id);
  res.json({ success: true, data: result });
}));

// Expenses
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const expenses = await expenseService.getExpenses(req.user!.id, req.query);
  res.json({ success: true, data: expenses });
}));
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const exp = await expenseService.createExpense(req.user!.id, req.body);
  res.status(201).json({ success: true, data: exp });
}));
router.patch('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const exp = await expenseService.updateExpense(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: exp });
}));
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await expenseService.deleteExpense(req.user!.id, req.params.id);
  res.json({ success: true, data: result });
}));

// Receipts
router.get('/receipts', asyncHandler(async (req: AuthRequest, res: Response) => {
  const recs = await expenseService.getReceipts(req.user!.id);
  res.json({ success: true, data: recs });
}));
router.post('/receipts', asyncHandler(async (req: AuthRequest, res: Response) => {
  const rec = await expenseService.createReceipt(req.user!.id, req.body);
  res.status(201).json({ success: true, data: rec });
}));
router.delete('/receipts/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await expenseService.deleteReceipt(req.user!.id, req.params.id);
  res.json({ success: true, data: result });
}));

// Analytics
router.get('/stats', asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await expenseService.getStats(req.user!.id, req.query);
  res.json({ success: true, data: stats });
}));

export default router;
