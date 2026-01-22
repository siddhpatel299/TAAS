import express from 'express';
import { flowService } from '../services/flow.service';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// List Workflows
router.get('/workflows', authMiddleware, async (req, res) => {
    try {
        const workflows = await flowService.getWorkflows((req as any).user!.id);
        res.json({ success: true, data: workflows });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Single Workflow
router.get('/workflows/:workflowId', authMiddleware, async (req, res) => {
    try {
        const workflow = await flowService.getWorkflow((req as any).user!.id, req.params.workflowId);
        if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
        res.json({ success: true, data: workflow });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Workflow Runs
router.get('/workflows/:workflowId/runs', authMiddleware, async (req, res) => {
    try {
        const runs = await flowService.getWorkflowRuns((req as any).user!.id, req.params.workflowId);
        res.json({ success: true, data: runs });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create Workflow
router.post('/workflows', authMiddleware, async (req, res) => {
    try {
        const workflow = await flowService.createWorkflow((req as any).user!.id, req.body);
        res.json({ success: true, data: workflow });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Update Workflow (Full Graph Update)
router.patch('/workflows/:workflowId', authMiddleware, async (req, res) => {
    try {
        const workflow = await flowService.updateWorkflow((req as any).user!.id, req.params.workflowId, req.body);
        res.json({ success: true, data: workflow });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Delete Workflow
router.delete('/workflows/:workflowId', authMiddleware, async (req, res) => {
    try {
        await flowService.deleteWorkflow((req as any).user!.id, req.params.workflowId);
        res.json({ success: true, data: { deleted: true } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Trigger Event (For Testing/Manual Triggers)
router.post('/events/trigger', authMiddleware, async (req, res) => {
    try {
        const { type, payload } = req.body;
        await flowService.emitEvent(type, payload, (req as any).user!.id);
        res.json({ success: true, message: 'Event emitted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
