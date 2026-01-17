import { prisma } from './src/lib/prisma';

async function clearSession() {
    try {
        const result = await prisma.user.updateMany({
            where: { email: 'siddhpatel.work@gmail.com' },
            data: { sessionData: null, telegramId: null }
        });
        console.log('Session cleared for user. Updated:', result.count, 'records');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearSession();
