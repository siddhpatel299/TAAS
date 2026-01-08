import { api } from './api';

export interface ExpenseCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseReceipt {
  id: string;
  userId: string;
  fileId?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId?: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  tags: string[];
  receiptId?: string;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory;
  receipt?: ExpenseReceipt;
}

export interface ExpenseStats {
  total: number;
  byCategory: { categoryId: string; _sum: { amount: number } }[];
}

export const expenseApi = {
  getCategories: () => api.get<{ success: boolean; data: ExpenseCategory[] }>('/expense/categories'),
  createCategory: (data: Partial<ExpenseCategory>) => api.post('/expense/categories', data),
  updateCategory: (id: string, data: Partial<ExpenseCategory>) => api.patch(`/expense/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/expense/categories/${id}`),

  getExpenses: (params?: any) => api.get<{ success: boolean; data: Expense[] }>('/expense', { params }),
  createExpense: (data: Partial<Expense>) => api.post('/expense', data),
  updateExpense: (id: string, data: Partial<Expense>) => api.patch(`/expense/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/expense/${id}`),

  getReceipts: () => api.get<{ success: boolean; data: ExpenseReceipt[] }>('/expense/receipts'),
  createReceipt: (data: Partial<ExpenseReceipt>) => api.post('/expense/receipts', data),
  deleteReceipt: (id: string) => api.delete(`/expense/receipts/${id}`),

  getStats: (params?: any) => api.get<{ success: boolean; data: ExpenseStats }>('/expense/stats', { params }),
};
