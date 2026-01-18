import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testBotAccess() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.split(',')[0];
    const channelId = '3612837244'; // Your channel ID

    if (!botToken) {
        console.log('No bot token found');
        return;
    }

    // Try different channel ID formats
    const formats = [
        channelId,
        `-100${channelId}`,
        `-${channelId}`,
    ];

    console.log('Bot token:', botToken.substring(0, 15) + '...');

    for (const chatId of formats) {
        console.log(`\nTrying format: ${chatId}`);

        try {
            const response = await axios.post(
                `https://api.telegram.org/bot${botToken}/sendMessage`,
                {
                    chat_id: chatId,
                    text: '🤖 Bot test message - please delete'
                }
            );

            if (response.data.ok) {
                console.log(`✅ SUCCESS! Format ${chatId} works!`);
                console.log('Message ID:', response.data.result.message_id);
                return;
            }
        } catch (error: any) {
            console.log(`❌ Failed: ${error.response?.data?.description || error.message}`);
        }
    }

    console.log('\n⚠️ None of the formats worked. Bot may not be added to channel.');
}

testBotAccess();
