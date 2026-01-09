import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { notesService } from '../services/notes.service';
import { pluginsService } from '../services/plugins.service';

const router: Router = Router();

// Middleware to check if notes plugin is enabled
const requireNotesPlugin = asyncHandler(async (req: AuthRequest, res: Response, next: any) => {
  const enabled = await pluginsService.isPluginEnabled(req.user!.id, 'notes');
  if (!enabled) {
    throw new ApiError('Notes & Documents plugin is not enabled. Please enable it in the Plugins page.', 403);
  }
  next();
});

// Apply plugin check to all routes except shared note access
router.use('/shared/:token', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password } = req.query;
  const result = await notesService.getSharedNote(req.params.token, password as string);
  res.json({ success: true, data: result });
}));

router.use(authMiddleware, requireNotesPlugin);

// ==================== Dashboard ====================

router.get('/dashboard', asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await notesService.getDashboardStats(req.user!.id);
  res.json({ success: true, data: stats });
}));

// ==================== Notes ====================

// Get all notes with filters
router.get('/notes', asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    folderId,
    search,
    tags,
    isPinned,
    isFavorite,
    isArchived,
    isTrashed,
    sortBy,
    sortOrder,
    page,
    limit,
  } = req.query;

  const result = await notesService.getNotes({
    userId: req.user!.id,
    folderId: folderId as string | undefined,
    search: search as string | undefined,
    tags: tags ? (tags as string).split(',') : undefined,
    isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
    isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
    isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
    isTrashed: isTrashed === 'true' ? true : isTrashed === 'false' ? false : undefined,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 50,
  });

  res.json({
    success: true,
    data: result.notes,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    },
  });
}));

// Search notes
router.get('/search', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, folderId, tags, limit } = req.query;

  if (!q) {
    throw new ApiError('Search query is required', 400);
  }

  const results = await notesService.searchNotes(req.user!.id, q as string, {
    folderId: folderId as string | undefined,
    tags: tags ? (tags as string).split(',') : undefined,
    limit: limit ? parseInt(limit as string) : 20,
  });

  res.json({ success: true, data: results });
}));

// Get single note
router.get('/notes/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const note = await notesService.getNote(req.user!.id, req.params.id);
  res.json({ success: true, data: note });
}));

// Create new note
router.post('/notes', asyncHandler(async (req: AuthRequest, res: Response) => {
  const note = await notesService.createNote({
    userId: req.user!.id,
    ...req.body,
  });
  res.json({ success: true, data: note });
}));

// Update note
router.patch('/notes/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { createVersion = true, ...updateData } = req.body;
  const note = await notesService.updateNote(
    req.user!.id,
    req.params.id,
    updateData,
    createVersion
  );
  res.json({ success: true, data: note });
}));

// Delete note (move to trash)
router.delete('/notes/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { permanent } = req.query;
  await notesService.deleteNote(req.user!.id, req.params.id, permanent === 'true');
  res.json({ success: true, data: { deleted: true } });
}));

// Restore note from trash
router.post('/notes/:id/restore', asyncHandler(async (req: AuthRequest, res: Response) => {
  await notesService.restoreNote(req.user!.id, req.params.id);
  res.json({ success: true, data: { restored: true } });
}));

// Duplicate note
router.post('/notes/:id/duplicate', asyncHandler(async (req: AuthRequest, res: Response) => {
  const note = await notesService.duplicateNote(req.user!.id, req.params.id);
  res.json({ success: true, data: note });
}));

// ==================== Versions ====================

// Get note versions
router.get('/notes/:id/versions', asyncHandler(async (req: AuthRequest, res: Response) => {
  const versions = await notesService.getNoteVersions(req.user!.id, req.params.id);
  res.json({ success: true, data: versions });
}));

// Restore version
router.post('/notes/:id/versions/:versionId/restore', asyncHandler(async (req: AuthRequest, res: Response) => {
  const note = await notesService.restoreVersion(req.user!.id, req.params.id, req.params.versionId);
  res.json({ success: true, data: note });
}));

// ==================== Folders ====================

// Get folders
router.get('/folders', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { parentId } = req.query;
  const folders = await notesService.getFolders(req.user!.id, parentId as string | undefined);
  res.json({ success: true, data: folders });
}));

// Get folder tree
router.get('/folders/tree', asyncHandler(async (req: AuthRequest, res: Response) => {
  const tree = await notesService.getFolderTree(req.user!.id);
  res.json({ success: true, data: tree });
}));

// Create folder
router.post('/folders', asyncHandler(async (req: AuthRequest, res: Response) => {
  const folder = await notesService.createFolder({
    userId: req.user!.id,
    ...req.body,
  });
  res.json({ success: true, data: folder });
}));

// Update folder
router.patch('/folders/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const folder = await notesService.updateFolder(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: folder });
}));

// Delete folder
router.delete('/folders/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await notesService.deleteFolder(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// ==================== Templates ====================

// Get templates
router.get('/templates', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category } = req.query;
  const templates = await notesService.getTemplates(req.user!.id, category as string | undefined);
  res.json({ success: true, data: templates });
}));

// Get single template
router.get('/templates/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const template = await notesService.getTemplate(req.user!.id, req.params.id);
  res.json({ success: true, data: template });
}));

// Create template
router.post('/templates', asyncHandler(async (req: AuthRequest, res: Response) => {
  const template = await notesService.createTemplate({
    userId: req.user!.id,
    ...req.body,
  });
  res.json({ success: true, data: template });
}));

// Update template
router.patch('/templates/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const template = await notesService.updateTemplate(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: template });
}));

// Delete template
router.delete('/templates/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await notesService.deleteTemplate(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// Use template to create note
router.post('/templates/:id/use', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { folderId } = req.body;
  const note = await notesService.useTemplate(req.user!.id, req.params.id, folderId);
  res.json({ success: true, data: note });
}));

// ==================== Sharing ====================

// Create share link
router.post('/notes/:id/share', asyncHandler(async (req: AuthRequest, res: Response) => {
  const share = await notesService.createShare(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: share });
}));

// Delete share link
router.delete('/shares/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await notesService.deleteShare(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// ==================== Bulk Operations ====================

// Empty trash
router.post('/trash/empty', asyncHandler(async (req: AuthRequest, res: Response) => {
  await notesService.emptyTrash(req.user!.id);
  res.json({ success: true, data: { success: true } });
}));

// Move notes to folder
router.post('/notes/move', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { noteIds, folderId } = req.body;
  
  if (!noteIds || !Array.isArray(noteIds)) {
    throw new ApiError('noteIds array is required', 400);
  }
  
  await notesService.moveNotesToFolder(req.user!.id, noteIds, folderId);
  res.json({ success: true, data: { success: true } });
}));

// Bulk delete notes
router.post('/notes/bulk-delete', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { noteIds, permanent } = req.body;
  
  if (!noteIds || !Array.isArray(noteIds)) {
    throw new ApiError('noteIds array is required', 400);
  }
  
  await notesService.bulkDelete(req.user!.id, noteIds, permanent);
  res.json({ success: true, data: { success: true } });
}));

export default router;
