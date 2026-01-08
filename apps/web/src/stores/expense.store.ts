import { create } from 'zustand';
import { expenseApi, Expense, ExpenseCategory, ExpenseReceipt, ExpenseStats } from '@/lib/expense-api';

interface ExpenseState {
  categories: ExpenseCategory[];
  expenses: Expense[];
  receipts: ExpenseReceipt[];
  stats: ExpenseStats | null;
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<ExpenseCategory>) => Promise<void>;
  updateCategory: (id: string, data: Partial<ExpenseCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  fetchExpenses: (params?: any) => Promise<void>;
  createExpense: (data: Partial<Expense>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  fetchReceipts: () => Promise<void>;
  createReceipt: (data: Partial<ExpenseReceipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;

  fetchStats: (params?: any) => Promise<void>;
  clearError: () => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  categories: [],
  expenses: [],
  receipts: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await expenseApi.getCategories();
      set({ categories: res.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
    }
  },
  createCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await expenseApi.createCategory(data);
      await get().fetchCategories();
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },
  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await expenseApi.updateCategory(id, data);
      await get().fetchCategories();
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },
  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expenseApi.deleteCategory(id);
      await get().fetchCategories();
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },

  fetchExpenses: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await expenseApi.getExpenses(params);
      set({ expenses: res.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
    }
  },
  createExpense: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await expenseApi.createExpense(data);
      await get().fetchExpenses();
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },
  updateExpense: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await expenseApi.updateExpense(id, data);
      await get().fetchExpenses();
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },
  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expenseApi.deleteExpense(id);
      await get().fetchExpenses();
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },

  fetchReceipts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await expenseApi.getReceipts();
      set({ receipts: res.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
    }
  },
  createReceipt: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await expenseApi.createReceipt(data);
      await get().fetchReceipts();
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },
  deleteReceipt: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expenseApi.deleteReceipt(id);
      await get().fetchReceipts();
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },

  fetchStats: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await expenseApi.getStats(params);
      set({ stats: res.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
