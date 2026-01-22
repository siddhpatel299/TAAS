import { Router } from 'express';
import { nexusService } from '../services/nexus.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Projects
router.get('/projects', authMiddleware, async (req, res) => {
    try {
        const projects = await nexusService.getProjects((req as any).user!.id);
        res.json({ success: true, data: projects });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/projects', authMiddleware, async (req, res) => {
    try {
        const project = await nexusService.createProject((req as any).user!.id, req.body);
        res.json({ success: true, data: project });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/projects/:projectId', authMiddleware, async (req, res) => {
    try {
        const project = await nexusService.getProject((req as any).user!.id, req.params.projectId);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        res.json({ success: true, data: project });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Tasks
router.get('/projects/:projectId/tasks', authMiddleware, async (req, res) => {
    try {
        const tasks = await nexusService.getTasks((req as any).user!.id, req.params.projectId, {
            status: req.query.status as string,
            search: req.query.search as string,
            sprintId: req.query.sprintId as string,
        });
        res.json({ success: true, data: tasks });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/projects/:projectId/tasks', authMiddleware, async (req, res) => {
    try {
        const task = await nexusService.createTask((req as any).user!.id, req.params.projectId, req.body);
        res.json({ success: true, data: task });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.patch('/tasks/:taskId', authMiddleware, async (req, res) => {
    try {
        const task = await nexusService.updateTask((req as any).user!.id, req.params.taskId, req.body);
        res.json({ success: true, data: task });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.delete('/tasks/:taskId', authMiddleware, async (req, res) => {
    try {
        await nexusService.deleteTask((req as any).user!.id, req.params.taskId);
        res.json({ success: true, data: { deleted: true } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export const nexusRouter: Router = router;

// Epics
router.get('/projects/:projectId/epics', authMiddleware, async (req, res) => {
    try {
        const epics = await nexusService.getEpics((req as any).user!.id, req.params.projectId);
        res.json({ success: true, data: epics });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/projects/:projectId/epics', authMiddleware, async (req, res) => {
    try {
        const epic = await nexusService.createEpic((req as any).user!.id, req.params.projectId, req.body);
        res.json({ success: true, data: epic });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.patch('/epics/:epicId', authMiddleware, async (req, res) => {
    try {
        const epic = await nexusService.updateEpic((req as any).user!.id, req.params.epicId, req.body);
        res.json({ success: true, data: epic });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.delete('/epics/:epicId', authMiddleware, async (req, res) => {
    try {
        await nexusService.deleteEpic((req as any).user!.id, req.params.epicId);
        res.json({ success: true, data: { deleted: true } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Sprints
router.get('/projects/:projectId/sprints', authMiddleware, async (req, res) => {
    try {
        const sprints = await nexusService.getSprints((req as any).user!.id, req.params.projectId);
        res.json({ success: true, data: sprints });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/projects/:projectId/sprints', authMiddleware, async (req, res) => {
    try {
        const sprint = await nexusService.createSprint((req as any).user!.id, req.params.projectId, req.body);
        res.json({ success: true, data: sprint });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.patch('/sprints/:sprintId', authMiddleware, async (req, res) => {
    try {
        const sprint = await nexusService.updateSprint((req as any).user!.id, req.params.sprintId, req.body);
        res.json({ success: true, data: sprint });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.delete('/sprints/:sprintId', authMiddleware, async (req, res) => {
    try {
        await nexusService.deleteSprint((req as any).user!.id, req.params.sprintId);
        res.json({ success: true, data: { deleted: true } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Comments & Activity
router.get('/tasks/:taskId/comments', authMiddleware, async (req, res) => {
    try {
        const comments = await nexusService.getComments((req as any).user!.id, req.params.taskId);
        res.json({ success: true, data: comments });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/tasks/:taskId/comments', authMiddleware, async (req, res) => {
    try {
        const comment = await nexusService.createComment((req as any).user!.id, req.params.taskId, req.body.content);
        res.json({ success: true, data: comment });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
    try {
        await nexusService.deleteComment((req as any).user!.id, req.params.commentId);
        res.json({ success: true, data: { deleted: true } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/tasks/:taskId/activity', authMiddleware, async (req, res) => {
    try {
        const activity = await nexusService.getActivity((req as any).user!.id, req.params.taskId);
        res.json({ success: true, data: activity });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});
