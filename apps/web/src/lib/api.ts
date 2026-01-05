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

// Share API
export const shareApi = {
  createLink: (
    fileId: string,
    options?: { expiresIn?: number; password?: string; maxDownloads?: number }
  ) => api.post('/share', { fileId, ...options }),

  getLinks: (fileId: string) => api.get(`/share/file/${fileId}`),

  deleteLink: (linkId: string) => api.delete(`/share/${linkId}`),

  toggleLink: (linkId: string) => api.patch(`/share/${linkId}/toggle`),

  getPublicFile: (token: string) => api.get(`/share/public/${token}`),

  downloadPublic: (token: string, password?: string) =>
    api.post(`/share/public/${token}/download`, { password }, { responseType: 'blob' }),
};

// Bulk operations API
export const bulkApi = {
  deleteFiles: (fileIds: string[], permanent?: boolean) =>
    api.post('/files/bulk/delete', { fileIds, permanent }),

  moveFiles: (fileIds: string[], folderId: string | null) =>
    api.post('/files/bulk/move', { fileIds, folderId }),

  starFiles: (fileIds: string[], starred: boolean) =>
    api.post('/files/bulk/star', { fileIds, starred }),

  restoreFiles: (fileIds: string[]) =>
    api.post('/files/bulk/restore', { fileIds }),
};

// File versions API
export const versionsApi = {
  getVersions: (fileId: string) => api.get(`/files/${fileId}/versions`),

  restoreVersion: (fileId: string, version: number) =>
    api.post(`/files/${fileId}/versions/${version}/restore`),
};

// File preview URL helper
export const getPreviewUrl = (fileId: string) => {
  const token = localStorage.getItem('token');
  return `${API_BASE_URL}/files/${fileId}/preview?token=${token}`;
};

// Sync API
export const syncApi = {
  // Get current sync status
  getStatus: () => api.get('/sync/status'),

  // Start a sync from Telegram
  startSync: (channelId?: string) =>
    api.post('/sync/start', { channelId }),

  // Get sync result
  getResult: () => api.get('/sync/result'),

  // Get storage channels
  getChannels: () => api.get('/sync/channels'),

  // Setup real-time listener
  setupListener: () => api.post('/sync/listen'),
};
