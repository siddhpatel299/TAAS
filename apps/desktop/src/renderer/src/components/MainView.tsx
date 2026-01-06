import { useState } from 'react';
import { 
  FolderSync, 
  Settings, 
  LogOut, 
  User,
  Upload,
  HardDrive
} from 'lucide-react';
import { useSyncStore } from '../stores/sync-store';
import { SyncControl } from './SyncControl';
import { FolderList } from './FolderList';
import { UploadQueue } from './UploadQueue';
import { SettingsPanel } from './SettingsPanel';
import { ChannelSelector } from './ChannelSelector';

type Tab = 'sync' | 'settings';

export function MainView() {
  const { authState, syncState, logout } = useSyncStore();
  const [activeTab, setActiveTab] = useState<Tab>('sync');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* User info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-telegram-blue rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {authState.firstName} {authState.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                @{authState.username || 'unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Upload className="w-3 h-3" />
                <span className="text-xs">Uploaded</span>
              </div>
              <p className="text-sm font-medium text-white">
                {formatBytes(syncState.totalUploaded)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <HardDrive className="w-3 h-3" />
                <span className="text-xs">Folders</span>
              </div>
              <p className="text-sm font-medium text-white">
                {syncState.folders.length}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'sync'
                ? 'bg-telegram-blue text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <FolderSync className="w-5 h-5" />
            <span>Folder Sync</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mt-1 ${
              activeTab === 'settings'
                ? 'bg-telegram-blue text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'sync' ? (
          <>
            {/* Channel selector */}
            <ChannelSelector />
            
            {/* Sync control */}
            <SyncControl />

            {/* Content area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Folder list */}
              <div className="flex-1 overflow-y-auto p-4">
                <FolderList />
              </div>

              {/* Upload queue */}
              <div className="w-80 border-l border-gray-700 overflow-y-auto">
                <UploadQueue />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <SettingsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
