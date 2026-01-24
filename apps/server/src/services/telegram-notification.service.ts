/**
 * Telegram Notification Service
 * 
 * Uses Telegram Bot API to send subscription reminder notifications.
 * This is FREE unlike Twilio SMS/calls.
 */

// Get first bot token from env (multiple tokens are comma-separated)
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').split(',')[0].trim();

export interface TelegramNotificationResult {
    success: boolean;
    messageId?: number;
    error?: string;
}

export const telegramNotificationService = {
    /**
     * Check if Telegram notifications are configured
     */
    isConfigured(): boolean {
        return !!BOT_TOKEN;
    },

    /**
     * Send a message via Telegram Bot API
     */
    async sendMessage(telegramId: string, text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<TelegramNotificationResult> {
        try {
            if (!this.isConfigured()) {
                throw new Error('Telegram Bot not configured');
            }

            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramId,
                    text,
                    parse_mode: parseMode,
                }),
            });

            const data = await response.json() as any;

            if (!data.ok) {
                throw new Error(data.description || 'Failed to send message');
            }

            return {
                success: true,
                messageId: data.result?.message_id,
            };
        } catch (error: any) {
            console.error('Telegram notification error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send Telegram message',
            };
        }
    },

    /**
     * Generate subscription reminder message
     */
    generateReminderMessage(subscriptionName: string, amount: number, currency: string, daysUntilRenewal: number): string {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);

        const dayText = daysUntilRenewal === 0
            ? 'TODAY'
            : daysUntilRenewal === 1
                ? 'tomorrow'
                : `in ${daysUntilRenewal} days`;

        return `📅 *Subscription Reminder*

Your *${subscriptionName}* subscription will renew ${dayText} for *${formattedAmount}*.

💡 Log in to your subscription tracker to manage or cancel this subscription before renewal.`;
    },

    /**
     * Generate URGENT trial expiry message
     */
    generateTrialExpiryMessage(subscriptionName: string, amount: number, currency: string, daysUntilExpiry: number): string {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);

        if (daysUntilExpiry === 0) {
            return `🚨 *URGENT: FREE TRIAL ENDS TODAY!*

Your *${subscriptionName}* free trial *ENDS TODAY!*

⚠️ You will be charged *${formattedAmount}* if you don't cancel NOW.

👉 Log in immediately to cancel if you don't want to be charged!`;
        }

        return `⚠️ *Trial Ending Soon!*

Your *${subscriptionName}* free trial ends in *${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}*.

After trial ends, you'll be charged *${formattedAmount}*.

💡 Cancel now if you don't want to continue the subscription.`;
    },

    /**
     * Send subscription reminder
     */
    async sendSubscriptionReminder(
        telegramId: string,
        subscriptionName: string,
        amount: number,
        currency: string,
        daysUntilRenewal: number
    ): Promise<TelegramNotificationResult> {
        const message = this.generateReminderMessage(subscriptionName, amount, currency, daysUntilRenewal);
        return this.sendMessage(telegramId, message);
    },

    /**
     * Send trial expiry reminder
     */
    async sendTrialExpiryReminder(
        telegramId: string,
        subscriptionName: string,
        amount: number,
        currency: string,
        daysUntilExpiry: number
    ): Promise<TelegramNotificationResult> {
        const message = this.generateTrialExpiryMessage(subscriptionName, amount, currency, daysUntilExpiry);
        return this.sendMessage(telegramId, message);
    },

    /**
     * Send a test notification
     */
    async sendTestNotification(telegramId: string): Promise<TelegramNotificationResult> {
        const testMessage = `✅ *Test Notification*

This is a test message from your *Subscription Tracker*.

🎉 Telegram notifications are working correctly!

You'll receive reminders here when your subscriptions are about to renew.`;

        return this.sendMessage(telegramId, testMessage);
    },
};
