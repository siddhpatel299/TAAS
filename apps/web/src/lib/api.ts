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

  // Email/Password authentication
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/auth/register', data),

  emailLogin: (email: string, password: string) =>
    api.post('/auth/email-login', { email, password }),

  // Link Telegram to email account
  linkTelegramSendCode: (phoneNumber: string) =>
    api.post('/auth/link-telegram/send-code', { phoneNumber }),

  linkTelegramVerifyCode: (sessionId: string, code: string, password?: string) =>
    api.post('/auth/link-telegram/verify-code', { sessionId, code, password }),

  // Add email to existing phone account
  addEmail: (email: string, password: string) =>
    api.post('/auth/add-email', { email, password }),
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

  uploadFile: async (
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void
  ) => {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB - reduced to stay under 512MB memory
    const MAX_CONCURRENT = 2; // Limit to 2 to stay under 512MB memory
    const totalSize = file.size;
    const totalParts = Math.ceil(totalSize / CHUNK_SIZE);

    // Step 1: Initialize multipart upload
    const initResponse = await api.post('/files/upload/init', {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      totalSize,
      totalParts,
      folderId,
    });
    const { uploadId } = initResponse.data.data;

    // Step 2: Upload chunks in parallel (up to 4 at a time)
    let completedParts = 0;

    const uploadPart = async (partNumber: number): Promise<void> => {
      const start = partNumber * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunk = file.slice(start, end);
      const partSize = end - start;

      let formData = new FormData();
      formData.append('uploadId', uploadId);
      formData.append('partNumber', String(partNumber));
      formData.append('partSize', String(partSize));
      formData.append('chunk', chunk, `chunk-${partNumber}`);

      // Retry on failure (streaming has no server-side retry)
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await api.post('/files/upload/part', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          break;
        } catch (err: any) {
          if (attempt === maxRetries) throw err;
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          // Recreate formData for retry (consumed on first attempt)
          formData = new FormData();
          formData.append('uploadId', uploadId);
          formData.append('partNumber', String(partNumber));
          formData.append('partSize', String(partSize));
          formData.append('chunk', file.slice(start, end), `chunk-${partNumber}`);
        }
      }

      completedParts++;
      if (onProgress) {
        onProgress((completedParts / totalParts) * 100);
      }
    };

    // Simple parallel execution with concurrency limit
    const executing: Promise<void>[] = [];
    const allPromises: Promise<void>[] = [];

    for (let partNumber = 0; partNumber < totalParts; partNumber++) {
      const promise = uploadPart(partNumber).finally(() => {
        // Remove from executing when done
        const idx = executing.indexOf(promise);
        if (idx > -1) executing.splice(idx, 1);
      });

      allPromises.push(promise);
      executing.push(promise);

      // If we've reached max concurrent, wait for one to finish
      if (executing.length >= MAX_CONCURRENT) {
        await Promise.race(executing);
      }
    }

    // Wait for ALL uploads to complete before calling complete
    await Promise.all(allPromises);

    // Step 3: Complete upload
    return api.post('/files/upload/complete', { uploadId });
  },

  downloadFile: (id: string) =>
    api.get(`/files/${id}/download`, {
      responseType: 'blob',
      timeout: 600000, // 10 minutes for large files
    }),

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
  getFolders: (parentId?: string, search?: string) =>
    api.get('/folders', { params: { parentId, search } }),

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

// Telegram Chats API
// For accessing Telegram chats and importing individual files to TAAS
export const telegramApi = {
  // Get user's Telegram chats/groups/channels
  getChats: () => api.get('/telegram/chats'),

  // Get messages from a specific chat (files only by default)
  getChatMessages: (
    chatId: string,
    params?: {
      limit?: number;
      offsetId?: number;
      filesOnly?: boolean;
      fileType?: 'video' | 'photo' | 'document' | 'audio';
    }
  ) => api.get(`/telegram/chats/${chatId}/messages`, { params }),

  // Get a single message by ID
  getMessage: (chatId: string, messageId: number) =>
    api.get(`/telegram/chats/${chatId}/messages/${messageId}`),

  // Import a file from a specific message to TAAS
  // Returns either immediate result or importId for deferred import
  importFile: (chatId: string, messageId: number, folderId?: string) =>
    api.post(`/telegram/chats/${chatId}/messages/${messageId}/import`, { folderId }),

  // Get deferred import status
  getImportStatus: (importId: string) =>
    api.get(`/telegram/imports/${importId}`),

  // Get user's recent imports (for status display)
  getImports: () =>
    api.get('/telegram/imports'),

  // Get streaming URL for video/audio preview
  // Returns the URL to stream media directly (supports Range requests)
  getStreamUrl: (chatId: string, messageId: number) => {
    const token = localStorage.getItem('auth_token');
    return `${api.defaults.baseURL}/telegram/chats/${chatId}/messages/${messageId}/stream?token=${token}`;
  },
};
