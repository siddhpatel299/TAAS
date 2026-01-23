import { prisma } from '../lib/prisma';
import { twilioService } from './twilio.service';

// Configuration from environment
const MAX_RETRY_ATTEMPTS = parseInt(process.env.CALL_REMINDER_MAX_ATTEMPTS || '3');
const RETRY_DELAY_MINUTES = parseInt(process.env.CALL_REMINDER_RETRY_DELAY_MINUTES || '30');

export const callReminderService = {
    /**
     * Create a call reminder for a subscription
     */
    async createReminder(subscriptionId: string, userId: string): Promise<any> {
        try {
            // Get subscription details
            const subscription = await prisma.subscription.findFirst({
                where: { id: subscriptionId, userId },
            });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            // Check if reminder is enabled
            if (!subscription.reminderEnabled) {
                return null;
            }

            // Get user's phone number
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { phoneNumber: true },
            });

            if (!user?.phoneNumber) {
                throw new Error('User phone number not found. Please add a phone number to your profile to enable call reminders.');
            }

            // Calculate scheduled time
            const scheduledFor = this.calculateScheduledTime(
                subscription.nextBillingDate,
                subscription.reminderDays,
                subscription.reminderTime
            );

            // Generate reminder message
            const daysUntilRenewal = this.getDaysUntilRenewal(subscription.nextBillingDate);
            const message = twilioService.generateReminderMessage(
                subscription.name,
                subscription.amount,
                subscription.currency,
                daysUntilRenewal
            );

            // Create call reminder record
            const reminder = await prisma.callReminder.create({
                data: {
                    userId,
                    subscriptionId,
                    phoneNumber: user.phoneNumber,
                    scheduledFor,
                    message,
                    maxAttempts: MAX_RETRY_ATTEMPTS,
                },
            });

            return reminder;
        } catch (error: any) {
            console.error('Error creating call reminder:', error);
            throw error;
        }
    },

    /**
     * Calculate when to make the call
     */
    calculateScheduledTime(
        nextBillingDate: Date | null,
        reminderDays: number,
        reminderTime: string | null
    ): Date {
        if (!nextBillingDate) {
            throw new Error('Next billing date is required to schedule a reminder');
        }

        const scheduledDate = new Date(nextBillingDate);

        // Subtract reminder days
        scheduledDate.setDate(scheduledDate.getDate() - reminderDays);

        // Set time if specified (format: "HH:MM")
        if (reminderTime && reminderTime.match(/^\d{2}:\d{2}$/)) {
            const [hours, minutes] = reminderTime.split(':').map(Number);
            scheduledDate.setHours(hours, minutes, 0, 0);
        } else {
            // Default to 10:00 AM if no time specified
            scheduledDate.setHours(10, 0, 0, 0);
        }

        return scheduledDate;
    },

    /**
     * Get days until renewal
     */
    getDaysUntilRenewal(nextBillingDate: Date | null): number {
        if (!nextBillingDate) return 0;

        const now = new Date();
        const billing = new Date(nextBillingDate);
        const diffTime = billing.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return Math.max(0, diffDays);
    },

    /**
     * Get all pending reminders that should be executed now
     */
    async getPendingReminders(): Promise<any[]> {
        const now = new Date();

        return prisma.callReminder.findMany({
            where: {
                OR: [
                    // New reminders scheduled for now or past
                    {
                        status: 'pending',
                        scheduledFor: { lte: now },
                        attempts: 0,
                    },
                    // Retry reminders
                    {
                        status: 'no_answer',
                        nextRetryAt: { lte: now },
                        attempts: { lt: MAX_RETRY_ATTEMPTS },
                    },
                ],
            },
            include: {
                subscription: true,
            },
            orderBy: {
                scheduledFor: 'asc',
            },
            take: 10, // Process in batches
        });
    },

    /**
     * Execute a call reminder
     */
    async executeReminder(reminderId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const reminder = await prisma.callReminder.findUnique({
                where: { id: reminderId },
                include: { subscription: true },
            });

            if (!reminder) {
                throw new Error('Reminder not found');
            }

            // Check if already completed
            if (reminder.status === 'completed') {
                return { success: true };
            }

            // Check if max attempts reached
            if (reminder.attempts >= reminder.maxAttempts) {
                await prisma.callReminder.update({
                    where: { id: reminderId },
                    data: {
                        status: 'failed',
                        errorMessage: 'Maximum retry attempts reached',
                    },
                });
                return { success: false, error: 'Maximum retry attempts reached' };
            }

            // Update to calling status
            await prisma.callReminder.update({
                where: { id: reminderId },
                data: {
                    status: 'calling',
                    attempts: { increment: 1 },
                    lastAttemptAt: new Date(),
                },
            });

            // Make the call
            const callResult = await twilioService.makeCall(
                reminder.phoneNumber,
                reminder.message || ''
            );

            if (callResult.success && callResult.callSid) {
                // Update with call SID
                await prisma.callReminder.update({
                    where: { id: reminderId },
                    data: {
                        callSid: callResult.callSid,
                        status: 'calling',
                    },
                });

                return { success: true };
            } else {
                // Call failed - schedule retry
                await this.scheduleNextRetry(reminderId, callResult.error);
                return { success: false, error: callResult.error };
            }
        } catch (error: any) {
            console.error('Error executing reminder:', error);

            // Update reminder with error
            await prisma.callReminder.update({
                where: { id: reminderId },
                data: {
                    status: 'failed',
                    errorMessage: error.message,
                },
            }).catch(() => { });

            return { success: false, error: error.message };
        }
    },

    /**
     * Schedule next retry for a failed call
     */
    async scheduleNextRetry(reminderId: string, errorMessage?: string): Promise<void> {
        const reminder = await prisma.callReminder.findUnique({
            where: { id: reminderId },
        });

        if (!reminder) return;

        // Check if we can retry
        if (reminder.attempts >= reminder.maxAttempts) {
            await prisma.callReminder.update({
                where: { id: reminderId },
                data: {
                    status: 'failed',
                    errorMessage: errorMessage || 'Maximum retry attempts reached',
                },
            });
            return;
        }

        // Calculate next retry time with exponential backoff
        const baseDelay = RETRY_DELAY_MINUTES;
        const exponentialDelay = baseDelay * Math.pow(2, reminder.attempts - 1);
        const nextRetryAt = new Date(Date.now() + exponentialDelay * 60 * 1000);

        await prisma.callReminder.update({
            where: { id: reminderId },
            data: {
                status: 'no_answer',
                nextRetryAt,
                errorMessage,
            },
        });
    },

    /**
     * Mark reminder as completed (called from webhook)
     */
    async markAsCompleted(reminderId: string, duration?: number): Promise<void> {
        await prisma.callReminder.update({
            where: { id: reminderId },
            data: {
                status: 'completed',
                callAnswered: true,
                callDuration: duration,
            },
        });
    },

    /**
     * Update reminder status from Twilio webhook
     */
    async handleCallStatusUpdate(callSid: string, status: string, duration?: number, answeredBy?: string): Promise<void> {
        const reminder = await prisma.callReminder.findFirst({
            where: { callSid },
        });

        if (!reminder) {
            console.warn(`No reminder found for call SID: ${callSid}`);
            return;
        }

        // Map Twilio status to our status
        switch (status.toLowerCase()) {
            case 'completed':
                // Check if answered by human or machine
                if (answeredBy === 'machine_start' || answeredBy === 'machine_end_beep' || answeredBy === 'machine_end_silence') {
                    // Answered by voicemail - schedule retry
                    await this.scheduleNextRetry(reminder.id, 'Answered by voicemail');
                } else {
                    // Successfully completed
                    await this.markAsCompleted(reminder.id, duration);
                }
                break;

            case 'busy':
            case 'no-answer':
            case 'failed':
                // Call not answered - schedule retry
                await this.scheduleNextRetry(reminder.id, `Call ${status}`);
                break;

            case 'canceled':
                await prisma.callReminder.update({
                    where: { id: reminder.id },
                    data: {
                        status: 'failed',
                        errorMessage: 'Call was canceled',
                    },
                });
                break;
        }
    },

    /**
     * Get call history for a subscription
     */
    async getCallHistory(subscriptionId: string, userId: string): Promise<any[]> {
        return prisma.callReminder.findMany({
            where: {
                subscriptionId,
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    /**
     * Cancel any pending reminders for a subscription
     */
    async cancelReminders(subscriptionId: string): Promise<void> {
        await prisma.callReminder.updateMany({
            where: {
                subscriptionId,
                status: { in: ['pending', 'no_answer'] },
            },
            data: {
                status: 'failed',
                errorMessage: 'Subscription was cancelled or paused',
            },
        });
    },

    /**
     * Update reminder when subscription changes
     */
    async updateRemindersForSubscription(subscriptionId: string, userId: string): Promise<void> {
        // Cancel existing pending reminders
        await this.cancelReminders(subscriptionId);

        // Create new reminder
        await this.createReminder(subscriptionId, userId);
    },
};
