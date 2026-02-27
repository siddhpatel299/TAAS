import { prisma } from '../lib/prisma';

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

interface GetNotificationsOptions {
  userId: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  /** Exclude notifications of this type (e.g. 'email_reply' for general panel) */
  excludeType?: string;
  /** Only include notifications of this type (e.g. 'email_reply' for dedicated section) */
  type?: string;
}

export const notificationsService = {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({ data: input });
  },

  async getForUser({ userId, unreadOnly, limit = 20, offset = 0, excludeType, type }: GetNotificationsOptions) {
    const where: any = { userId };
    if (unreadOnly) where.read = false;
    if (excludeType) where.type = { not: excludeType };
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  },

  async getUnreadCount(userId: string, excludeType?: string): Promise<number> {
    const where: any = { userId, read: false };
    if (excludeType) where.type = { not: excludeType };
    return prisma.notification.count({ where });
  },

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async deleteOld(userId: string, daysOld = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    return prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoff },
        read: true,
      },
    });
  },
};
