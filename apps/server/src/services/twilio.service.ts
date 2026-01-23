import twilio from 'twilio';

// Twilio configuration from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const TWILIO_WEBHOOK_URL = process.env.TWILIO_WEBHOOK_URL || '';

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const twilioService = {
    /**
     * Check if Twilio is configured
     */
    isConfigured(): boolean {
        return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
    },

    /**
     * Generate a spoken reminder message for a subscription
     */
    generateReminderMessage(subscriptionName: string, amount: number, currency: string, daysUntilRenewal: number): string {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);

        const dayText = daysUntilRenewal === 1 ? 'tomorrow' : `in ${daysUntilRenewal} days`;

        return `Hello! This is a reminder from your subscription tracker. 
    Your ${subscriptionName} subscription will renew ${dayText} for ${formattedAmount}. 
    If you want to cancel this subscription, please log in to your account and manage your subscriptions. 
    Press any key to acknowledge this reminder. Thank you!`;
    },

    /**
     * Generate an SMS reminder message for a subscription
     */
    generateSMSMessage(subscriptionName: string, amount: number, currency: string, daysUntilRenewal: number): string {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);

        const dayText = daysUntilRenewal === 1 ? 'tomorrow' : `in ${daysUntilRenewal} days`;

        return `📅 Subscription Reminder\n\n${subscriptionName} will renew ${dayText} for ${formattedAmount}.\n\nLog in to your subscription tracker to cancel or manage this subscription before renewal.`;
    },

    /**
     * Generate an URGENT spoken message for trial expiry
     */
    generateTrialExpiryMessage(subscriptionName: string, amount: number, currency: string, daysUntilExpiry: number): string {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);

        if (daysUntilExpiry === 0) {
            return `URGENT! This is an important reminder from your subscription tracker. 
            Your FREE TRIAL for ${subscriptionName} ENDS TODAY! 
            If you don't cancel now, you will be charged ${formattedAmount}. 
            Log in immediately to cancel if you don't want to be charged. 
            Press any key to acknowledge. This is your final warning!`;
        }

        return `Important reminder from your subscription tracker. 
        Your FREE TRIAL for ${subscriptionName} ends in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}. 
        After the trial, you will be charged ${formattedAmount}. 
        If you want to cancel before being charged, log in to your account and cancel now. 
        Press any key to acknowledge this reminder.`;
    },

    /**
     * Generate an URGENT SMS message for trial expiry
     */
    generateTrialExpirySMS(subscriptionName: string, amount: number, currency: string, daysUntilExpiry: number): string {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);

        if (daysUntilExpiry === 0) {
            return `🚨 URGENT: ${subscriptionName} FREE TRIAL ENDS TODAY!\n\nYou will be charged ${formattedAmount} if you don't cancel NOW.\n\nLog in immediately to cancel!`;
        }

        return `⚠️ Trial Ending Soon!\n\n${subscriptionName} free trial ends in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}.\n\nAfter trial: ${formattedAmount}/billing cycle.\n\nCancel now if you don't want to be charged.`;
    },

    /**
     * Send an SMS message
     */
    async sendSMS(phoneNumber: string, message: string): Promise<{
        success: boolean;
        messageSid?: string;
        error?: string;
    }> {
        try {
            if (!this.isConfigured()) {
                throw new Error('Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.');
            }

            const sms = await twilioClient.messages.create({
                to: phoneNumber,
                from: TWILIO_PHONE_NUMBER,
                body: message,
            });

            return {
                success: true,
                messageSid: sms.sid,
            };
        } catch (error: any) {
            console.error('Twilio SMS error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send SMS',
            };
        }
    },

    /**
     * Make an outbound call with a TTS message
     */
    async makeCall(phoneNumber: string, message: string): Promise<{
        success: boolean;
        callSid?: string;
        error?: string;
    }> {
        try {
            if (!this.isConfigured()) {
                throw new Error('Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.');
            }

            // Create TwiML for the call
            const twiml = new twilio.twiml.VoiceResponse();

            // Add a pause to give the user time to answer
            twiml.pause({ length: 1 });

            // Speak the message using standard Twilio voice (works on all accounts)
            twiml.say({
                voice: 'alice', // Standard Twilio voice - works on all accounts
                language: 'en-US',
            }, message);

            // Gather input (any key press acknowledges)
            const gather = twiml.gather({
                numDigits: 1,
                timeout: 5,
            });
            gather.say({
                voice: 'alice',
                language: 'en-US',
            }, 'Press any key to acknowledge.');

            // If no input, say goodbye
            twiml.say({
                voice: 'alice',
                language: 'en-US',
            }, 'Thank you for your attention. Goodbye.');

            // Make the call
            const call = await twilioClient.calls.create({
                to: phoneNumber,
                from: TWILIO_PHONE_NUMBER,
                twiml: twiml.toString(),
                statusCallback: TWILIO_WEBHOOK_URL,
                statusCallbackEvent: ['answered', 'completed'],
                statusCallbackMethod: 'POST',
            });

            return {
                success: true,
                callSid: call.sid,
            };
        } catch (error: any) {
            console.error('Twilio call error:', error);
            return {
                success: false,
                error: error.message || 'Failed to make call',
            };
        }
    },

    /**
     * Get call status from Twilio
     */
    async getCallStatus(callSid: string): Promise<{
        status: string;
        duration?: number;
        answeredBy?: string;
    } | null> {
        try {
            if (!this.isConfigured()) {
                return null;
            }

            const call = await twilioClient.calls(callSid).fetch();

            return {
                status: call.status,
                duration: call.duration ? parseInt(call.duration) : undefined,
                answeredBy: call.answeredBy || undefined,
            };
        } catch (error) {
            console.error('Error fetching call status:', error);
            return null;
        }
    },

    /**
     * Cancel an ongoing call
     */
    async cancelCall(callSid: string): Promise<boolean> {
        try {
            if (!this.isConfigured()) {
                return false;
            }

            await twilioClient.calls(callSid).update({
                status: 'canceled',
            });

            return true;
        } catch (error) {
            console.error('Error canceling call:', error);
            return false;
        }
    },

    /**
     * Parse webhook data from Twilio call status callback
     */
    parseWebhookData(body: any): {
        callSid: string;
        status: string;
        duration?: number;
        answeredBy?: string;
        from: string;
        to: string;
    } {
        return {
            callSid: body.CallSid,
            status: body.CallStatus,
            duration: body.CallDuration ? parseInt(body.CallDuration) : undefined,
            answeredBy: body.AnsweredBy,
            from: body.From,
            to: body.To,
        };
    },

    /**
     * Validate Twilio webhook signature
     */
    validateWebhook(signature: string, url: string, params: any): boolean {
        try {
            if (!this.isConfigured()) {
                return false;
            }

            return twilio.validateRequest(
                TWILIO_AUTH_TOKEN,
                signature,
                url,
                params
            );
        } catch (error) {
            console.error('Webhook validation error:', error);
            return false;
        }
    },
};
