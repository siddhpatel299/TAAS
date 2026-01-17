import { prisma } from './src/lib/prisma';

async function mergeAccounts() {
    try {
        // Your original account (has the files)
        const originalAccountId = 'cmk5xt9vv000059uitnmafv4a';

        // New duplicate account (has the valid session)
        const duplicateAccountId = 'cmkhrfjji00018rpeblqwfjj7';

        // Get the session data from the duplicate BEFORE deleting
        const duplicateAccount = await prisma.user.findUnique({
            where: { id: duplicateAccountId },
            select: { telegramId: true, sessionData: true }
        });

        if (!duplicateAccount) {
            console.log('Duplicate account not found');
            return;
        }

        console.log('Duplicate account telegramId:', duplicateAccount.telegramId);
        console.log('Has session:', !!duplicateAccount.sessionData);

        // Save the session data
        const telegramId = duplicateAccount.telegramId;
        const sessionData = duplicateAccount.sessionData;

        // Delete any files from the duplicate account first
        const deletedFiles = await prisma.file.deleteMany({
            where: { userId: duplicateAccountId }
        });
        console.log('Deleted files from duplicate:', deletedFiles.count);

        // Delete any storage channels from duplicate
        await prisma.storageChannel.deleteMany({
            where: { userId: duplicateAccountId }
        });
        console.log('Deleted storage channels from duplicate');

        // Delete the duplicate account FIRST (to free up telegramId)
        await prisma.user.delete({
            where: { id: duplicateAccountId }
        });
        console.log('Deleted duplicate account');

        // NOW update the original account with the session
        const updated = await prisma.user.update({
            where: { id: originalAccountId },
            data: {
                telegramId: telegramId,
                sessionData: sessionData
            }
        });

        console.log('Updated original account with telegramId:', updated.telegramId);
        console.log('✅ Accounts merged successfully!');
        console.log('Your original account now has the valid Telegram session.');
        console.log('Login with email or phone - both should work now.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

mergeAccounts();
