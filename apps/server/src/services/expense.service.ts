import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/error.middleware';

export const expenseService = {
  // Categories
  async getCategories(userId: string) {
    return prisma.expenseCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  },
  async createCategory(userId: string, data: { name: string; color?: string; icon?: string }) {
    return prisma.expenseCategory.create({ data: { userId, ...data } });
  },
  async updateCategory(userId: string, id: string, data: Partial<{ name: string; color: string; icon: string }>) {
    await this.ensureCategoryOwnership(userId, id);
    return prisma.expenseCategory.update({ where: { id }, data });
  },
  async deleteCategory(userId: string, id: string) {
    await this.ensureCategoryOwnership(userId, id);
    await prisma.expenseCategory.delete({ where: { id } });
    return { success: true };
  },
  async ensureCategoryOwnership(userId: string, id: string) {
    const cat = await prisma.expenseCategory.findFirst({ where: { id, userId } });
    if (!cat) throw new ApiError('Category not found', 404);
  },

  // Expenses
  async getExpenses(userId: string, filters: any = {}) {
    const where: any = { userId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }
    return prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { category: true, receipt: true },
    });
  },
  async createExpense(userId: string, data: any) {
    return prisma.expense.create({ data: { userId, ...data } });
  },
  async updateExpense(userId: string, id: string, data: any) {
    await this.ensureExpenseOwnership(userId, id);
    return prisma.expense.update({ where: { id }, data });
  },
  async deleteExpense(userId: string, id: string) {
    await this.ensureExpenseOwnership(userId, id);
    await prisma.expense.delete({ where: { id } });
    return { success: true };
  },
  async ensureExpenseOwnership(userId: string, id: string) {
    const exp = await prisma.expense.findFirst({ where: { id, userId } });
    if (!exp) throw new ApiError('Expense not found', 404);
  },

  // Receipts
  async getReceipts(userId: string) {
    return prisma.expenseReceipt.findMany({ where: { userId } });
  },
  async createReceipt(userId: string, data: { fileId?: string; imageUrl?: string }) {
    return prisma.expenseReceipt.create({ data: { userId, ...data } });
  },
  async deleteReceipt(userId: string, id: string) {
    await this.ensureReceiptOwnership(userId, id);
    await prisma.expenseReceipt.delete({ where: { id } });
    return { success: true };
  },
  async ensureReceiptOwnership(userId: string, id: string) {
    const rec = await prisma.expenseReceipt.findFirst({ where: { id, userId } });
    if (!rec) throw new ApiError('Receipt not found', 404);
  },

  // Analytics
  async getStats(userId: string, filters: any = {}) {
    // Total spent, by category, by month, etc.
    const where: any = { userId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    const total = await prisma.expense.aggregate({ _sum: { amount: true }, where });
    const byCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where,
    });
    return { total: total._sum.amount || 0, byCategory };
  },
};
