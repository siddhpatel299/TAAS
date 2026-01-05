import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useTelegramStore, TelegramChat, TelegramMessage } from '@/stores/telegram.store';
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
  return null;
}

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
  } = useTelegramStore();

  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<TelegramMessage | null>(null);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);

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
  const loadMessages = useCallback(async (chatId: string, offsetId?: number) => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const response = await telegramApi.getChatMessages(chatId, {
        limit: 50,
        offsetId,
        filesOnly: true,
      });
      
      if (offsetId) {
        appendMessages(response.data.data);
      } else {
        setMessages(response.data.data);
      }
      setHasMoreMessages(response.data.meta.hasMore);
    } catch (error: any) {
      setMessagesError(error.response?.data?.error || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [setMessages, appendMessages, setMessagesLoading, setMessagesError, setHasMoreMessages]);

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
    loadMessages(chatId);
  };

  // Handle back to chats
  const handleBackToChats = () => {
    selectChat(null);
  };

  // Handle load more messages
  const handleLoadMore = () => {
    if (selectedChatId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      loadMessages(selectedChatId, lastMessage.id);
    }
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

      updateImportStatus('success', undefined, response.data.data.fileId);

      // Clear import status after 3 seconds
      setTimeout(() => {
        setImportingFile(null);
      }, 3000);
    } catch (error: any) {
      updateImportStatus('error', error.response?.data?.error || 'Failed to import file');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setImportingFile(null);
      }, 5000);
    }

    setSelectedMessage(null);
  };

  // Get selected chat object
  const selectedChat = chats.find((c) => c.id === selectedChatId);

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
              chats={chats}
              loading={chatsLoading}
              error={chatsError}
              onSelectChat={handleSelectChat}
            />
          ) : (
            // Messages List
            <MessagesList
              messages={messages}
              loading={messagesLoading}
              error={messagesError}
              hasMore={hasMoreMessages}
              importingFile={importingFile}
              onLoadMore={handleLoadMore}
              onImport={handleImportClick}
            />
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
    </div>
  );
}

// Chats List Component
function ChatsList({
  chats,
  loading,
  error,
  onSelectChat,
}: {
  chats: TelegramChat[];
  loading: boolean;
  error: string | null;
  onSelectChat: (chatId: string) => void;
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
        <p className="text-gray-500">No chats found</p>
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
}: {
  messages: TelegramMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  importingFile: { chatId: string; messageId: number; status: string } | null;
  onLoadMore: () => void;
  onImport: (message: TelegramMessage) => void;
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
        <p className="text-gray-500">No files found in this chat</p>
        <p className="text-gray-400 text-sm mt-1">Only messages with files are shown</p>
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
              </div>
              {message.text && (
                <p className="text-sm text-gray-400 truncate mt-1">{message.text}</p>
              )}
            </div>

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

export default TelegramChatsPage;
