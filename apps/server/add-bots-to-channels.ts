/**
 * Migration Script: Add TAAS Bots to Existing User Channels
 * 
 * This script invites the configured bots to all existing user storage channels.
 * Run with: npx tsx add-bots-to-channels.ts
 */

import { prisma } from './src/lib/prisma';
import { telegramService } from './src/services/telegram.service';
import { config } from './src/config';
import { Api } from 'telegram';

async function main() {
    console.log('='.repeat(50));
    console.log('Adding TAAS Bots to Existing User Channels');
    console.log('='.repeat(50));

    // Check if bot usernames are configured
    if (!config.telegramBotUsername) {
        console.error('❌ TELEGRAM_BOT_USERNAME not configured in .env');
        console.log('Add: TELEGRAM_BOT_USERNAME=bot1,bot2,bot3,bot4');
        process.exit(1);
    }

    const botUsernames = config.telegramBotUsername.split(',').map(u => u.trim());
    console.log(`\n📋 Bot usernames to add: ${botUsernames.join(', ')}`);

    // Get all users with storage channels
    const users = await prisma.user.findMany({
        where: {
            sessionData: { not: null },
            telegramId: { not: null },
        },
        include: {
            storageChannels: true,
        },
    });

    console.log(`\n👤 Found ${users.length} users with Telegram linked\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of users) {
        console.log(`\nProcessing user: ${user.email || user.telegramId}`);

        if (user.storageChannels.length === 0) {
            console.log('  ⏭️  No storage channels, skipping');
            skipCount++;
            continue;
        }

        try {
            // Get the user's Telegram client
            const client = await telegramService.getClient(user.id);
            if (!client) {
                console.log('  ⚠️  Could not restore Telegram session');
                errorCount++;
                continue;
            }

            for (const storageChannel of user.storageChannels) {
                console.log(`  📁 Channel: ${storageChannel.channelId}`);

                try {
                    // Get the channel entity
                    const channelId = BigInt(storageChannel.channelId);
                    const channel = await client.getEntity(new Api.PeerChannel({ channelId }));

                    if (channel instanceof Api.Channel) {
                        // Use the updated inviteBotsToChannel logic (tries EditAdmin directly)
                        await telegramService.inviteBotsToChannel(client, channel);
                        successCount++;
                    } else {
                        console.log('    ⚠️  Not a channel entity');
                    }
                } catch (error: any) {
                    console.error(`    ❌ Error: ${error.message}`);
                    errorCount++;
                }
            }
        } catch (error: any) {
            console.error(`  ❌ Session error: ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Summary:');
    console.log(`  ✅ Success: ${successCount} channels`);
    console.log(`  ⏭️  Skipped: ${skipCount} users (no channels)`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    await prisma.$disconnect();
}

main().catch(console.error);
