/**
 * Direct Upload Queue Component
 * 
 * Displays upload progress for direct browser-to-Telegram uploads.
 * Memory-efficient: files are uploaded directly to Telegram, not through server.
 */

import { X, CheckCircle, AlertCircle, Loader2, RefreshCw, Cloud, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useDirectUpload, DirectUploadItem } from '@/contexts/DirectUploadContext';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DirectUploadQueue() {
  const { uploads, isClientReady, removeUpload, clearCompleted, retryUpload } = useDirectUpload();

  const hasCompleted = uploads.some(u => u.status === 'completed' || u.status === 'error');

  if (uploads.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Direct Upload</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Cloud className="w-3 h-3" />
            Browser → Telegram
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300">
          {uploads.length}
        </span>
        {hasCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompleted}
            className="h-8 text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Client status warning */}
      {!isClientReady && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Connecting to Telegram...
          </p>
        </div>
      )}

      {/* Upload list */}
      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence>
          {uploads.map((upload) => (
            <UploadItem
              key={upload.id}
              upload={upload}
              onRemove={() => removeUpload(upload.id)}
              onRetry={() => retryUpload(upload.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface UploadItemProps {
  upload: DirectUploadItem;
  onRemove: () => void;
  onRetry: () => void;
}

function UploadItem({ upload, onRemove, onRetry }: UploadItemProps) {
  const statusConfig = {
    queued: {
      icon: <Loader2 className="w-4 h-4 animate-pulse text-gray-400" />,
      bg: 'bg-gray-50 dark:bg-gray-800/50',
      label: 'Queued',
    },
    uploading: {
      icon: <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />,
      bg: 'bg-cyan-50 dark:bg-cyan-900/30',
      label: 'Uploading to Telegram',
    },
    registering: {
      icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      label: 'Registering...',
    },
    completed: {
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      bg: 'bg-green-50 dark:bg-green-900/30',
      label: 'Completed',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      bg: 'bg-red-50 dark:bg-red-900/30',
      label: 'Failed',
    },
  };

  const status = statusConfig[upload.status];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center flex-shrink-0`}>
          {status.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {upload.fileName}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {formatBytes(upload.uploadedBytes)} / {formatBytes(upload.totalBytes)}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className={`text-xs ${upload.status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
              {upload.status === 'error' ? upload.error : status.label}
            </span>
          </div>

          {/* Progress bar */}
          {(upload.status === 'uploading' || upload.status === 'registering') && (
            <div className="mt-2">
              <Progress value={upload.progress} className="h-1.5" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {upload.status === 'error' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-cyan-500"
              onClick={onRetry}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-600"
            onClick={onRemove}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default DirectUploadQueue;
