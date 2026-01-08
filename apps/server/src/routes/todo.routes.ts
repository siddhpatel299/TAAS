import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { todoService } from '../services/todo.service';

const router: Router = Router();

// All routes require auth
router.use(authMiddleware);

// Lists
router.get('/lists', asyncHandler(async (req: AuthRequest, res: Response) => {
  const lists = await todoService.getLists(req.user!.id);
  res.json({ success: true, data: lists });
}));

router.post('/lists', asyncHandler(async (req: AuthRequest, res: Response) => {
  const list = await todoService.createList(req.user!.id, req.body);
  res.status(201).json({ success: true, data: list });
}));

router.patch('/lists/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const list = await todoService.updateList(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: list });
}));

router.delete('/lists/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await todoService.deleteList(req.user!.id, req.params.id);
  res.json({ success: true, data: result });
}));

// Tasks
router.get('/tasks', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tasks, stats } = await todoService.getTasks(req.user!.id, req.query as any);
  res.json({ success: true, data: tasks, meta: stats });
}));

router.get('/tasks/summary', asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await todoService.getStats(req.user!.id);
  res.json({ success: true, data: stats });
}));

router.post('/tasks', asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await todoService.createTask(req.user!.id, req.body);
  res.status(201).json({ success: true, data: task });
}));

router.patch('/tasks/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await todoService.updateTask(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: task });
}));

router.patch('/tasks/:id/status', asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await todoService.updateTaskStatus(req.user!.id, req.params.id, req.body.status);
  res.json({ success: true, data: task });
}));

router.delete('/tasks/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await todoService.deleteTask(req.user!.id, req.params.id);
  res.json({ success: true, data: result });
}));

export default router;
