import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { folderService } from '../services/folder.service';

const router: Router = Router();

// Get folders (root or by parent)
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { parentId } = req.query;

  const folders = await folderService.getFolders(
    req.user!.id,
    parentId as string | undefined
  );

  res.json({
    success: true,
    data: folders,
  });
}));

// Get folder tree
router.get('/tree', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tree = await folderService.getFolderTree(req.user!.id);

  res.json({
    success: true,
    data: tree,
  });
}));

// Get folder by ID
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await folderService.getFolder(req.user!.id, id);

  res.json({
    success: true,
    data: result,
  });
}));

// Create folder
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, parentId, color, icon } = req.body;

  if (!name) {
    throw new ApiError('Folder name is required', 400);
  }

  const folder = await folderService.createFolder({
    userId: req.user!.id,
    name,
    parentId,
    color,
    icon,
  });

  res.json({
    success: true,
    data: folder,
  });
}));

// Rename folder
router.patch('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, color, icon } = req.body;

  let result;

  if (name) {
    result = await folderService.renameFolder(req.user!.id, id, name);
  }

  if (color !== undefined || icon !== undefined) {
    result = await folderService.updateFolderAppearance(req.user!.id, id, { color, icon });
  }

  res.json({
    success: true,
    data: result,
  });
}));

// Move folder
router.post('/:id/move', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { parentId } = req.body;

  const result = await folderService.moveFolder(req.user!.id, id, parentId || null);

  res.json({
    success: true,
    data: result,
  });
}));

// Delete folder
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await folderService.deleteFolder(req.user!.id, id);

  res.json({
    success: true,
    data: result,
  });
}));

export default router;
