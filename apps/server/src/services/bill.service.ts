import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const billService = {
  // Dashboard
  async getDashboard(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalBills,
      pendingBills,
      paidBills,
      overdueBills,
      upcomingBills,
      monthlyPayments,
      bills,
    ] = await Promise.all([
      prisma.bill.count({ where: { userId } }),
      prisma.bill.count({ where: { userId, status: 'pending' } }),
      prisma.bill.count({ where: { userId, status: 'paid' } }),
      prisma.bill.count({ where: { userId, status: 'overdue' } }),
      prisma.bill.findMany({
        where: {
          userId,
          status: 'pending',
          dueDate: { lte: nextWeek, gte: now },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.billPayment.aggregate({
        where: {
          bill: { userId },
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.bill.findMany({
        where: { userId },
      }),
    ]);

    // Calculate monthly total from recurring bills
    let monthlyTotal = 0;
    bills.forEach((bill: any) => {
      if (bill.isRecurring) {
        const amount = Number(bill.amount);
        switch (bill.recurringPeriod) {
          case 'weekly':
            monthlyTotal += amount * 4.33;
            break;
          case 'biweekly':
            monthlyTotal += amount * 2.17;
            break;
          case 'monthly':
            monthlyTotal += amount;
            break;
          case 'quarterly':
            monthlyTotal += amount / 3;
            break;
          case 'yearly':
            monthlyTotal += amount / 12;
            break;
        }
      }
    });

    // Get spending by category
    const categorySpending: Record<string, number> = {};
    bills.forEach((bill: any) => {
      const category = bill.category || 'uncategorized';
      categorySpending[category] = (categorySpending[category] || 0) + Number(bill.amount);
    });

    return {
      totalBills,
      pendingBills,
      paidBills,
      overdueBills,
      upcomingBills,
      monthlyPaid: monthlyPayments._sum.amount || 0,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      categorySpending,
    };
  },

  // Bills
  async getBills(userId: string, params?: {
    status?: string;
    category?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const where: Prisma.BillWhereInput = { userId };
    
    if (params?.status) where.status = params.status;
    if (params?.category) where.category = params.category;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { payee: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.dateFrom || params?.dateTo) {
      where.dueDate = {};
      if (params.dateFrom) where.dueDate.gte = new Date(params.dateFrom);
      if (params.dateTo) where.dueDate.lte = new Date(params.dateTo);
    }

    const orderBy: Prisma.BillOrderByWithRelationInput = {};
    const sortBy = params?.sortBy || 'dueDate';
    const sortOrder = params?.sortOrder || 'asc';
    (orderBy as any)[sortBy] = sortOrder;

    return prisma.bill.findMany({
      where,
      orderBy,
      include: {
        _count: { select: { payments: true } },
      },
    });
  },

  async getBill(userId: string, billId: string) {
    return prisma.bill.findFirst({
      where: { id: billId, userId },
      include: {
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
  },

  async createBill(userId: string, data: {
    name: string;
    description?: string;
    category?: string;
    amount: number;
    currency?: string;
    dueDate: Date;
    isRecurring?: boolean;
    recurringPeriod?: string;
    status?: string;
    autopay?: boolean;
    reminderDays?: number;
    payee?: string;
    accountNumber?: string;
    website?: string;
    notes?: string;
    color?: string;
    icon?: string;
  }) {
    return prisma.bill.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        category: data.category,
        amount: data.amount,
        currency: data.currency || 'USD',
        dueDate: new Date(data.dueDate),
        isRecurring: data.isRecurring || false,
        recurringPeriod: data.recurringPeriod,
        status: data.status || 'pending',
        autopay: data.autopay || false,
        reminderDays: data.reminderDays ?? 3,
        payee: data.payee,
        accountNumber: data.accountNumber,
        website: data.website,
        notes: data.notes,
        color: data.color,
        icon: data.icon,
      },
    });
  },

  async updateBill(userId: string, billId: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    dueDate: Date;
    isRecurring: boolean;
    recurringPeriod: string;
    status: string;
    autopay: boolean;
    reminderDays: number;
    payee: string;
    accountNumber: string;
    website: string;
    notes: string;
    color: string;
    icon: string;
  }>) {
    return prisma.bill.updateMany({
      where: { id: billId, userId },
      data,
    });
  },

  async deleteBill(userId: string, billId: string) {
    return prisma.bill.deleteMany({
      where: { id: billId, userId },
    });
  },

  // Mark as paid
  async markAsPaid(userId: string, billId: string, data?: {
    amount?: number;
    paymentDate?: Date;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }) {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, userId },
    });

    if (!bill) throw new Error('Bill not found');

    // Create payment record
    await prisma.billPayment.create({
      data: {
        billId,
        amount: data?.amount || bill.amount,
        paymentDate: data?.paymentDate || new Date(),
        paymentMethod: data?.paymentMethod,
        reference: data?.reference,
        notes: data?.notes,
      },
    });

    // Update bill status
    if (bill.isRecurring) {
      // For recurring bills, create next occurrence
      const nextDueDate = this.calculateNextDueDate(bill.dueDate, bill.recurringPeriod || 'monthly');
      
      await prisma.bill.update({
        where: { id: billId },
        data: {
          status: 'pending',
          dueDate: nextDueDate,
        },
      });
    } else {
      await prisma.bill.update({
        where: { id: billId },
        data: { status: 'paid' },
      });
    }

    return { success: true };
  },

  calculateNextDueDate(currentDueDate: Date, recurringPeriod: string): Date {
    const date = new Date(currentDueDate);
    
    switch (recurringPeriod) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
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
    
    return date;
  },

  // Update overdue bills
  async updateOverdueBills(userId: string) {
    const now = new Date();
    
    await prisma.bill.updateMany({
      where: {
        userId,
        status: 'pending',
        dueDate: { lt: now },
      },
      data: { status: 'overdue' },
    });
  },

  // Get payment history
  async getPaymentHistory(userId: string, billId?: string, limit?: number) {
    const where: Prisma.BillPaymentWhereInput = {
      bill: { userId },
    };
    
    if (billId) where.billId = billId;

    return prisma.billPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      take: limit || 50,
      include: {
        bill: { select: { name: true, category: true } },
      },
    });
  },

  // Get categories
  async getCategories(userId: string) {
    const bills = await prisma.bill.findMany({
      where: { userId },
      select: { category: true },
      distinct: ['category'],
    });

    return bills.map((b: any) => b.category).filter(Boolean) as string[];
  },

  // Get upcoming reminders
  async getUpcomingReminders(userId: string) {
    const bills = await prisma.bill.findMany({
      where: { userId, status: 'pending' },
    });

    const now = new Date();
    const reminders: any[] = [];

    bills.forEach((bill: any) => {
      const dueDate = new Date(bill.dueDate);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - bill.reminderDays);

      if (reminderDate <= now && dueDate >= now) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        reminders.push({
          ...bill,
          daysUntilDue,
        });
      }
    });

    return reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  },
};
