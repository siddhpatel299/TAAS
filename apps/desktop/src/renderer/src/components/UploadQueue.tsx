import { 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Lock,
  Trash2,
  X
} from 'lucide-react';
import { useSyncStore } from '../stores/sync-store';
import { QueuedUpload } from '../../../../shared/types';

export function UploadQueue() {
  const { syncState, clearQueue, removeQueueItem } = useSyncStore();
  const { queue } = syncState;

  const pendingItems = queue.filter((q) => q.status === 'pending');
  const encryptingItems = queue.filter((q) => q.status === 'encrypting');
  const uploadingItems = queue.filter((q) => q.status === 'uploading');
  const completedItems = queue.filter((q) => q.status === 'completed');
  const errorItems = queue.filter((q) => q.status === 'error');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatTimeUntil = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Soon';
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Upload Queue</h3>
          <p className="text-xs text-gray-400">
            {queue.length} item{queue.length !== 1 ? 's' : ''}
          </p>
        </div>
        {pendingItems.length > 0 && (
          <button
            onClick={clearQueue}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto p-2">
        {queue.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Queue is empty</p>
            <p className="text-xs text-gray-600 mt-1">
              New files will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Currently uploading */}
            {uploadingItems.map((item) => (
              <QueueItem 
                key={item.id} 
                item={item} 
                formatBytes={formatBytes}
              />
            ))}

            {/* Encrypting */}
            {encryptingItems.map((item) => (
              <QueueItem 
                key={item.id} 
                item={item} 
                formatBytes={formatBytes}
              />
            ))}

            {/* Pending */}
            {pendingItems.map((item) => (
              <QueueItem 
                key={item.id} 
                item={item} 
                formatBytes={formatBytes}
                formatTimeUntil={formatTimeUntil}
                onRemove={() => removeQueueItem(item.id)}
              />
            ))}

            {/* Errors */}
            {errorItems.map((item) => (
              <QueueItem 
                key={item.id} 
                item={item} 
                formatBytes={formatBytes}
                onRemove={() => removeQueueItem(item.id)}
              />
            ))}

            {/* Completed (briefly shown) */}
            {completedItems.map((item) => (
              <QueueItem 
                key={item.id} 
                item={item} 
                formatBytes={formatBytes}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {queue.length > 0 && (
        <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Pending: {pendingItems.length}</span>
            <span>Errors: {errorItems.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface QueueItemProps {
  item: QueuedUpload;
  formatBytes: (bytes: number) => string;
  formatTimeUntil?: (timestamp: number) => string;
  onRemove?: () => void;
}

function QueueItem({ item, formatBytes, formatTimeUntil, onRemove }: QueueItemProps) {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'encrypting':
        return <Lock className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'uploading':
        return <Upload className="w-4 h-4 text-telegram-blue animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'pending': return 'border-gray-700';
      case 'encrypting': return 'border-yellow-500/50';
      case 'uploading': return 'border-telegram-blue/50';
      case 'completed': return 'border-green-500/50';
      case 'error': return 'border-red-500/50';
    }
  };

  return (
    <div className={`bg-gray-800 border rounded-lg p-3 ${getStatusColor()}`}>
      <div className="flex items-start gap-2">
        {getStatusIcon()}
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white truncate" title={item.relativePath}>
            {item.relativePath}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{formatBytes(item.fileSize)}</span>
            {item.status === 'pending' && formatTimeUntil && (
              <>
                <span>•</span>
                <span>in {formatTimeUntil(item.scheduledFor)}</span>
              </>
            )}
            {item.status === 'uploading' && (
              <>
                <span>•</span>
                <span>{item.progress}%</span>
              </>
            )}
            {item.status === 'error' && item.error && (
              <>
                <span>•</span>
                <span className="text-red-400">{item.error}</span>
              </>
            )}
          </div>

          {/* Progress bar for uploading */}
          {item.status === 'uploading' && (
            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-telegram-blue transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Remove button for pending/error items */}
        {onRemove && (item.status === 'pending' || item.status === 'error') && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
            title="Remove from queue"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
