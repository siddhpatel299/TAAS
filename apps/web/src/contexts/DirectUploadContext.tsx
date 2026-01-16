/**
 * Server-Proxied Upload Context Provider
 * 
 * Uploads files through the server API which then sends to Telegram.
 * This is more reliable than direct browser-to-Telegram connections
 * because the server maintains an authenticated Telegram session.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export interface DirectUploadItem {
  id: string;
  file: File;
  fileName: string;
  status: 'queued' | 'uploading' | 'registering' | 'completed' | 'error';
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  error?: string;
  folderId?: string | null;
}

interface DirectUploadContextType {
  uploads: DirectUploadItem[];
  isUploading: boolean;
  isClientReady: boolean;
  uploadFiles: (files: File[], folderId?: string | null) => void;
  cancelUpload: (id: string) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  retryUpload: (id: string) => void;
}

const DirectUploadContext = createContext<DirectUploadContextType | null>(null);

export function useDirectUpload() {
  const context = useContext(DirectUploadContext);
  if (!context) {
    throw new Error('useDirectUpload must be used within DirectUploadProvider');
  }
  return context;
}

interface DirectUploadProviderProps {
  children: React.ReactNode;
}

export function DirectUploadProvider({ children }: DirectUploadProviderProps) {
  const [uploads, setUploads] = useState<DirectUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadQueueRef = useRef<DirectUploadItem[]>([]);
  const isProcessingRef = useRef(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Update upload item
  const updateUpload = useCallback((id: string, updates: Partial<DirectUploadItem>) => {
    setUploads(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Process upload queue - uploads via server API
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || uploadQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    setIsUploading(true);

    while (uploadQueueRef.current.length > 0) {
      const item = uploadQueueRef.current[0];

      try {
        // Update status to uploading
        updateUpload(item.id, { status: 'uploading' });

        // Create form data for upload
        const formData = new FormData();
        formData.append('file', item.file);
        if (item.folderId) {
          formData.append('folderId', item.folderId);
        }

        // Create abort controller for this upload
        const abortController = new AbortController();
        abortControllersRef.current.set(item.id, abortController);

        console.log(`[Upload] Starting: ${item.fileName}`);

        // Upload via server API with progress tracking
        await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: abortController.signal,
          onUploadProgress: (progressEvent) => {
            const percent = progressEvent.total
              ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
              : 0;
            updateUpload(item.id, {
              progress: percent,
              uploadedBytes: progressEvent.loaded,
            });
          },
        });

        // Mark as completed
        updateUpload(item.id, { status: 'completed', progress: 100 });
        console.log(`[Upload] Completed: ${item.fileName}`);

        // Clean up abort controller
        abortControllersRef.current.delete(item.id);

      } catch (error: any) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          console.log(`[Upload] Cancelled: ${item.fileName}`);
          updateUpload(item.id, {
            status: 'error',
            error: 'Cancelled',
          });
        } else {
          console.error(`[Upload] Failed: ${item.fileName}`, error);
          updateUpload(item.id, {
            status: 'error',
            error: error.response?.data?.message || error.message || 'Upload failed',
          });
        }
        abortControllersRef.current.delete(item.id);
      }

      // Remove from queue
      uploadQueueRef.current.shift();
    }

    isProcessingRef.current = false;
    setIsUploading(false);
  }, [updateUpload]);

  // Add files to upload queue
  const uploadFiles = useCallback((files: File[], folderId?: string | null) => {
    const newItems: DirectUploadItem[] = files.map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      fileName: file.name,
      status: 'queued' as const,
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      folderId,
    }));

    // Add to state for UI
    setUploads(prev => [...prev, ...newItems]);

    // Add to processing queue
    uploadQueueRef.current.push(...newItems);

    // Start processing
    processQueue();
  }, [processQueue]);

  // Cancel specific upload
  const cancelUpload = useCallback((id: string) => {
    // Abort the request if in progress
    const abortController = abortControllersRef.current.get(id);
    if (abortController) {
      abortController.abort();
    }

    // Remove from queue if not started
    uploadQueueRef.current = uploadQueueRef.current.filter(item => item.id !== id);

    // Update state
    setUploads(prev => prev.map(item =>
      item.id === id && (item.status === 'queued' || item.status === 'uploading')
        ? { ...item, status: 'error', error: 'Cancelled' }
        : item
    ));
  }, []);

  // Remove upload from list
  const removeUpload = useCallback((id: string) => {
    uploadQueueRef.current = uploadQueueRef.current.filter(item => item.id !== id);
    setUploads(prev => prev.filter(item => item.id !== id));
    abortControllersRef.current.delete(id);
  }, []);

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(item =>
      item.status !== 'completed' && item.status !== 'error'
    ));
  }, []);

  // Retry failed upload
  const retryUpload = useCallback((id: string) => {
    const item = uploads.find(u => u.id === id);
    if (item && item.status === 'error') {
      removeUpload(id);
      uploadFiles([item.file], item.folderId);
    }
  }, [uploads, removeUpload, uploadFiles]);

  const value: DirectUploadContextType = {
    uploads,
    isUploading,
    isClientReady: true, // Server is always ready
    uploadFiles,
    cancelUpload,
    removeUpload,
    clearCompleted,
    retryUpload,
  };

  return (
    <DirectUploadContext.Provider value={value}>
      {children}
    </DirectUploadContext.Provider>
  );
}
