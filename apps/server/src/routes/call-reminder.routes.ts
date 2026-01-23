import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { callReminderService } from '../services/call-reminder.service';
import { twilioService } from '../services/twilio.service';

const router: Router = Router();

// Get all call reminders for the authenticated user
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const reminders = await callReminderService.getCallHistory('', req.user!.id);
    res.json({ success: true, data: reminders });
}));

// Get call history for a specific subscription
router.get('/subscription/:subscriptionId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { subscriptionId } = req.params;
    const callHistory = await callReminderService.getCallHistory(subscriptionId, req.user!.id);
    res.json({ success: true, data: callHistory });
}));

// Webhook endpoint for Twilio call status updates (public, no auth)
router.post('/webhook/twilio-status', asyncHandler(async (req: any, res: Response) => {
    try {
        // Parse webhook data
        const webhookData = twilioService.parseWebhookData(req.body);

        // Validate webhook signature (optional but recommended)
        const signature = req.headers['x-twilio-signature'] as string;
        if (signature) {
            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            const isValid = twilioService.validateWebhook(signature, url, req.body);

            if (!isValid) {
                console.warn('Invalid Twilio webhook signature');
                return res.status(403).json({ error: 'Invalid signature' });
            }
        }

        // Update call reminder status
        await callReminderService.handleCallStatusUpdate(
            webhookData.callSid,
            webhookData.status,
            webhookData.duration,
            webhookData.answeredBy
        );

        res.status(200).send('OK');
    } catch (error: any) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
}));

export default router;
