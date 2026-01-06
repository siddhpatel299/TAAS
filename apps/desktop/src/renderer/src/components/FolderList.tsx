import { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Clock,
  MoreVertical
} from 'lucide-react';
import { useSyncStore } from '../stores/sync-store';
import { SyncFolder } from '../types';

export function FolderList() {
  const { syncState, selectFolder, addFolder, removeFolder, enableFolder, disableFolder } = useSyncStore();
  const [isAdding, setIsAdding] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [remoteName, setRemoteName] = useState('');

  const handleAddFolder = async () => {
    const path = await selectFolder();
    if (path) {
      setPendingPath(path);
      setRemoteName(path.split('/').pop() || 'Sync Folder');
      setIsAdding(true);
    }
  };

  const handleConfirmAdd = async () => {
    if (pendingPath && remoteName.trim()) {
      await addFolder(pendingPath, remoteName.trim());
      setPendingPath(null);
      setRemoteName('');
      setIsAdding(false);
    }
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Sync Folders</h2>
        <button
          onClick={handleAddFolder}
          className="flex items-center gap-2 px-3 py-1.5 bg-telegram-blue hover:bg-telegram-dark text-white text-sm rounded-lg transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          Add Folder
        </button>
      </div>

      {/* Add folder modal */}
      {isAdding && pendingPath && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3">Add Folder to Sync</h3>
          
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Local Path</label>
            <div className="px-3 py-2 bg-gray-700 rounded text-sm text-gray-300 truncate">
              {pendingPath}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">Remote Folder Name</label>
            <input
              type="text"
              value={remoteName}
              onChange={(e) => setRemoteName(e.target.value)}
              placeholder="My Documents"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-telegram-blue"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirmAdd}
              disabled={!remoteName.trim()}
              className="flex-1 px-3 py-2 bg-telegram-blue text-white text-sm rounded hover:bg-telegram-dark transition-colors disabled:opacity-50"
            >
              Add Folder
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setPendingPath(null);
              }}
              className="px-3 py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            ⚠️ You must explicitly enable this folder after adding to start syncing
          </p>
        </div>
      )}

      {/* Folder list */}
      {syncState.folders.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No folders added yet</p>
          <p className="text-sm text-gray-500">
            Add a folder to start syncing files to Telegram
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {syncState.folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              onEnable={() => enableFolder(folder.id)}
              onDisable={() => disableFolder(folder.id)}
              onRemove={() => removeFolder(folder.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderItemProps {
  folder: SyncFolder;
  onEnable: () => void;
  onDisable: () => void;
  onRemove: () => void;
}

function FolderItem({ folder, onEnable, onDisable, onRemove }: FolderItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`bg-gray-800 border rounded-lg p-4 transition-colors ${
      folder.enabled ? 'border-telegram-blue/50' : 'border-gray-700'
    }`}>
      <div className="flex items-start gap-3">
        {/* Folder icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          folder.enabled ? 'bg-telegram-blue/20' : 'bg-gray-700'
        }`}>
          <Folder className={`w-5 h-5 ${
            folder.enabled ? 'text-telegram-blue' : 'text-gray-500'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">
              {folder.remoteFolderName}
            </h3>
            {folder.enabled && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {folder.localPath}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatLastSync(folder.lastSyncedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={folder.enabled ? onDisable : onEnable}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title={folder.enabled ? 'Disable sync' : 'Enable sync'}
          >
            {folder.enabled ? (
              <ToggleRight className="w-6 h-6 text-telegram-blue" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-gray-500" />
            )}
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden min-w-[120px]">
                  <button
                    onClick={() => {
                      onRemove();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
