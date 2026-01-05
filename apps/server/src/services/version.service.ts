import { prisma } from '../lib/prisma';

export const versionService = {
  // Save current version before updating
  async saveVersion(fileId: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) return;

    // Get current max version
    const maxVersion = await prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (maxVersion?.version || 0) + 1;

    await prisma.fileVersion.create({
      data: {
        fileId,
        version: nextVersion,
        size: file.size,
        telegramFileId: file.telegramFileId,
        telegramMessageId: file.telegramMessageId,
        channelId: file.channelId,
      },
    });

    // Keep only last 10 versions
    const versions = await prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { version: 'desc' },
      skip: 10,
    });

    if (versions.length > 0) {
      await prisma.fileVersion.deleteMany({
        where: {
          id: { in: versions.map(v => v.id) },
        },
      });
    }
  },

  async getVersions(fileId: string) {
    return prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { version: 'desc' },
    });
  },

  async getVersion(fileId: string, version: number) {
    return prisma.fileVersion.findFirst({
      where: { fileId, version },
    });
  },
};
