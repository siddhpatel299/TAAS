import { prisma } from './src/lib/prisma';

async function investigateAccounts() {
    try {
        // Find all users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                telegramId: true,
                phoneNumber: true,
                firstName: true,
                sessionData: true,
                _count: {
                    select: { files: true, folders: true }
                }
            }
        });

        console.log('=== ALL USERS ===');
        users.forEach(u => {
            console.log(`ID: ${u.id}`);
            console.log(`  Email: ${u.email || 'null'}`);
            console.log(`  TelegramId: ${u.telegramId || 'null'}`);
            console.log(`  Phone: ${u.phoneNumber || 'null'}`);
            console.log(`  Name: ${u.firstName || 'null'}`);
            console.log(`  Has Session: ${u.sessionData ? 'YES' : 'NO'}`);
            console.log(`  Files: ${u._count.files}, Folders: ${u._count.folders}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

investigateAccounts();
