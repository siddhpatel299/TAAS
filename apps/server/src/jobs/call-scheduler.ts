import { callReminderService } from '../services/call-reminder.service';

/**
 * Call Scheduler - Runs every minute to check for and execute pending call reminders
 * This is a simple polling-based approach that doesn't require Redis or external job queues
 */

let isRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

export const callScheduler = {
    /**
     * Start the scheduler
     */
    start() {
        if (schedulerInterval) {
            console.log('Call scheduler is already running');
            return;
        }

        console.log('Starting call reminder scheduler...');

        // Run immediately on start
        this.executePendingReminders();

        // Then run every minute
        schedulerInterval = setInterval(() => {
            this.executePendingReminders();
        }, 60 * 1000); // 60 seconds

        console.log('Call reminder scheduler started successfully');
    },

    /**
     * Stop the scheduler
     */
    stop() {
        if (schedulerInterval) {
            clearInterval(schedulerInterval);
            schedulerInterval = null;
            console.log('Call reminder scheduler stopped');
        }
    },

    /**
     * Execute all pending reminders
     */
    async executePendingReminders() {
        // Prevent concurrent executions
        if (isRunning) {
            console.log('Scheduler already processing reminders, skipping this cycle');
            return;
        }

        try {
            isRunning = true;

            // Get pending reminders
            const reminders = await callReminderService.getPendingReminders();

            if (reminders.length === 0) {
                return;
            }

            console.log(`Found ${reminders.length} pending call reminders to execute`);

            // Execute each reminder
            for (const reminder of reminders) {
                try {
                    const result = await callReminderService.executeReminder(reminder.id);

                    if (result.success) {
                        console.log(`Successfully initiated call for reminder ${reminder.id} to ${reminder.phoneNumber}`);
                    } else {
                        console.error(`Failed to execute reminder ${reminder.id}:`, result.error);
                    }
                } catch (error: any) {
                    console.error(`Error executing reminder ${reminder.id}:`, error.message);
                }

                // Add a small delay between calls to avoid overwhelming Twilio
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('Error in call scheduler:', error);
        } finally {
            isRunning = false;
        }
    },

    /**
     * Check if scheduler is running
     */
    isActive(): boolean {
        return schedulerInterval !== null;
    },
};
