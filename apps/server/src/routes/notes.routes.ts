import { Router, Request, Response, IRouter } from 'express';
import { notesService } from '../services/notes.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { pluginsService } from '../services/plugins.service';

const router: IRouter = Router();

// Middleware to check if notes plugin is enabled
const requireNotesPlugin = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const isEnabled = await pluginsService.isPluginEnabled(userId, 'notes-documents');
        if (!isEnabled) {
            return res.status(403).json({
                success: false,
                error: 'Notes & Documents plugin is not enabled',
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireNotesPlugin);

// ====================
// DASHBOARD
// ====================

router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const data = await notesService.getDashboard(userId);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====================
// NOTES
// ====================

router.get('/notes', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const {
            folderId,
            search,
            tagIds,
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
            userId,
            folderId: folderId === 'null' ? null : (folderId as string),
            search: search as string,
            tagIds: tagIds ? (tagIds as string).split(',') : undefined,
            isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
            isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
            isArchived: isArchived === 'true',
            isTrashed: isTrashed === 'true',
            sortBy: sortBy as any,
            sortOrder: sortOrder as 'asc' | 'desc',
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 50,
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/notes/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const note = await notesService.getNote(req.params.id, userId);

        if (!note) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, data: note });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/notes', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { title, content, contentJson, contentHtml, folderId, icon, coverImage, color, metadata, tagIds } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const note = await notesService.createNote({
            userId,
            title,
            content,
            contentJson,
            contentHtml,
            folderId,
            icon,
            coverImage,
            color,
            metadata,
            tagIds,
        });

        res.status(201).json({ success: true, data: note });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/notes/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const note = await notesService.updateNote(req.params.id, userId, req.body);
        res.json({ success: true, data: note });
    } catch (error: any) {
        if (error.message === 'Note not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/notes/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const permanent = req.query.permanent === 'true';
        const result = await notesService.deleteNote(req.params.id, userId, permanent);
        res.json({ success: true, data: result });
    } catch (error: any) {
        if (error.message === 'Note not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/notes/:id/restore', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await notesService.restoreNote(req.params.id, userId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/notes/:id/duplicate', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const note = await notesService.duplicateNote(req.params.id, userId);
        res.json({ success: true, data: note });
    } catch (error: any) {
        if (error.message === 'Note not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====================
// VERSIONS
// ====================

router.get('/notes/:id/versions', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const versions = await notesService.getVersions(req.params.id, userId);
        res.json({ success: true, data: versions });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/notes/:noteId/versions/:versionId/restore', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const note = await notesService.restoreVersion(req.params.noteId, req.params.versionId, userId);
        res.json({ success: true, data: note });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====================
// FOLDERS
// ====================

router.get('/folders', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const parentId = req.query.parentId as string | undefined;
        const folders = await notesService.getFolders(userId, parentId === 'null' ? null : parentId);
        res.json({ success: true, data: folders });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/folders/tree', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const tree = await notesService.getFolderTree(userId);
        res.json({ success: true, data: tree });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/folders', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, parentId, icon, color } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Folder name is required' });
        }

        const folder = await notesService.createFolder({
            userId,
            name,
            parentId,
            icon,
            color,
        });

        res.status(201).json({ success: true, data: folder });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/folders/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const folder = await notesService.updateFolder(req.params.id, userId, req.body);
        res.json({ success: true, data: folder });
    } catch (error: any) {
        if (error.message.includes('circular')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/folders/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await notesService.deleteFolder(req.params.id, userId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====================
// TAGS
// ====================

router.get('/tags', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const tags = await notesService.getTags(userId);
        res.json({ success: true, data: tags });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/tags', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, color } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Tag name is required' });
        }

        const tag = await notesService.createTag({ userId, name, color });
        res.status(201).json({ success: true, data: tag });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, error: 'Tag already exists' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/tags/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, color } = req.body;
        const tag = await notesService.updateTag(req.params.id, userId, { name, color });
        res.json({ success: true, data: tag });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/tags/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await notesService.deleteTag(req.params.id, userId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====================
// BULK OPERATIONS
// ====================

router.post('/trash/empty', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await notesService.emptyTrash(userId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/notes/move', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { noteIds, folderId } = req.body;

        if (!noteIds || !Array.isArray(noteIds)) {
            return res.status(400).json({ success: false, error: 'noteIds array is required' });
        }

        const result = await notesService.moveNotesToFolder(noteIds, userId, folderId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/notes/bulk-delete', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { noteIds, permanent } = req.body;

        if (!noteIds || !Array.isArray(noteIds)) {
            return res.status(400).json({ success: false, error: 'noteIds array is required' });
        }

        const result = await notesService.bulkDelete(noteIds, userId, permanent);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
