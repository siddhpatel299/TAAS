import { create } from 'zustand';
import {
  jobTrackerApi,
  JobApplication,
  JobTask,
  JobReferral,
  JobActivity,
  DashboardStats
} from '@/lib/plugins-api';

interface JobTrackerState {
  // Data
  applications: JobApplication[];
  selectedApplication: JobApplication | null;
  dashboardStats: DashboardStats | null;
  upcomingTasks: JobTask[];
  referrals: JobReferral[];
  recentActivity: JobActivity[];

  // Pagination
  totalApplications: number;
  currentPage: number;
  hasMore: boolean;

  // Filters
  filters: {
    status?: string;
    priority?: string;
    search?: string;
    company?: string;
    location?: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'table' | 'cards' | 'kanban';

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions - Dashboard
  fetchDashboard: () => Promise<void>;

  // Actions - Applications
  fetchApplications: (page?: number) => Promise<void>;
  fetchApplication: (id: string) => Promise<void>;
  createApplication: (data: Partial<JobApplication>) => Promise<JobApplication>;
  updateApplication: (id: string, data: Partial<JobApplication>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;

  // Actions - Documents
  addDocument: (jobId: string, fileId: string, documentType: string, label?: string) => Promise<void>;
  removeDocument: (jobId: string, docId: string) => Promise<void>;

  // Actions - Tasks
  fetchUpcomingTasks: () => Promise<void>;
  createTask: (jobId: string, data: Partial<JobTask>) => Promise<void>;
  updateTask: (taskId: string, data: Partial<JobTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Actions - Referrals
  fetchReferrals: (status?: string) => Promise<void>;
  createReferral: (data: Partial<JobReferral>) => Promise<void>;
  updateReferral: (id: string, data: Partial<JobReferral>) => Promise<void>;
  deleteReferral: (id: string) => Promise<void>;

  // Actions - Activity
  fetchActivity: () => Promise<void>;

  // Actions - Export
  exportCSV: () => Promise<void>;

  // Actions - UI
  setFilters: (filters: Partial<JobTrackerState['filters']>) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setViewMode: (mode: 'table' | 'cards' | 'kanban') => void;
  clearSelection: () => void;
  clearError: () => void;
}

export const useJobTrackerStore = create<JobTrackerState>((set, get) => ({
  applications: [],
  selectedApplication: null,
  dashboardStats: null,
  upcomingTasks: [],
  referrals: [],
  recentActivity: [],

  totalApplications: 0,
  currentPage: 1,
  hasMore: false,

  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  viewMode: 'table',

  isLoading: false,
  error: null,

  // Dashboard
  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await jobTrackerApi.getDashboard();
      set({
        dashboardStats: response.data.data,
        upcomingTasks: response.data.data.upcomingTasks,
        recentActivity: response.data.data.recentActivity,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg, isLoading: false });
    }
  },

  // Applications
  fetchApplications: async (page = 1) => {
    const { filters, sortBy, sortOrder } = get();
    set({ isLoading: true, error: null });
    try {
      const response = await jobTrackerApi.getApplications({
        ...filters,
        sortBy,
        sortOrder,
        page,
        limit: 50,
      });
      set({
        applications: response.data.data,
        totalApplications: response.data.meta.total,
        currentPage: response.data.meta.page,
        hasMore: response.data.meta.hasMore,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg, isLoading: false });
    }
  },

  fetchApplication: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await jobTrackerApi.getApplication(id);
      set({ selectedApplication: response.data.data, isLoading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg, isLoading: false });
    }
  },

  createApplication: async (data: Partial<JobApplication>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await jobTrackerApi.createApplication(data);
      const newApp = response.data.data;
      set(state => ({
        applications: [newApp, ...state.applications],
        totalApplications: state.totalApplications + 1,
        isLoading: false,
      }));
      return newApp;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  updateApplication: async (id: string, data: Partial<JobApplication>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await jobTrackerApi.updateApplication(id, data);
      const updated = response.data.data;
      set(state => ({
        applications: state.applications.map(app =>
          app.id === id ? updated : app
        ),
        selectedApplication: state.selectedApplication?.id === id
          ? updated
          : state.selectedApplication,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  deleteApplication: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await jobTrackerApi.deleteApplication(id);
      set(state => ({
        applications: state.applications.filter(app => app.id !== id),
        selectedApplication: state.selectedApplication?.id === id
          ? null
          : state.selectedApplication,
        totalApplications: state.totalApplications - 1,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  // Documents
  addDocument: async (jobId: string, fileId: string, documentType: string, label?: string) => {
    try {
      await jobTrackerApi.addDocument(jobId, { fileId, documentType, label });
      // Refresh the selected application to get updated documents
      await get().fetchApplication(jobId);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  removeDocument: async (jobId: string, docId: string) => {
    try {
      await jobTrackerApi.removeDocument(jobId, docId);
      // Refresh the selected application
      await get().fetchApplication(jobId);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  // Tasks
  fetchUpcomingTasks: async () => {
    try {
      const response = await jobTrackerApi.getUpcomingTasks(100);
      set({ upcomingTasks: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
    }
  },

  createTask: async (jobId: string, data: Partial<JobTask>) => {
    try {
      await jobTrackerApi.createTask(jobId, data);
      // Refresh tasks and selected application
      await get().fetchUpcomingTasks();
      if (get().selectedApplication?.id === jobId) {
        await get().fetchApplication(jobId);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  updateTask: async (taskId: string, data: Partial<JobTask>) => {
    try {
      await jobTrackerApi.updateTask(taskId, data);
      await get().fetchUpcomingTasks();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await jobTrackerApi.deleteTask(taskId);
      await get().fetchUpcomingTasks();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  // Referrals
  fetchReferrals: async (status?: string) => {
    set({ isLoading: true });
    try {
      const response = await jobTrackerApi.getReferrals(status);
      set({ referrals: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Failed to fetch referrals:', error);
    }
  },

  createReferral: async (data: Partial<JobReferral>) => {
    try {
      await jobTrackerApi.createReferral(data);
      await get().fetchReferrals();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  updateReferral: async (id: string, data: Partial<JobReferral>) => {
    try {
      await jobTrackerApi.updateReferral(id, data);
      await get().fetchReferrals();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  deleteReferral: async (id: string) => {
    try {
      await jobTrackerApi.deleteReferral(id);
      await get().fetchReferrals();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  // Activity
  fetchActivity: async () => {
    try {
      const response = await jobTrackerApi.getActivity(20);
      set({ recentActivity: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch activity:', error);
    }
  },

  // Export
  exportCSV: async () => {
    try {
      const { filters } = get();
      const response = await jobTrackerApi.exportCSV(filters as any);

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      set({ error: errorMsg });
      throw error;
    }
  },

  // UI Actions
  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
    get().fetchApplications(1);
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get().fetchApplications(1);
  },

  setSortOrder: (sortOrder) => {
    set({ sortOrder });
    get().fetchApplications(1);
  },

  setViewMode: (viewMode) => set({ viewMode }),

  clearSelection: () => set({ selectedApplication: null }),

  clearError: () => set({ error: null }),
}));
