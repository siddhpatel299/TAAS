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
