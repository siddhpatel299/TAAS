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

// Test call - triggers an immediate test call to verify the system works
router.post('/test-call', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { prisma } = await import('../lib/prisma');

    // Get user's phone number
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { phoneNumber: true, firstName: true },
    });

    if (!user?.phoneNumber) {
        return res.status(400).json({
            success: false,
            error: 'Please configure your phone number in Settings first',
        });
    }

    try {
        // Generate a test message
        const testMessage = twilioService.generateReminderMessage(
            'Test Subscription',
            9.99,
            'USD',
            1 // tomorrow
        );

        // Make a test call
        const result = await twilioService.makeCall(user.phoneNumber, testMessage);

        if (!result.success) {
            throw new Error(result.error || 'Failed to make call');
        }

        const callSid = result.callSid;

        res.json({
            success: true,
            message: 'Test call initiated! You should receive a call shortly.',
            data: { callSid },
        });
    } catch (error: any) {
        console.error('Test call error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to initiate test call',
        });
    }
}));

export default router;
