import { create } from 'zustand';
import { todoApi, TodoList, TodoTask, TodoStats } from '@/lib/todo-api';

interface TodoState {
  lists: TodoList[];
  tasks: TodoTask[];
  stats: TodoStats | null;
  selectedListId: string | null; // null -> Inbox
  filters: {
    status?: string;
    priority?: string;
    search?: string;
  };
  isLoading: boolean;
  error: string | null;

  fetchLists: () => Promise<void>;
  fetchTasks: (options?: { listId?: string | null }) => Promise<void>;
  createList: (data: Partial<TodoList>) => Promise<TodoList>;
  updateList: (id: string, data: Partial<TodoList>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  createTask: (data: Partial<TodoTask>) => Promise<void>;
  updateTask: (id: string, data: Partial<TodoTask>) => Promise<void>;
  updateStatus: (id: string, status: TodoTask['status']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  viewMode: 'list' | 'board';
  setSelectedList: (listId: string | null) => void;
  setFilters: (filters: Partial<TodoState['filters']>) => void;
  setViewMode: (mode: 'list' | 'board') => void;
  togglePinTask: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  lists: [],
  tasks: [],
  stats: null,
  selectedListId: null,
  viewMode: 'list',
  filters: {},
  isLoading: false,
  error: null,

  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await todoApi.getLists();
      set({ lists: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message, isLoading: false });
    }
  },

  fetchTasks: async (options) => {
    const { filters, selectedListId } = get();
    const listId = options?.listId ?? selectedListId;
    set({ isLoading: true, error: null });
    try {
      const response = await todoApi.getTasks({ ...filters, listId });
      set({ tasks: response.data.data, stats: response.data.meta, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message, isLoading: false });
    }
  },

  createList: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await todoApi.createList(data);
      const list = response.data.data as TodoList;
      set((state) => ({ lists: [...state.lists, list], selectedListId: list.id, isLoading: false }));
      await get().fetchTasks({ listId: list.id });
      return list;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateList: async (id, data) => {
    set({ error: null });
    try {
      const response = await todoApi.updateList(id, data);
      const updated = response.data.data as TodoList;
      set((state) => ({ lists: state.lists.map((list) => (list.id === id ? updated : list)) }));
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message });
      throw error;
    }
  },

  deleteList: async (id) => {
    set({ error: null });
    try {
      await todoApi.deleteList(id);
      set((state) => ({
        lists: state.lists.filter((list) => list.id !== id),
        selectedListId: state.selectedListId === id ? null : state.selectedListId,
      }));
      await get().fetchTasks({ listId: null });
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message });
      throw error;
    }
  },

  createTask: async (data) => {
    const { selectedListId } = get();
    set({ isLoading: true, error: null });
    try {
      await todoApi.createTask({ ...data, listId: data.listId ?? selectedListId });
      await get().fetchTasks({ listId: data.listId ?? selectedListId ?? null });
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTask: async (id, data) => {
    set({ error: null });
    try {
      await todoApi.updateTask(id, data);
      await get().fetchTasks();
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message });
      throw error;
    }
  },

  updateStatus: async (id: string, status: TodoTask['status']) => {
    set({ error: null });
    try {
      await todoApi.updateStatus(id, status);
      await get().fetchTasks();
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null });
    try {
      await todoApi.deleteTask(id);
      set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
      await get().fetchTasks();
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      set({ error: message });
      throw error;
    }
  },

  setSelectedList: (listId) => {
    set({ selectedListId: listId });
    get().fetchTasks({ listId });
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
    get().fetchTasks();
  },

  setViewMode: (viewMode) => set({ viewMode }),

  togglePinTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      await todoApi.updateTask(id, { isPinned: !task.isPinned });
      await get().fetchTasks();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
