/**
 * React Hook for Direct Browser-to-Telegram Uploads
 * 
 * Provides stateful upload management with:
 * - Progress tracking
 * - Error handling
 * - Queue management
 * - Automatic metadata registration with backend
 */

import { useState, useCallback, useRef } from 'react';
import { getTelegramClient, getSessionString, setSessionFromServer } from '@/lib/telegram-client';
import { 
  uploadFileDirect, 
  calculateFileHashStreaming,
  UploadProgress,
  UploadResult 
} from '@/lib/telegram-upload';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface UploadItem {
  id: string;
  file: File;
  fileName: string;
  status: 'pending' | 'uploading' | 'registering' | 'completed' | 'error';
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  error?: string;
  result?: {
    fileId: string;
    messageId: number;
  };
}

export interface UseDirectUploadOptions {
  channelId: string;
  folderId?: string | null;
  onUploadComplete?: (file: UploadItem) => void;
  onAllComplete?: () => void;
  onError?: (file: UploadItem, error: Error) => void;
}

export function useDirectUpload(options: UseDirectUploadOptions) {
  const { channelId, folderId, onUploadComplete, onAllComplete, onError } = options;
  const { user } = useAuthStore();
  
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadQueueRef = useRef<File[]>([]);
  const isProcessingRef = useRef(false);

  /**
   * Update a specific upload item
   */
  const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploads(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  /**
   * Remove an upload from the list
   */
  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(item => item.id !== id));
  }, []);

  /**
   * Clear all completed/errored uploads
   */
  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(item => 
      item.status === 'pending' || item.status === 'uploading'
    ));
  }, []);

  /**
   * Process the upload queue sequentially
   */
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || uploadQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    setIsUploading(true);

    while (uploadQueueRef.current.length > 0) {
      const file = uploadQueueRef.current[0];
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Add to uploads list
      setUploads(prev => [...prev, {
        id: uploadId,
        file,
        fileName: file.name,
        status: 'pending',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
      }]);

      try {
        // Get Telegram client
        updateUpload(uploadId, { status: 'uploading' });
        
        // Try to get client, if not authenticated, get session from server
        let client;
        try {
          client = await getTelegramClient();
          
          // Check if actually connected and authenticated
          await client.getMe();
        } catch (error) {
          console.log('[DirectUpload] Client not ready, fetching session from server...');
          
          // Get session from backend (existing auth system)
          const response = await api.get('/auth/session');
          if (response.data?.data?.sessionData) {
            client = await setSessionFromServer(response.data.data.sessionData);
          } else {
            throw new Error('Not authenticated with Telegram');
          }
        }

        // Upload directly to Telegram
        console.log(`[DirectUpload] Starting upload: ${file.name}`);
        
        const uploadResult = await uploadFileDirect(
          client,
          channelId,
          file,
          (progress: UploadProgress) => {
            updateUpload(uploadId, {
              progress: progress.percent,
              uploadedBytes: progress.uploadedBytes,
              totalBytes: progress.totalBytes,
            });
          }
        );

        console.log(`[DirectUpload] Upload complete, registering metadata...`);
        
        // Calculate checksum (memory-safe for large files)
        updateUpload(uploadId, { status: 'registering', progress: 100 });
        const checksum = await calculateFileHashStreaming(file);

        // Register metadata with backend
        await api.post('/files/register', {
          telegramFileId: uploadResult.fileId,
          telegramMessageId: uploadResult.messageId,
          channelId,
          fileName: file.name,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          checksum,
          folderId: folderId || undefined,
        });

        console.log(`[DirectUpload] Metadata registered successfully`);

        // Mark as completed
        updateUpload(uploadId, { 
          status: 'completed',
          result: {
            fileId: uploadResult.fileId,
            messageId: uploadResult.messageId,
          }
        });

        // Callback
        const completedItem = uploads.find(u => u.id === uploadId);
        if (completedItem) {
          onUploadComplete?.({ ...completedItem, status: 'completed' });
        }

      } catch (error: any) {
        console.error(`[DirectUpload] Upload failed:`, error);
        
        updateUpload(uploadId, {
          status: 'error',
          error: error.message || 'Upload failed',
        });

        const failedItem = uploads.find(u => u.id === uploadId);
        if (failedItem) {
          onError?.({ ...failedItem, status: 'error' }, error);
        }
      }

      // Remove from queue
      uploadQueueRef.current.shift();
    }

    isProcessingRef.current = false;
    setIsUploading(false);
    onAllComplete?.();
  }, [channelId, folderId, updateUpload, onUploadComplete, onAllComplete, onError, uploads]);

  /**
   * Add files to upload queue
   */
  const uploadFiles = useCallback((files: File[]) => {
    // Add to queue
    uploadQueueRef.current.push(...files);
    
    // Start processing if not already
    processQueue();
  }, [processQueue]);

  /**
   * Cancel all pending uploads
   */
  const cancelAll = useCallback(() => {
    uploadQueueRef.current = [];
    abortControllerRef.current?.abort();
    setUploads(prev => prev.map(item => 
      item.status === 'pending' || item.status === 'uploading'
        ? { ...item, status: 'error', error: 'Cancelled' }
        : item
    ));
    setIsUploading(false);
    isProcessingRef.current = false;
  }, []);

  /**
   * Retry a failed upload
   */
  const retryUpload = useCallback((uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (upload && upload.status === 'error') {
      // Remove the failed upload
      removeUpload(uploadId);
      // Re-queue the file
      uploadFiles([upload.file]);
    }
  }, [uploads, removeUpload, uploadFiles]);

  return {
    uploads,
    isUploading,
    uploadFiles,
    cancelAll,
    removeUpload,
    clearCompleted,
    retryUpload,
  };
}

/**
 * Simple hook for single file upload with progress
 */
export function useSingleUpload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'registering' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    file: File,
    channelId: string,
    folderId?: string | null
  ): Promise<{ fileId: string; messageId: number } | null> => {
    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      // Get or initialize client
      let client;
      try {
        client = await getTelegramClient();
        await client.getMe();
      } catch (e) {
        // Get session from backend
        const response = await api.get('/auth/session');
        if (response.data?.data?.sessionData) {
          client = await setSessionFromServer(response.data.data.sessionData);
        } else {
          throw new Error('Not authenticated with Telegram');
        }
      }

      // Upload to Telegram
      const result = await uploadFileDirect(client, channelId, file, (p) => {
        setProgress(p.percent);
      });

      // Register with backend
      setStatus('registering');
      const checksum = await calculateFileHashStreaming(file);

      await api.post('/files/register', {
        telegramFileId: result.fileId,
        telegramMessageId: result.messageId,
        channelId,
        fileName: file.name,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        checksum,
        folderId: folderId || undefined,
      });

      setStatus('completed');
      return { fileId: result.fileId, messageId: result.messageId };

    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Upload failed');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus('idle');
    setError(null);
  }, []);

  return { upload, progress, status, error, reset };
}
