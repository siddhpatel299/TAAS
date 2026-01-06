import { useState } from 'react';
import { Hash, Plus, Check, ChevronDown } from 'lucide-react';
import { useSyncStore } from '../stores/sync-store';

export function ChannelSelector() {
  const { channels, syncState, loadChannels, selectChannel, createChannel } = useSyncStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const selectedChannel = channels.find((c) => c.isSelected);

  const handleSelectChannel = async (channelId: string) => {
    await selectChannel(channelId);
    setIsOpen(false);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    await createChannel(newChannelName.trim());
    setNewChannelName('');
    setIsCreating(false);
  };

  return (
    <div className="border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Storage Channel</label>
          <div className="relative">
            <button
              onClick={() => {
                loadChannels();
                setIsOpen(!isOpen);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors min-w-[200px]"
            >
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-left text-sm text-white truncate">
                {selectedChannel?.name || syncState.channelName || 'Select channel...'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10 overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleSelectChannel(channel.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition-colors"
                    >
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-left text-sm text-white truncate">
                        {channel.name}
                      </span>
                      {channel.isSelected && (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-700">
                  {isCreating ? (
                    <div className="p-2">
                      <input
                        type="text"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="Channel name"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-telegram-blue"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateChannel();
                          if (e.key === 'Escape') setIsCreating(false);
                        }}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleCreateChannel}
                          className="flex-1 px-3 py-1.5 bg-telegram-blue text-white text-sm rounded hover:bg-telegram-dark transition-colors"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => setIsCreating(false)}
                          className="px-3 py-1.5 text-gray-400 text-sm hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-telegram-blue hover:bg-gray-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Create new channel</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {!selectedChannel && !syncState.channelId && (
          <p className="text-sm text-yellow-400">
            ⚠️ Select a channel to enable sync
          </p>
        )}
      </div>
    </div>
  );
}
