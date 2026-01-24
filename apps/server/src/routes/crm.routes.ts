import { Router, Response } from 'express';
import { crmService } from '../services/crm.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all contacts
router.get('/contacts', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const filters = {
            search: req.query.search as string,
            company: req.query.company as string,
            status: req.query.status as string,
            tag: req.query.tag as string,
            pipelineStage: req.query.pipelineStage as string,
            isFavorite: req.query.isFavorite === 'true' ? true : req.query.isFavorite === 'false' ? false : undefined,
            sort: req.query.sort as string,
            order: req.query.order as 'asc' | 'desc',
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        };

        const result = await crmService.getContacts(req.user!.id, filters);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single contact
router.get('/contacts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const contact = await crmService.getContact(req.user!.id, req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, error: 'Contact not found' });
        }
        res.json({ success: true, data: contact });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create contact
router.post('/contacts', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const contact = await crmService.createContact({
            userId: req.user!.id,
            ...req.body,
        });
        res.status(201).json({ success: true, data: contact });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update contact
router.patch('/contacts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const contact = await crmService.updateContact(req.user!.id, req.params.id, req.body);
        res.json({ success: true, data: contact });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete contact
router.delete('/contacts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        await crmService.deleteContact(req.user!.id, req.params.id);
        res.json({ success: true, data: { deleted: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add interaction
router.post('/contacts/:id/interactions', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const interaction = await crmService.addInteraction(
            req.user!.id,
            req.params.id,
            req.body
        );
        res.status(201).json({ success: true, data: interaction });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get interactions
router.get('/contacts/:id/interactions', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const interactions = await crmService.getInteractions(req.user!.id, req.params.id);
        res.json({ success: true, data: interactions });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get tags
router.get('/tags', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const tags = await crmService.getTags(req.user!.id);
        res.json({ success: true, data: tags });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export const crmRouter: Router = router;
