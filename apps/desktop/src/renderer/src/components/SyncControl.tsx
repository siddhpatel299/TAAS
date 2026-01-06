import { Play, Pause, Power, Clock } from 'lucide-react';
import { useSyncStore } from '../stores/sync-store';

export function SyncControl() {
  const { syncState, enableSync, disableSync, pauseSync, resumeSync } = useSyncStore();
  const { isEnabled, isPaused, channelId, queue } = syncState;

  const pendingCount = queue.filter((q) => q.status === 'pending').length;
  const uploadingItem = queue.find((q) => q.status === 'uploading');

  const canEnable = !!channelId && syncState.folders.some((f) => f.enabled);

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-gray-800/50 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Status and controls */}
        <div className="flex items-center gap-4">
          {/* Main toggle */}
          <button
            onClick={isEnabled ? disableSync : enableSync}
            disabled={!canEnable && !isEnabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isEnabled
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : canEnable
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Power className="w-4 h-4" />
            {isEnabled ? 'Disable Sync' : 'Enable Sync'}
          </button>

          {/* Pause/Resume */}
          {isEnabled && (
            <button
              onClick={isPaused ? resumeSync : pauseSync}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isPaused
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </button>
          )}
        </div>

        {/* Right side - Status info */}
        <div className="flex items-center gap-6 text-sm">
          {/* Queue status */}
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              {uploadingItem
                ? `Uploading: ${uploadingItem.relativePath}`
                : pendingCount > 0
                ? `${pendingCount} pending`
                : 'Queue empty'}
            </span>
          </div>

          {/* Last upload time */}
          {syncState.lastUploadTime && (
            <div className="text-gray-500">
              Last upload: {formatTimeAgo(syncState.lastUploadTime)}
            </div>
          )}
        </div>
      </div>

      {/* Status messages */}
      {!canEnable && !isEnabled && (
        <p className="text-sm text-gray-500 mt-2">
          {!channelId
            ? 'Select a storage channel to enable sync'
            : 'Enable at least one folder to start syncing'}
        </p>
      )}
    </div>
  );
}
