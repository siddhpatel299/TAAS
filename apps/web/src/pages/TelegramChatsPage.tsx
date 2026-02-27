import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Megaphone,
  User,
  ArrowLeft,
  Download,
  FileIcon,
  Image,
  Video,
  Loader2,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  FolderOpen,
  AlertCircle,
  Music,
  Play,
  Search,
} from 'lucide-react';
import { useOSStore } from '@/stores/os.store';
import { HUDAppLayout, HUDCard, HUDDataTable } from '@/components/hud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useTelegramStore, TelegramChat, TelegramMessage, FileTypeFilter } from '@/stores/telegram.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { cn, formatFileSize, formatDate } from '@/lib/utils';

/**
 * TelegramChatsPage
 * 
 * Allows users to browse their Telegram chats and import individual files to TAAS.
 * 
 * Rules:
 * - Manual only - user must click to import
 * - One file per action - no bulk imports
 * - No auto-sync, no background tasks
 */

// Chat type icons
const chatTypeIcons = {
  user: User,
  group: Users,
  supergroup: Users,
  channel: Megaphone,
};

// File type icons
function getMediaIcon(message: TelegramMessage) {
  if (message.hasVideo) return Video;
  if (message.hasPhoto) return Image;
  if (message.hasAudio) return Music;
  return FileIcon;
}

// Get file info from message
function getFileInfo(message: TelegramMessage): { name: string; size: number; mimeType: string } | null {
  if (message.hasDocument && message.document) {
    return {
      name: message.document.fileName,
      size: message.document.size,
      mimeType: message.document.mimeType,
    };
  }
  if (message.hasVideo && message.video) {
    return {
      name: message.video.fileName,
      size: message.video.size,
      mimeType: message.video.mimeType,
    };
  }
  if (message.hasPhoto && message.photo) {
    return {
      name: `photo_${message.id}.jpg`,
      size: message.photo.size,
      mimeType: 'image/jpeg',
    };
  }
  if (message.hasAudio && message.audio) {
    return {
      name: message.audio.fileName || message.audio.title || `audio_${message.id}.mp3`,
      size: message.audio.size,
      mimeType: message.audio.mimeType,
    };
  }
  return null;
}

// File type filter tabs
const FILE_TYPE_TABS: { value: FileTypeFilter; label: string; icon: typeof FileIcon }[] = [
  { value: 'all', label: 'All', icon: FileIcon },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'photo', label: 'Photos', icon: Image },
  { value: 'document', label: 'Documents', icon: FileIcon },
  { value: 'audio', label: 'Audio', icon: Music },
];

export function TelegramChatsPage() {
  const {
    chats,
    chatsLoading,
    chatsError,
    selectedChatId,
    messages,
    messagesLoading,
    messagesError,
    hasMoreMessages,
    importingFile,
    fileTypeFilter,
    fileCounts,
    setChats,
    setChatsLoading,
    setChatsError,
    selectChat,
    setMessages,
    appendMessages,
    setMessagesLoading,
    setMessagesError,
    setHasMoreMessages,
    setImportingFile,
    updateImportStatus,
    setFileTypeFilter,
    setFileCounts,
  } = useTelegramStore();

  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<TelegramMessage | null>(null);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [previewMessage, setPreviewMessage] = useState<TelegramMessage | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!chatSearchQuery.trim()) return chats;
    const query = chatSearchQuery.toLowerCase();
    return chats.filter(chat => 
      chat.title.toLowerCase().includes(query) ||
      chat.lastMessage?.toLowerCase().includes(query)
    );
  }, [chats, chatSearchQuery]);

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!fileSearchQuery.trim()) return messages;
    const query = fileSearchQuery.toLowerCase();
    return messages.filter(message => {
      const fileInfo = getFileInfo(message);
      if (!fileInfo) return false;
      return fileInfo.name.toLowerCase().includes(query);
    });
  }, [messages, fileSearchQuery]);

  // Load chats on mount
  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    setChatsError(null);
    try {
      const response = await telegramApi.getChats();
      setChats(response.data.data);
    } catch (error: any) {
      setChatsError(error.response?.data?.error || 'Failed to load chats');
    } finally {
      setChatsLoading(false);
    }
  }, [setChats, setChatsLoading, setChatsError]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Load messages when a chat is selected
  const loadMessages = useCallback(async (chatId: string, offsetId?: number, typeFilter?: FileTypeFilter) => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const params: { limit: number; offsetId?: number; filesOnly: boolean; fileType?: 'video' | 'photo' | 'document' | 'audio' } = {
        limit: 50,
        offsetId,
        filesOnly: true,
      };
      
      // Apply file type filter (don't send 'all')
      if (typeFilter && typeFilter !== 'all') {
        params.fileType = typeFilter;
      }

      const response = await telegramApi.getChatMessages(chatId, params);
      
      if (offsetId) {
        appendMessages(response.data.data);
      } else {
        setMessages(response.data.data);
      }
      setHasMoreMessages(response.data.meta.hasMore);
      
      // Update file counts if provided
      if (response.data.meta.counts) {
        setFileCounts(response.data.meta.counts);
      }
    } catch (error: any) {
      setMessagesError(error.response?.data?.error || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [setMessages, appendMessages, setMessagesLoading, setMessagesError, setHasMoreMessages, setFileCounts]);

  // Load folders for import dialog
  const loadFolders = useCallback(async () => {
    try {
      const response = await foldersApi.getFolders();
      setFolders(response.data.data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, []);

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    loadMessages(chatId, undefined, 'all');
  };

  // Handle back to chats
  const handleBackToChats = () => {
    selectChat(null);
  };

  // Handle load more messages
  const handleLoadMore = () => {
    if (selectedChatId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      loadMessages(selectedChatId, lastMessage.id, fileTypeFilter);
    }
  };

  // Handle file type filter change
  const handleFilterChange = (filter: FileTypeFilter) => {
    setFileTypeFilter(filter);
    if (selectedChatId) {
      loadMessages(selectedChatId, undefined, filter);
    }
  };

  // Handle preview click for video/audio
  const handlePreviewClick = (message: TelegramMessage) => {
    setPreviewMessage(message);
    setShowPreviewDialog(true);
  };

  // Handle import click - opens folder selection dialog
  const handleImportClick = (message: TelegramMessage) => {
    setSelectedMessage(message);
    setSelectedFolderId(undefined);
    loadFolders();
    setShowFolderDialog(true);
  };

  // Handle import confirmation
  const handleImportConfirm = async () => {
    if (!selectedMessage || !selectedChatId) return;

    const fileInfo = getFileInfo(selectedMessage);
    if (!fileInfo) return;

    setShowFolderDialog(false);
    setImportingFile({
      chatId: selectedChatId,
      messageId: selectedMessage.id,
      fileName: fileInfo.name,
      status: 'importing',
    });

    try {
      const response = await telegramApi.importFile(
        selectedChatId,
        selectedMessage.id,
        selectedFolderId
      );

      // Check if this is a deferred import (large file)
      if (response.data.deferred && response.data.importId) {
        const importId = response.data.importId;
        let pollCount = 0;
        const maxPolls = 100; // 100 polls * 3 sec = 5 minutes max
        
        // Poll for completion - with strict limits
        const pollInterval = setInterval(async () => {
          pollCount++;
          
          // GUARDRAIL: Stop polling after max attempts
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            updateImportStatus('error', 'Import is taking too long. Check your files later.');
            setTimeout(() => setImportingFile(null), 5000);
            return;
          }
          
          try {
            const statusResponse = await telegramApi.getImportStatus(importId);
            const imp = statusResponse.data.data;

            if (imp.status === 'completed') {
              clearInterval(pollInterval);
              updateImportStatus('success', undefined, imp.result?.fileId);
              setTimeout(() => setImportingFile(null), 3000);
            } else if (imp.status === 'failed' || imp.status === 'aborted') {
              clearInterval(pollInterval);
              updateImportStatus('error', imp.error || 'Import failed');
              setTimeout(() => setImportingFile(null), 5000);
            }
            // Otherwise keep polling (pending, processing)
          } catch (pollError: any) {
            // If we get 404, the import was cleaned up - stop polling
            if (pollError.response?.status === 404) {
              clearInterval(pollInterval);
              updateImportStatus('error', 'Import expired. Please try again.');
              setTimeout(() => setImportingFile(null), 5000);
            }
            console.error('Error polling import status:', pollError);
          }
        }, 3000); // Poll every 3 seconds
        
      } else {
        // Synchronous import completed
        updateImportStatus('success', undefined, response.data.data?.fileId);
        setTimeout(() => setImportingFile(null), 3000);
      }
    } catch (error: any) {
      updateImportStatus('error', error.response?.data?.error || 'Failed to import file');
      setTimeout(() => setImportingFile(null), 5000);
    }

    setSelectedMessage(null);
  };

  // Get selected chat object
  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const osStyle = useOSStore((s) => s.osStyle);
  const isHUD = osStyle === 'hud';

  if (isHUD) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <HUDAppLayout
          title={selectedChat ? selectedChat.title.toUpperCase() : 'TELEGRAM'}
          searchPlaceholder={selectedChatId ? 'Search files...' : 'Search chats...'}
          searchValue={selectedChatId ? fileSearchQuery : chatSearchQuery}
          onSearchChange={(v) => selectedChatId ? setFileSearchQuery(v) : setChatSearchQuery(v)}
          actions={
            <>
              {selectedChatId && (
                <button
                  type="button"
                  onClick={handleBackToChats}
                  className="hud-btn px-2 py-1.5 text-xs"
                  title="Back"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline" />
                </button>
              )}
              {!selectedChatId && (
                <button
                  type="button"
                  onClick={loadChats}
                  disabled={chatsLoading}
                  className="hud-btn px-2 py-1.5 text-xs"
                  title="Refresh"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5 inline', chatsLoading && 'animate-spin')} />
                </button>
              )}
            </>
          }
        >
          <div className="space-y-4">
            {!selectedChatId ? (
              <HUDCard accent>
                <div className="p-4">
                  <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(0,255,255,0.9)' }}>
                    CHATS
                  </h3>
                  {chatsLoading && chats.length === 0 ? (
                    <div className="py-12 text-center text-xs tracking-widest" style={{ color: 'rgba(0,255,255,0.5)' }}>LOADING...</div>
                  ) : chatsError ? (
                    <div className="py-8 text-center">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2" style={{ color: '#ef4444' }} />
                      <p className="text-xs" style={{ color: '#ef4444' }}>{chatsError}</p>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="py-12 text-center border border-dashed" style={{ borderColor: 'rgba(0,255,255,0.2)' }}>
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: '#22d3ee' }} />
                      <p className="text-xs tracking-widest" style={{ color: 'rgba(0,255,255,0.5)' }}>NO CHATS</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredChats.map((chat) => {
                        const Icon = chatTypeIcons[chat.type];
                        return (
                          <HUDCard key={chat.id} onClick={() => handleSelectChat(chat.id)}>
                            <div className="p-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(0,255,255,0.15)' }}>
                                <Icon className="w-5 h-5" style={{ color: '#22d3ee' }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate" style={{ color: '#67e8f9' }}>{chat.title}</p>
                                {chat.lastMessage && (
                                  <p className="text-[10px] truncate opacity-70" style={{ color: 'rgba(0,255,255,0.7)' }}>{chat.lastMessage}</p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 shrink-0 opacity-50" style={{ color: '#22d3ee' }} />
                            </div>
                          </HUDCard>
                        );
                      })}
                    </div>
                  )}
                </div>
              </HUDCard>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {FILE_TYPE_TABS.map((tab) => {
                    const count = tab.value === 'all' ? fileCounts.total : fileCounts[tab.value];
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => handleFilterChange(tab.value)}
                        className={cn(
                          'hud-badge px-2 py-1 text-xs flex items-center gap-1',
                          fileTypeFilter === tab.value && 'ring-1 ring-cyan-400'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {tab.label}
                        {count > 0 && <span className="opacity-80">({count})</span>}
                      </button>
                    );
                  })}
                </div>
                <HUDCard accent>
                  <div className="p-4">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(0,255,255,0.9)' }}>
                      FILES
                    </h3>
                    {messagesLoading && filteredMessages.length === 0 ? (
                      <div className="py-12 text-center text-xs tracking-widest" style={{ color: 'rgba(0,255,255,0.5)' }}>LOADING...</div>
                    ) : messagesError ? (
                      <div className="py-8 text-center">
                        <p className="text-xs" style={{ color: '#ef4444' }}>{messagesError}</p>
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="py-12 text-center border border-dashed" style={{ borderColor: 'rgba(0,255,255,0.2)' }}>
                        <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: '#22d3ee' }} />
                        <p className="text-xs tracking-widest" style={{ color: 'rgba(0,255,255,0.5)' }}>NO FILES</p>
                      </div>
                    ) : (
                      <HUDDataTable
                        columns={[
                          {
                            key: 'name',
                            header: 'FILE',
                            render: (m) => {
                              const info = getFileInfo(m);
                              const Icon = getMediaIcon(m);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handlePreviewClick(m)}
                                  className="flex items-center gap-2 hover:underline text-left"
                                >
                                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: '#22d3ee' }} />
                                  {info?.name || 'Unknown'}
                                </button>
                              );
                            },
                          },
                          { key: 'size', header: 'SIZE', render: (m) => formatFileSize(getFileInfo(m)?.size || 0) },
                          {
                            key: 'import',
                            header: '',
                            render: (m) => (
                              <button
                                type="button"
                                onClick={() => handleImportClick(m)}
                                disabled={!!importingFile}
                                className="hud-btn px-2 py-1 text-xs"
                              >
                                IMPORT
                              </button>
                            ),
                          },
                        ]}
                        data={filteredMessages}
                        keyExtractor={(m) => String(m.id)}
                        emptyMessage="NO FILES"
                      />
                    )}
                  </div>
                </HUDCard>
              </>
            )}
          </div>
        </HUDAppLayout>
        <AnimatePresence>
          {importingFile && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 right-4 z-50 p-4 rounded flex items-center gap-3 text-xs"
              style={{ backgroundColor: 'var(--hud-bg-secondary)', border: '1px solid rgba(0,255,255,0.3)' }}
            >
              {importingFile.status === 'importing' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#22d3ee' }} />
                  <span style={{ color: '#67e8f9' }}>Importing {importingFile.fileName}...</span>
                </>
              )}
              {importingFile.status === 'success' && (
                <>
                  <Check className="w-4 h-4" style={{ color: '#22c55e' }} />
                  <span style={{ color: '#67e8f9' }}>Imported {importingFile.fileName}</span>
                </>
              )}
              {importingFile.status === 'error' && (
                <>
                  <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                  <span style={{ color: '#ef4444' }}>{importingFile.error}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
          <DialogContent className="sm:max-w-md bg-[var(--hud-bg-secondary)] border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Import to TAAS</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {selectedMessage && (
                <div className="mb-4 p-3 rounded text-xs" style={{ backgroundColor: 'rgba(0,255,255,0.05)', color: '#67e8f9' }}>
                  <p className="font-medium">{getFileInfo(selectedMessage)?.name}</p>
                  <p className="opacity-70">{formatFileSize(getFileInfo(selectedMessage)?.size || 0)}</p>
                </div>
              )}
              <p className="text-xs mb-3" style={{ color: 'rgba(0,255,255,0.8)' }}>Select destination folder (optional):</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => setSelectedFolderId(undefined)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded text-left text-xs',
                    !selectedFolderId ? 'ring-1 ring-cyan-400' : 'hover:bg-cyan-500/10'
                  )}
                  style={{ color: '#67e8f9' }}
                >
                  <FolderOpen className="w-4 h-4" />
                  Root (My Files)
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded text-left text-xs',
                      selectedFolderId === folder.id ? 'ring-1 ring-cyan-400' : 'hover:bg-cyan-500/10'
                    )}
                    style={{ color: '#67e8f9' }}
                  >
                    <FolderOpen className="w-4 h-4" />
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFolderDialog(false)} className="border-cyan-500/30 text-cyan-400">
                Cancel
              </Button>
              <Button onClick={handleImportConfirm} className="bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30">
                <Download className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-3xl bg-[var(--hud-bg-secondary)] border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-cyan-400 flex items-center gap-2">
                {previewMessage?.hasVideo ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                {previewMessage && getFileInfo(previewMessage)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {previewMessage && selectedChatId && (
                <MediaPreview
                  chatId={selectedChatId}
                  messageId={previewMessage.id}
                  isVideo={previewMessage.hasVideo}
                  isAudio={previewMessage.hasAudio}
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)} className="border-cyan-500/30 text-cyan-400">
                Close
              </Button>
              {previewMessage && (
                <Button
                  onClick={() => { setShowPreviewDialog(false); handleImportClick(previewMessage); }}
                  className="bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <ModernSidebar />

      <main className="flex-1 ml-20 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {selectedChatId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToChats}
                  className="rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedChat ? selectedChat.title : 'Telegram Chats'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {selectedChatId
                    ? 'Select a file to import to TAAS'
                    : 'Browse your Telegram chats and import files'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={selectedChatId ? "Search files..." : "Search chats..."}
                  value={selectedChatId ? fileSearchQuery : chatSearchQuery}
                  onChange={(e) => selectedChatId ? setFileSearchQuery(e.target.value) : setChatSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              {!selectedChatId && (
                <Button
                  variant="outline"
                  onClick={loadChats}
                  disabled={chatsLoading}
                  className="rounded-xl"
                >
                  <RefreshCw className={cn('w-4 h-4 mr-2', chatsLoading && 'animate-spin')} />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {/* Import Status Toast */}
          <AnimatePresence>
            {importingFile && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  'fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3',
                  importingFile.status === 'importing' && 'bg-blue-50 border border-blue-200',
                  importingFile.status === 'success' && 'bg-green-50 border border-green-200',
                  importingFile.status === 'error' && 'bg-red-50 border border-red-200'
                )}
              >
                {importingFile.status === 'importing' && (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-blue-700">Importing {importingFile.fileName}...</span>
                  </>
                )}
                {importingFile.status === 'success' && (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-700">Successfully imported {importingFile.fileName}</span>
                  </>
                )}
                {importingFile.status === 'error' && (
                  <>
                    <X className="w-5 h-5 text-red-500" />
                    <div className="text-red-700">
                      <p className="font-medium">Failed to import</p>
                      <p className="text-sm">{importingFile.error}</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          {!selectedChatId ? (
            // Chats List
            <ChatsList
              chats={filteredChats}
              loading={chatsLoading}
              error={chatsError}
              onSelectChat={handleSelectChat}
              searchQuery={chatSearchQuery}
            />
          ) : (
            // Messages List with Filter Tabs
            <div className="space-y-4">
              {/* File Type Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {FILE_TYPE_TABS.map((tab) => {
                  const count = tab.value === 'all' ? fileCounts.total : fileCounts[tab.value];
                  const Icon = tab.icon;
                  
                  return (
                    <button
                      key={tab.value}
                      onClick={() => handleFilterChange(tab.value)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                        fileTypeFilter === tab.value
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {count > 0 && (
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs',
                          fileTypeFilter === tab.value
                            ? 'bg-blue-400 text-white'
                            : 'bg-gray-100 text-gray-500'
                        )}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Messages */}
              <MessagesList
                messages={filteredMessages}
                loading={messagesLoading}
                error={messagesError}
                hasMore={hasMoreMessages}
                importingFile={importingFile}
                onLoadMore={handleLoadMore}
                onImport={handleImportClick}
                onPreview={handlePreviewClick}
                searchQuery={fileSearchQuery}
              />
            </div>
          )}
        </div>
      </main>

      {/* Folder Selection Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import to TAAS</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedMessage && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-900">
                  {getFileInfo(selectedMessage)?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(getFileInfo(selectedMessage)?.size || 0)}
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mb-3">Select destination folder (optional):</p>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => setSelectedFolderId(undefined)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  !selectedFolderId ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                )}
              >
                <FolderOpen className="w-5 h-5 text-gray-400" />
                <span className="text-sm">Root (My Files)</span>
              </button>
              
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    selectedFolderId === folder.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <FolderOpen className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">{folder.name}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm}>
              <Download className="w-4 h-4 mr-2" />
              Import to TAAS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video/Audio Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewMessage?.hasVideo ? (
                <Video className="w-5 h-5 text-blue-500" />
              ) : (
                <Music className="w-5 h-5 text-purple-500" />
              )}
              {previewMessage && getFileInfo(previewMessage)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewMessage && selectedChatId && (
              <MediaPreview
                chatId={selectedChatId}
                messageId={previewMessage.id}
                isVideo={previewMessage.hasVideo}
                isAudio={previewMessage.hasAudio}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            {previewMessage && (
              <Button onClick={() => {
                setShowPreviewDialog(false);
                handleImportClick(previewMessage);
              }}>
                <Download className="w-4 h-4 mr-2" />
                Import to TAAS
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Chats List Component
function ChatsList({
  chats,
  loading,
  error,
  onSelectChat,
  searchQuery,
}: {
  chats: TelegramChat[];
  loading: boolean;
  error: string | null;
  onSelectChat: (chatId: string) => void;
  searchQuery?: string;
}) {
  if (loading && chats.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-gray-500 text-sm mt-2">Please make sure you're connected to Telegram</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">
          {searchQuery ? `No chats found for "${searchQuery}"` : 'No chats found'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {chats.map((chat) => {
        const Icon = chatTypeIcons[chat.type];
        
        return (
          <motion.button
            key={chat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelectChat(chat.id)}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left w-full"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 truncate">{chat.title}</p>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                  {chat.type}
                </span>
              </div>
              {chat.lastMessage && (
                <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
              )}
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>
        );
      })}
    </div>
  );
}

// Messages List Component
function MessagesList({
  messages,
  loading,
  error,
  hasMore,
  importingFile,
  onLoadMore,
  onImport,
  onPreview,
  searchQuery,
}: {
  messages: TelegramMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  importingFile: { chatId: string; messageId: number; status: string } | null;
  onLoadMore: () => void;
  onImport: (message: TelegramMessage) => void;
  onPreview: (message: TelegramMessage) => void;
  searchQuery?: string;
}) {
  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileIcon className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">
          {searchQuery ? `No files found for "${searchQuery}"` : 'No files found in this chat'}
        </p>
        {!searchQuery && <p className="text-gray-400 text-sm mt-1">Only messages with files are shown</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const Icon = getMediaIcon(message);
        const fileInfo = getFileInfo(message);
        const isImporting = importingFile?.messageId === message.id && importingFile?.status === 'importing';

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-gray-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {fileInfo?.name || 'Unknown file'}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{formatFileSize(fileInfo?.size || 0)}</span>
                <span>•</span>
                <span>{formatDate(message.date)}</span>
                {message.hasVideo && (
                  <>
                    <span>•</span>
                    <span className="text-blue-500">Video</span>
                  </>
                )}
                {message.hasAudio && (
                  <>
                    <span>•</span>
                    <span className="text-purple-500">Audio</span>
                  </>
                )}
              </div>
              {message.text && (
                <p className="text-sm text-gray-400 truncate mt-1">{message.text}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Preview button for video/audio */}
              {(message.hasVideo || message.hasAudio) && (
                <Button
                  variant="outline"
                  onClick={() => onPreview(message)}
                  className="rounded-xl"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}

              <Button
                onClick={() => onImport(message)}
                disabled={isImporting}
                className="rounded-xl"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="rounded-xl"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Media Preview Component for streaming video/audio
function MediaPreview({
  chatId,
  messageId,
  isVideo,
  isAudio,
}: {
  chatId: string;
  messageId: number;
  isVideo: boolean;
  isAudio: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const streamUrl = telegramApi.getStreamUrl(chatId, messageId);

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load media. The file may be too large or unavailable.');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600">{error}</p>
        <p className="text-gray-500 text-sm mt-2">Try importing the file instead</p>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          src={streamUrl}
          className="w-full max-h-[60vh] object-contain"
          controls
          preload="metadata"
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
        />
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mb-6">
          <Music className="w-16 h-16 text-white" />
        </div>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading audio...</span>
          </div>
        )}
        
        <audio
          ref={audioRef}
          src={streamUrl}
          className="w-full max-w-md"
          controls
          preload="metadata"
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
        />
      </div>
    );
  }

  return null;
}

export default TelegramChatsPage;
