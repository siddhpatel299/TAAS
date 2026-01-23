import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { callReminderService } from './call-reminder.service';

export const subscriptionService = {
  // Dashboard
  async getDashboard(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalSubscriptions,
      activeSubscriptions,
      pausedSubscriptions,
      cancelledSubscriptions,
      subscriptions,
      upcomingRenewals,
    ] = await Promise.all([
      prisma.subscription.count({ where: { userId } }),
      prisma.subscription.count({ where: { userId, status: 'active' } }),
      prisma.subscription.count({ where: { userId, status: 'paused' } }),
      prisma.subscription.count({ where: { userId, status: 'cancelled' } }),
      prisma.subscription.findMany({
        where: { userId, status: 'active' },
      }),
      prisma.subscription.findMany({
        where: {
          userId,
          status: 'active',
          nextBillingDate: { lte: nextWeek, gte: now },
        },
        orderBy: { nextBillingDate: 'asc' },
        take: 5,
      }),
    ]);

    // Calculate monthly and yearly costs
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    subscriptions.forEach(sub => {
      const amount = Number(sub.amount);
      switch (sub.billingCycle) {
        case 'weekly':
          monthlyTotal += amount * 4.33;
          yearlyTotal += amount * 52;
          break;
        case 'monthly':
          monthlyTotal += amount;
          yearlyTotal += amount * 12;
          break;
        case 'quarterly':
          monthlyTotal += amount / 3;
          yearlyTotal += amount * 4;
          break;
        case 'yearly':
          monthlyTotal += amount / 12;
          yearlyTotal += amount;
          break;
      }
    });

    // Get spending by category
    const categorySpending: Record<string, number> = {};
    subscriptions.forEach(sub => {
      const category = sub.category || 'uncategorized';
      const monthlyAmount = this.getMonthlyAmount(sub);
      categorySpending[category] = (categorySpending[category] || 0) + monthlyAmount;
    });

    return {
      totalSubscriptions,
      activeSubscriptions,
      pausedSubscriptions,
      cancelledSubscriptions,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      upcomingRenewals,
      categorySpending,
    };
  },

  getMonthlyAmount(sub: { amount: any; billingCycle: string }) {
    const amount = Number(sub.amount);
    switch (sub.billingCycle) {
      case 'weekly': return amount * 4.33;
      case 'monthly': return amount;
      case 'quarterly': return amount / 3;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  },

  // Subscriptions
  async getSubscriptions(userId: string, params?: {
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const where: Prisma.SubscriptionWhereInput = { userId };

    if (params?.status) where.status = params.status;
    if (params?.category) where.category = params.category;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.SubscriptionOrderByWithRelationInput = {};
    const sortBy = params?.sortBy || 'name';
    const sortOrder = params?.sortOrder || 'asc';
    (orderBy as any)[sortBy] = sortOrder;

    return prisma.subscription.findMany({
      where,
      orderBy,
      include: {
        _count: { select: { payments: true } },
      },
    });
  },

  async getSubscription(userId: string, subscriptionId: string) {
    return prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 12,
        },
      },
    });
  },

  async createSubscription(userId: string, data: {
    name: string;
    description?: string;
    category?: string;
    amount: number;
    currency?: string;
    billingCycle?: string;
    startDate: Date;
    nextBillingDate?: Date;
    status?: string;
    autoRenew?: boolean;
    reminderDays?: number;
    reminderEnabled?: boolean;
    reminderTime?: string;
    website?: string;
    notes?: string;
    color?: string;
    icon?: string;
  }) {
    // Calculate next billing date if not provided
    let nextBillingDate = data.nextBillingDate;
    if (!nextBillingDate && data.startDate) {
      nextBillingDate = this.calculateNextBillingDate(
        new Date(data.startDate),
        data.billingCycle || 'monthly'
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        category: data.category,
        amount: data.amount,
        currency: data.currency || 'USD',
        billingCycle: data.billingCycle || 'monthly',
        startDate: new Date(data.startDate),
        nextBillingDate,
        status: data.status || 'active',
        autoRenew: data.autoRenew ?? true,
        reminderDays: data.reminderDays ?? 3,
        reminderEnabled: data.reminderEnabled ?? false,
        reminderTime: data.reminderTime,
        website: data.website,
        notes: data.notes,
        color: data.color,
        icon: data.icon,
      },
    });

    // Create call reminder if enabled
    if (data.reminderEnabled && subscription.status === 'active') {
      try {
        await callReminderService.createReminder(subscription.id, userId);
      } catch (error) {
        console.error('Failed to create call reminder:', error);
        // Don't fail subscription creation if reminder fails
      }
    }

    return subscription;
  },

  calculateNextBillingDate(fromDate: Date, billingCycle: string): Date {
    const date = new Date(fromDate);
    const now = new Date();

    while (date <= now) {
      switch (billingCycle) {
        case 'weekly':
          date.setDate(date.getDate() + 7);
          break;
        case 'monthly':
          date.setMonth(date.getMonth() + 1);
          break;
        case 'quarterly':
          date.setMonth(date.getMonth() + 3);
          break;
        case 'yearly':
          date.setFullYear(date.getFullYear() + 1);
          break;
      }
    }
    return date;
  },

  async updateSubscription(userId: string, subscriptionId: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    billingCycle: string;
    startDate: Date;
    nextBillingDate: Date;
    endDate: Date;
    status: string;
    autoRenew: boolean;
    reminderDays: number;
    reminderEnabled: boolean;
    reminderTime: string;
    website: string;
    notes: string;
    color: string;
    icon: string;
  }>) {
    const result = await prisma.subscription.updateMany({
      where: { id: subscriptionId, userId },
      data,
    });

    // Update call reminders if reminder settings changed
    if ('reminderEnabled' in data || 'reminderDays' in data || 'reminderTime' in data || 'nextBillingDate' in data) {
      try {
        await callReminderService.updateRemindersForSubscription(subscriptionId, userId);
      } catch (error) {
        console.error('Failed to update call reminders:', error);
      }
    }

    return result;
  },

  async deleteSubscription(userId: string, subscriptionId: string) {
    return prisma.subscription.deleteMany({
      where: { id: subscriptionId, userId },
    });
  },

  async cancelSubscription(userId: string, subscriptionId: string) {
    // Cancel any pending call reminders
    try {
      await callReminderService.cancelReminders(subscriptionId);
    } catch (error) {
      console.error('Failed to cancel reminders:', error);
    }

    return prisma.subscription.updateMany({
      where: { id: subscriptionId, userId },
      data: {
        status: 'cancelled',
        endDate: new Date(),
        autoRenew: false,
      },
    });
  },

  async pauseSubscription(userId: string, subscriptionId: string) {
    // Cancel any pending call reminders
    try {
      await callReminderService.cancelReminders(subscriptionId);
    } catch (error) {
      console.error('Failed to cancel reminders:', error);
    }

    return prisma.subscription.updateMany({
      where: { id: subscriptionId, userId },
      data: { status: 'paused' },
    });
  },

  async resumeSubscription(userId: string, subscriptionId: string) {
    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!sub) throw new Error('Subscription not found');

    const nextBillingDate = this.calculateNextBillingDate(
      sub.startDate,
      sub.billingCycle
    );

    return prisma.subscription.updateMany({
      where: { id: subscriptionId, userId },
      data: {
        status: 'active',
        nextBillingDate,
      },
    });
  },

  // Payments
  async recordPayment(userId: string, subscriptionId: string, data: {
    amount: number;
    paymentDate?: Date;
    status?: string;
    notes?: string;
  }) {
    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!sub) throw new Error('Subscription not found');

    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId,
        amount: data.amount,
        paymentDate: data.paymentDate || new Date(),
        status: data.status || 'completed',
        notes: data.notes,
      },
    });

    // Update next billing date
    if (data.status !== 'failed') {
      const nextBillingDate = this.calculateNextBillingDate(
        new Date(),
        sub.billingCycle
      );
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { nextBillingDate },
      });
    }

    return payment;
  },

  async getPaymentHistory(userId: string, subscriptionId: string) {
    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!sub) throw new Error('Subscription not found');

    return prisma.subscriptionPayment.findMany({
      where: { subscriptionId },
      orderBy: { paymentDate: 'desc' },
    });
  },

  // Categories
  async getCategories(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      select: { category: true },
      distinct: ['category'],
    });

    return subscriptions
      .map(s => s.category)
      .filter(Boolean) as string[];
  },
};
