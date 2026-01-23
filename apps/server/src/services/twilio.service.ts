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

            // Speak the message
            twiml.say({
                voice: 'Polly.Joanna', // Amazon Polly voice - sounds natural
                language: 'en-US',
            }, message);

            // Gather input (any key press acknowledges)
            const gather = twiml.gather({
                numDigits: 1,
                timeout: 5,
            });
            gather.say({
                voice: 'Polly.Joanna',
                language: 'en-US',
            }, 'Press any key to acknowledge.');

            // If no input, repeat the message once
            twiml.say({
                voice: 'Polly.Joanna',
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
                machineDetection: 'Enable', // Detect if answered by voicemail
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
