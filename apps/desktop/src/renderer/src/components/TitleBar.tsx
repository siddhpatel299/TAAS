import { Minus, X, Square } from 'lucide-react';
import { useSyncStore } from '../stores/sync-store';

export function TitleBar() {
  const { syncState } = useSyncStore();

  const handleMinimize = () => window.electronAPI.app.minimize();
  const handleClose = () => window.electronAPI.app.close();

  return (
    <div className="titlebar h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-telegram-blue rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">T</span>
        </div>
        <span className="text-sm font-medium text-gray-200">TAAS Desktop</span>
        
        {/* Sync status indicator */}
        <div className="ml-4 flex items-center gap-2">
          {syncState.isEnabled ? (
            syncState.isPaused ? (
              <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-xs text-yellow-400">Paused</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">Syncing</span>
              </>
            )
          ) : (
            <>
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
              <span className="text-xs text-gray-500">Sync Off</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          aria-label="Minimize"
        >
          <Minus className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-red-500 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
