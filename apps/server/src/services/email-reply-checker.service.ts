/**
 * Email Reply Checker
 *
 * Polls Gmail threads for replies to tracked sent emails.
 * Runs periodically (every 5 min) and updates SentEmail status
 * + creates notifications when a reply is detected.
 */

import { prisma } from '../lib/prisma';
import { EmailOutreachService } from './email-outreach.service';
import { notificationsService } from './notifications.service';
import { pluginsService } from './plugins.service';

function extractEmail(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match ? match[1] : fromHeader).toLowerCase().trim();
}

async function checkRepliesForUser(userId: string) {
  const settings = await pluginsService.getPluginSettings(userId, 'job-tracker');
  if (!settings) return;

  const gmailTokens = settings.gmailTokens as { accessToken: string; refreshToken: string } | undefined;
  const gmailEmail = (settings.gmailEmail as string || '').toLowerCase();
  if (!gmailTokens || !gmailEmail) return;

  // Only check emails with status 'sent' that have a tracked thread
  const trackedEmails = await prisma.sentEmail.findMany({
    where: {
      userId,
      status: 'sent',
      gmailThreadId: { not: null },
    },
    select: {
      id: true,
      gmailThreadId: true,
      recipientName: true,
      recipientEmail: true,
      company: true,
    },
    take: 50, // cap per user per cycle
  });

  if (trackedEmails.length === 0) return;

  const emailService = new EmailOutreachService(gmailTokens);

  for (const tracked of trackedEmails) {
    try {
      const threadData = await emailService.getThread(tracked.gmailThreadId!);
      if (!threadData || threadData.error || threadData.messages.length <= 1) continue;

      // Check if any message is NOT from the sender
      const hasReply = threadData.messages.some(msg => {
        const from = extractEmail(msg.from);
        return from !== gmailEmail;
      });

      if (!hasReply) continue;

      await prisma.sentEmail.update({
        where: { id: tracked.id },
        data: { status: 'replied' },
      });

      await notificationsService.create({
        userId,
        type: 'email_reply',
        title: `Reply from ${tracked.recipientName}`,
        message: `${tracked.recipientName} at ${tracked.company} replied to your email.`,
        metadata: {
          sentEmailId: tracked.id,
          recipientEmail: tracked.recipientEmail,
          threadId: tracked.gmailThreadId,
        },
      });

      console.log(`[ReplyChecker] Reply detected for ${tracked.recipientEmail} (user ${userId})`);
    } catch (err: any) {
      // Token expired or revoked -- skip silently
      if (err?.message?.includes('invalid_grant') || err?.message?.includes('Token has been expired')) {
        console.warn(`[ReplyChecker] Token expired for user ${userId}, skipping`);
        return; // stop processing this user entirely
      }
      console.error(`[ReplyChecker] Error checking thread ${tracked.gmailThreadId}:`, err.message);
    }
  }
}

let running = false;

export async function checkAllUsersForReplies() {
  if (running) return;
  running = true;

  try {
    // Find all users with Gmail connected (gmailTokens stored in plugin settings)
    const plugins = await prisma.enabledPlugin.findMany({
      where: {
        pluginId: 'job-tracker',
        settings: { path: ['gmailTokens'], not: {} as any },
      },
      select: { userId: true },
    });

    const userIds = plugins.map(p => p.userId);
    console.log(`[ReplyChecker] Checking ${userIds.length} user(s) for email replies`);

    // Process in batches of 5
    for (let i = 0; i < userIds.length; i += 5) {
      const batch = userIds.slice(i, i + 5);
      await Promise.allSettled(batch.map(uid => checkRepliesForUser(uid)));
    }
  } catch (err: any) {
    console.error('[ReplyChecker] Fatal error:', err.message);
  } finally {
    running = false;
  }
}
