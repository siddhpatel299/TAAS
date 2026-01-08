import { api } from './api';

export interface TodoList {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  counts?: { total: number; done: number };
}

export interface TodoTask {
  id: string;
  userId: string;
  listId?: string | null;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical' | string;
  dueDate?: string | null;
  labels: string[];
  isPinned: boolean;
  position: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  overdue: number;
  today: number;
}

export const todoApi = {
  getLists: () => api.get<{ success: boolean; data: TodoList[] }>('/todo/lists'),
  createList: (data: Partial<TodoList>) => api.post('/todo/lists', data),
  updateList: (id: string, data: Partial<TodoList>) => api.patch(`/todo/lists/${id}`, data),
  deleteList: (id: string) => api.delete(`/todo/lists/${id}`),

  getTasks: (params?: any) => api.get<{ success: boolean; data: TodoTask[]; meta: TodoStats }>('/todo/tasks', { params }),
  createTask: (data: Partial<TodoTask>) => api.post('/todo/tasks', data),
  updateTask: (id: string, data: Partial<TodoTask>) => api.patch(`/todo/tasks/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/todo/tasks/${id}/status`, { status }),
  deleteTask: (id: string) => api.delete(`/todo/tasks/${id}`),
  getStats: () => api.get<{ success: boolean; data: TodoStats }>('/todo/tasks/summary'),
};
