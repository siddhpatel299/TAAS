import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  sendCode: (phoneNumber: string) =>
    api.post('/auth/send-code', { phoneNumber }),
  
  verifyCode: (sessionId: string, code: string, password?: string) =>
    api.post('/auth/verify-code', { sessionId, code, password }),
  
  getMe: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

// Files API
export const filesApi = {
  getFiles: (params?: {
    folderId?: string;
    starred?: boolean;
    trash?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => api.get('/files', { params }),

  getFile: (id: string) => api.get(`/files/${id}`),

  uploadFile: (
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress((e.loaded / e.total) * 100);
        }
      },
    });
  },

  downloadFile: (id: string) =>
    api.get(`/files/${id}/download`, { responseType: 'blob' }),

  renameFile: (id: string, name: string) =>
    api.patch(`/files/${id}`, { name }),

  toggleStar: (id: string) => api.post(`/files/${id}/star`),

  moveFile: (id: string, folderId: string | null) =>
    api.post(`/files/${id}/move`, { folderId }),

  deleteFile: (id: string, permanent?: boolean) =>
    api.delete(`/files/${id}`, { params: { permanent } }),

  restoreFile: (id: string) => api.post(`/files/${id}/restore`),

  emptyTrash: () => api.delete('/files/trash/empty'),

  getStats: () => api.get('/files/stats/usage'),
};

// Folders API
export const foldersApi = {
  getFolders: (parentId?: string) =>
    api.get('/folders', { params: { parentId } }),

  getFolder: (id: string) => api.get(`/folders/${id}`),

  getFolderTree: () => api.get('/folders/tree'),

  createFolder: (name: string, parentId?: string, color?: string) =>
    api.post('/folders', { name, parentId, color }),

  renameFolder: (id: string, name: string) =>
    api.patch(`/folders/${id}`, { name }),

  updateFolder: (id: string, data: { color?: string; icon?: string }) =>
    api.patch(`/folders/${id}`, data),

  moveFolder: (id: string, parentId: string | null) =>
    api.post(`/folders/${id}/move`, { parentId }),

  deleteFolder: (id: string) => api.delete(`/folders/${id}`),
};
