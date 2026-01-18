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

  // Chunk size for multipart upload (20MB)
  const CHUNK_SIZE = 20 * 1024 * 1024;

  // Process upload queue - uses multipart chunked upload for large files
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

        const file = item.file;
        const totalSize = file.size;
        const totalParts = Math.ceil(totalSize / CHUNK_SIZE);

        console.log(`[Upload] Starting multipart upload: ${item.fileName} (${totalParts} parts)`);

        // Step 1: Initialize multipart upload
        const initResponse = await api.post('/files/upload/init', {
          fileName: item.fileName,
          mimeType: file.type || 'application/octet-stream',
          totalSize,
          totalParts,
          folderId: item.folderId,
        });

        const { uploadId } = initResponse.data.data;
        console.log(`[Upload] Got uploadId: ${uploadId}`);

        // Step 2: Upload chunks in parallel (up to 4 at a time for 4 bots)
        const MAX_CONCURRENT = 4;
        let completedParts = 0;

        const uploadPart = async (partNumber: number): Promise<void> => {
          const start = partNumber * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, totalSize);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append('uploadId', uploadId);
          formData.append('partNumber', String(partNumber));
          formData.append('chunk', chunk, `chunk-${partNumber}`);

          console.log(`[Upload] Uploading part ${partNumber + 1}/${totalParts}`);

          await api.post('/files/upload/part', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          completedParts++;
          updateUpload(item.id, {
            progress: Math.round((completedParts / totalParts) * 100),
            uploadedBytes: Math.round((completedParts / totalParts) * totalSize),
          });
        };

        // Simple parallel execution with concurrency limit
        const executing: Promise<void>[] = [];
        const allPromises: Promise<void>[] = [];

        for (let partNumber = 0; partNumber < totalParts; partNumber++) {
          const promise = uploadPart(partNumber).finally(() => {
            const idx = executing.indexOf(promise);
            if (idx > -1) executing.splice(idx, 1);
          });

          allPromises.push(promise);
          executing.push(promise);

          if (executing.length >= MAX_CONCURRENT) {
            await Promise.race(executing);
          }
        }

        // Wait for ALL uploads to complete
        await Promise.all(allPromises);

        // Step 3: Complete the upload
        console.log(`[Upload] Completing multipart upload`);
        await api.post('/files/upload/complete', { uploadId });

        // Mark as completed
        updateUpload(item.id, { status: 'completed', progress: 100 });
        console.log(`[Upload] Completed: ${item.fileName}`);

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
            error: error.response?.data?.error || error.message || 'Upload failed',
          });
        }
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
