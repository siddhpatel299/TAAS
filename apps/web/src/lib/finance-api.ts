import { api } from './api';

// ==================== INVOICE GENERATOR TYPES ====================

export interface InvoiceClient {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { invoices: number };
}

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt?: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId?: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  isRecurring: boolean;
  recurringPeriod?: string;
  createdAt: string;
  updatedAt: string;
  client?: InvoiceClient;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  _count?: { items: number; payments: number };
}

export interface InvoiceDashboard {
  totalInvoices: number;
  draftInvoices: number;
  sentInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalClients: number;
  recentInvoices: Invoice[];
  totalRevenue: number;
  pendingAmount: number;
}

// ==================== SUBSCRIPTION TRACKER TYPES ====================

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  amount: number;
  paymentDate: string;
  status: 'completed' | 'failed' | 'pending';
  notes?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  amount: number;
  currency: string;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  nextBillingDate?: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled' | 'trial';
  autoRenew: boolean;
  reminderDays: number;
  website?: string;
  notes?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  payments?: SubscriptionPayment[];
  _count?: { payments: number };
}

export interface SubscriptionDashboard {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  monthlyTotal: number;
  yearlyTotal: number;
  upcomingRenewals: Subscription[];
  categorySpending: Record<string, number>;
}

// ==================== INVESTMENT PORTFOLIO TYPES ====================

export interface InvestmentTransaction {
  id: string;
  investmentId: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fees?: number;
  date: string;
  notes?: string;
  createdAt: string;
  investment?: { symbol: string; name: string };
}

export interface InvestmentDividend {
  id: string;
  investmentId: string;
  amount: number;
  date: string;
  isReinvested: boolean;
  notes?: string;
  createdAt: string;
  investment?: { symbol: string; name: string };
}

export interface Investment {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'etf' | 'mutual_fund' | 'bond' | 'real_estate' | 'other';
  quantity: number;
  avgCostBasis: number;
  currentPrice?: number;
  currency: string;
  exchange?: string;
  sector?: string;
  notes?: string;
  isWatchlist: boolean;
  createdAt: string;
  updatedAt: string;
  transactions?: InvestmentTransaction[];
  dividends?: InvestmentDividend[];
  _count?: { transactions: number; dividends: number };
  // Calculated fields
  currentValue?: number;
  totalCost?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  totalDividends?: number;
}

export interface InvestmentDashboard {
  totalInvestments: number;
  watchlistCount: number;
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  typeAllocation: Record<string, number>;
  sectorAllocation: Record<string, number>;
  recentTransactions: InvestmentTransaction[];
  recentDividends: InvestmentDividend[];
}

// ==================== BILL REMINDERS TYPES ====================

export interface BillPayment {
  id: string;
  billId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  bill?: { name: string; category?: string };
}

export interface Bill {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  amount: number;
  currency: string;
  dueDate: string;
  isRecurring: boolean;
  recurringPeriod?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  autopay: boolean;
  reminderDays: number;
  payee?: string;
  accountNumber?: string;
  website?: string;
  notes?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  payments?: BillPayment[];
  _count?: { payments: number };
  // Calculated for reminders
  daysUntilDue?: number;
}

export interface BillDashboard {
  totalBills: number;
  pendingBills: number;
  paidBills: number;
  overdueBills: number;
  upcomingBills: Bill[];
  monthlyPaid: number;
  monthlyTotal: number;
  categorySpending: Record<string, number>;
}

// ==================== INVOICE API ====================

export const invoiceApi = {
  getDashboard: () =>
    api.get<{ success: boolean; data: InvoiceDashboard }>('/invoices/dashboard'),

  // Clients
  getClients: (params?: { search?: string }) =>
    api.get<{ success: boolean; data: InvoiceClient[] }>('/invoices/clients', { params }),

  getClient: (id: string) =>
    api.get<{ success: boolean; data: InvoiceClient }>(`/invoices/clients/${id}`),

  createClient: (data: Partial<InvoiceClient>) =>
    api.post<{ success: boolean; data: InvoiceClient }>('/invoices/clients', data),

  updateClient: (id: string, data: Partial<InvoiceClient>) =>
    api.patch<{ success: boolean; data: { updated: boolean } }>(`/invoices/clients/${id}`, data),

  deleteClient: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/invoices/clients/${id}`),

  // Invoices
  getInvoices: (params?: {
    status?: string;
    clientId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<{ success: boolean; data: Invoice[]; meta: any }>('/invoices/invoices', { params }),

  getInvoice: (id: string) =>
    api.get<{ success: boolean; data: Invoice }>(`/invoices/invoices/${id}`),

  getNextInvoiceNumber: () =>
    api.get<{ success: boolean; data: { invoiceNumber: string } }>('/invoices/invoices/next-number'),

  createInvoice: (data: {
    clientId?: string;
    invoiceNumber?: string;
    status?: string;
    issueDate?: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
    terms?: string;
    taxRate?: number;
    discount?: number;
    isRecurring?: boolean;
    recurringPeriod?: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
  }) =>
    api.post<{ success: boolean; data: Invoice }>('/invoices/invoices', data),

  updateInvoice: (id: string, data: Partial<Invoice & { items?: InvoiceItem[] }>) =>
    api.patch<{ success: boolean; data: Invoice }>(`/invoices/invoices/${id}`, data),

  deleteInvoice: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/invoices/invoices/${id}`),

  // Payments
  addPayment: (invoiceId: string, data: {
    amount: number;
    paymentDate?: string;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }) =>
    api.post<{ success: boolean; data: InvoicePayment }>(`/invoices/invoices/${invoiceId}/payments`, data),

  deletePayment: (paymentId: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/invoices/payments/${paymentId}`),
};

// ==================== SUBSCRIPTION API ====================

export const subscriptionApi = {
  getDashboard: () =>
    api.get<{ success: boolean; data: SubscriptionDashboard }>('/subscriptions/dashboard'),

  getCategories: () =>
    api.get<{ success: boolean; data: string[] }>('/subscriptions/categories'),

  getSubscriptions: (params?: {
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) =>
    api.get<{ success: boolean; data: Subscription[] }>('/subscriptions', { params }),

  getSubscription: (id: string) =>
    api.get<{ success: boolean; data: Subscription }>(`/subscriptions/${id}`),

  createSubscription: (data: {
    name: string;
    description?: string;
    category?: string;
    amount: number;
    currency?: string;
    billingCycle?: string;
    startDate: string;
    nextBillingDate?: string;
    status?: string;
    autoRenew?: boolean;
    reminderDays?: number;
    website?: string;
    notes?: string;
    color?: string;
    icon?: string;
  }) =>
    api.post<{ success: boolean; data: Subscription }>('/subscriptions', data),

  updateSubscription: (id: string, data: Partial<Subscription>) =>
    api.patch<{ success: boolean; data: { updated: boolean } }>(`/subscriptions/${id}`, data),

  deleteSubscription: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/subscriptions/${id}`),

  cancelSubscription: (id: string) =>
    api.post<{ success: boolean; data: { cancelled: boolean } }>(`/subscriptions/${id}/cancel`),

  pauseSubscription: (id: string) =>
    api.post<{ success: boolean; data: { paused: boolean } }>(`/subscriptions/${id}/pause`),

  resumeSubscription: (id: string) =>
    api.post<{ success: boolean; data: { resumed: boolean } }>(`/subscriptions/${id}/resume`),

  recordPayment: (id: string, data: {
    amount: number;
    paymentDate?: string;
    status?: string;
    notes?: string;
  }) =>
    api.post<{ success: boolean; data: SubscriptionPayment }>(`/subscriptions/${id}/payments`, data),

  getPaymentHistory: (id: string) =>
    api.get<{ success: boolean; data: SubscriptionPayment[] }>(`/subscriptions/${id}/payments`),
};

// ==================== INVESTMENT API ====================

export const investmentApi = {
  getDashboard: () =>
    api.get<{ success: boolean; data: InvestmentDashboard }>('/investments/dashboard'),

  getFilters: () =>
    api.get<{ success: boolean; data: { types: string[]; sectors: string[] } }>('/investments/filters'),

  getInvestments: (params?: {
    type?: string;
    sector?: string;
    isWatchlist?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) =>
    api.get<{ success: boolean; data: Investment[] }>('/investments', { params }),

  getInvestment: (id: string) =>
    api.get<{ success: boolean; data: Investment }>(`/investments/${id}`),

  createInvestment: (data: {
    symbol: string;
    name: string;
    type: string;
    quantity?: number;
    avgCostBasis?: number;
    currentPrice?: number;
    currency?: string;
    exchange?: string;
    sector?: string;
    notes?: string;
    isWatchlist?: boolean;
  }) =>
    api.post<{ success: boolean; data: Investment }>('/investments', data),

  updateInvestment: (id: string, data: Partial<Investment>) =>
    api.patch<{ success: boolean; data: { updated: boolean } }>(`/investments/${id}`, data),

  deleteInvestment: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/investments/${id}`),

  updatePrice: (id: string, price: number) =>
    api.patch<{ success: boolean; data: { updated: boolean } }>(`/investments/${id}/price`, { price }),

  // Transactions
  addTransaction: (investmentId: string, data: {
    type: string;
    quantity: number;
    pricePerUnit: number;
    fees?: number;
    date?: string;
    notes?: string;
  }) =>
    api.post<{ success: boolean; data: InvestmentTransaction }>(`/investments/${investmentId}/transactions`, data),

  deleteTransaction: (transactionId: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/investments/transactions/${transactionId}`),

  // Dividends
  addDividend: (investmentId: string, data: {
    amount: number;
    date?: string;
    isReinvested?: boolean;
    notes?: string;
  }) =>
    api.post<{ success: boolean; data: InvestmentDividend }>(`/investments/${investmentId}/dividends`, data),

  deleteDividend: (dividendId: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/investments/dividends/${dividendId}`),

  // Mutual Fund API (Indian MFs via MFAPI.in)
  searchMutualFunds: (query: string) =>
    api.get<{ success: boolean; data: Array<{ schemeCode: string; schemeName: string }> }>('/investments/mf/search', { params: { q: query } }),

  getMutualFundNAV: (schemeCode: string) =>
    api.get<{ success: boolean; data: { nav: number; date: string; schemeName: string; schemeCategory: string } }>(`/investments/mf/nav/${schemeCode}`),

  getMutualFundHistory: (schemeCode: string, days?: number) =>
    api.get<{ success: boolean; data: Array<{ date: string; nav: number }> }>(`/investments/mf/history/${schemeCode}`, { params: { days } }),

  refreshMutualFundPrices: () =>
    api.post<{ success: boolean; data: { updated: number; failed: number; results: Array<{ symbol: string; name: string; oldPrice: number; newPrice: number; change: number }> } }>('/investments/mf/refresh'),
};

// ==================== BILL API ====================

export const billApi = {
  getDashboard: () =>
    api.get<{ success: boolean; data: BillDashboard }>('/bills/dashboard'),

  getCategories: () =>
    api.get<{ success: boolean; data: string[] }>('/bills/categories'),

  getReminders: () =>
    api.get<{ success: boolean; data: Bill[] }>('/bills/reminders'),

  getPaymentHistory: (params?: { billId?: string; limit?: number }) =>
    api.get<{ success: boolean; data: BillPayment[] }>('/bills/payments', { params }),

  getBills: (params?: {
    status?: string;
    category?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) =>
    api.get<{ success: boolean; data: Bill[] }>('/bills', { params }),

  getBill: (id: string) =>
    api.get<{ success: boolean; data: Bill }>(`/bills/${id}`),

  createBill: (data: {
    name: string;
    description?: string;
    category?: string;
    amount: number;
    currency?: string;
    dueDate: string;
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
  }) =>
    api.post<{ success: boolean; data: Bill }>('/bills', data),

  updateBill: (id: string, data: Partial<Bill>) =>
    api.patch<{ success: boolean; data: { updated: boolean } }>(`/bills/${id}`, data),

  deleteBill: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/bills/${id}`),

  markAsPaid: (id: string, data?: {
    amount?: number;
    paymentDate?: string;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }) =>
    api.post<{ success: boolean; data: { paid: boolean } }>(`/bills/${id}/pay`, data || {}),
};

// ==================== CONSTANTS ====================

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'slate' },
];

export const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'paused', label: 'Paused', color: 'yellow' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'trial', label: 'Trial', color: 'blue' },
];

export const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const INVESTMENT_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'etf', label: 'ETF' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'bond', label: 'Bond' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
];

export const BILL_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'slate' },
];

export const BILL_CATEGORIES = [
  { value: 'utilities', label: 'Utilities', icon: 'zap' },
  { value: 'rent', label: 'Rent/Mortgage', icon: 'home' },
  { value: 'insurance', label: 'Insurance', icon: 'shield' },
  { value: 'loan', label: 'Loan', icon: 'landmark' },
  { value: 'credit_card', label: 'Credit Card', icon: 'credit-card' },
  { value: 'subscription', label: 'Subscription', icon: 'repeat' },
  { value: 'phone', label: 'Phone/Internet', icon: 'smartphone' },
  { value: 'other', label: 'Other', icon: 'file-text' },
];

export const SUBSCRIPTION_CATEGORIES = [
  { value: 'entertainment', label: 'Entertainment', icon: 'tv' },
  { value: 'productivity', label: 'Productivity', icon: 'briefcase' },
  { value: 'utilities', label: 'Utilities', icon: 'zap' },
  { value: 'health', label: 'Health & Fitness', icon: 'heart' },
  { value: 'education', label: 'Education', icon: 'book' },
  { value: 'news', label: 'News & Media', icon: 'newspaper' },
  { value: 'storage', label: 'Cloud Storage', icon: 'cloud' },
  { value: 'gaming', label: 'Gaming', icon: 'gamepad-2' },
  { value: 'music', label: 'Music', icon: 'music' },
  { value: 'other', label: 'Other', icon: 'package' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'autopay', label: 'Auto-pay' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];
