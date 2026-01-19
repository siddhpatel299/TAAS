import { useState, useEffect, useCallback, useMemo } from 'react';
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
    Search,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton, HUDBadge } from '@/components/hud/HUDComponents';
import { useTelegramStore, TelegramMessage, FileTypeFilter } from '@/stores/telegram.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { cn, formatFileSize, formatDate } from '@/lib/utils';

const chatTypeIcons = {
    user: User,
    group: Users,
    supergroup: Users,
    channel: Megaphone,
};

function getMediaIcon(message: TelegramMessage) {
    if (message.hasVideo) return Video;
    if (message.hasPhoto) return Image;
    if (message.hasAudio) return Music;
    return FileIcon;
}

function getFileInfo(message: TelegramMessage): { name: string; size: number; mimeType: string } | null {
    if (message.hasDocument && message.document) {
        return { name: message.document.fileName, size: message.document.size, mimeType: message.document.mimeType };
    }
    if (message.hasVideo && message.video) {
        return { name: message.video.fileName, size: message.video.size, mimeType: message.video.mimeType };
    }
    if (message.hasPhoto && message.photo) {
        return { name: `photo_${message.id}.jpg`, size: message.photo.size, mimeType: 'image/jpeg' };
    }
    if (message.hasAudio && message.audio) {
        return { name: message.audio.fileName || message.audio.title || `audio_${message.id}.mp3`, size: message.audio.size, mimeType: message.audio.mimeType };
    }
    return null;
}

const FILE_TYPE_TABS: { value: FileTypeFilter; label: string; icon: typeof FileIcon }[] = [
    { value: 'all', label: 'All', icon: FileIcon },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'photo', label: 'Photos', icon: Image },
    { value: 'document', label: 'Documents', icon: FileIcon },
    { value: 'audio', label: 'Audio', icon: Music },
];

export function HUDTelegramPage() {
    const {
        chats, chatsLoading, chatsError, selectedChatId, messages, messagesLoading, messagesError,
        hasMoreMessages, importingFile, fileTypeFilter, fileCounts,
        setChats, setChatsLoading, setChatsError, selectChat, setMessages, appendMessages,
        setMessagesLoading, setMessagesError, setHasMoreMessages, setImportingFile, updateImportStatus,
        setFileTypeFilter, setFileCounts,
    } = useTelegramStore();

    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<TelegramMessage | null>(null);
    const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;
        const query = searchQuery.toLowerCase();
        return chats.filter(chat => chat.title.toLowerCase().includes(query));
    }, [chats, searchQuery]);

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

    useEffect(() => { loadChats(); }, [loadChats]);

    const loadMessages = useCallback(async (chatId: string, offsetId?: number, typeFilter?: FileTypeFilter) => {
        setMessagesLoading(true);
        setMessagesError(null);
        try {
            const params: { limit: number; offsetId?: number; filesOnly: boolean; fileType?: 'video' | 'photo' | 'document' | 'audio' } = {
                limit: 50, offsetId, filesOnly: true,
            };
            if (typeFilter && typeFilter !== 'all') params.fileType = typeFilter;

            const response = await telegramApi.getChatMessages(chatId, params);
            if (offsetId) appendMessages(response.data.data);
            else setMessages(response.data.data);
            setHasMoreMessages(response.data.meta.hasMore);
            if (response.data.meta.counts) setFileCounts(response.data.meta.counts);
        } catch (error: any) {
            setMessagesError(error.response?.data?.error || 'Failed to load messages');
        } finally {
            setMessagesLoading(false);
        }
    }, [setMessages, appendMessages, setMessagesLoading, setMessagesError, setHasMoreMessages, setFileCounts]);

    const loadFolders = useCallback(async () => {
        try {
            const response = await foldersApi.getFolders();
            setFolders(response.data.data);
        } catch (error) {
            console.error('Failed to load folders:', error);
        }
    }, []);

    const handleSelectChat = (chatId: string) => {
        selectChat(chatId);
        loadMessages(chatId, undefined, 'all');
    };

    const handleBackToChats = () => selectChat(null);

    const handleLoadMore = () => {
        if (selectedChatId && messages.length > 0) {
            loadMessages(selectedChatId, messages[messages.length - 1].id, fileTypeFilter);
        }
    };

    const handleFilterChange = (filter: FileTypeFilter) => {
        setFileTypeFilter(filter);
        if (selectedChatId) loadMessages(selectedChatId, undefined, filter);
    };

    const handleImportClick = (message: TelegramMessage) => {
        setSelectedMessage(message);
        setSelectedFolderId(undefined);
        loadFolders();
        setShowFolderDialog(true);
    };

    const handleImportConfirm = async () => {
        if (!selectedMessage || !selectedChatId) return;
        const fileInfo = getFileInfo(selectedMessage);
        if (!fileInfo) return;

        setShowFolderDialog(false);
        setImportingFile({ chatId: selectedChatId, messageId: selectedMessage.id, fileName: fileInfo.name, status: 'importing' });

        try {
            const response = await telegramApi.importFile(selectedChatId, selectedMessage.id, selectedFolderId);
            if (response.data.deferred && response.data.importId) {
                const importId = response.data.importId;
                let pollCount = 0;
                const pollInterval = setInterval(async () => {
                    pollCount++;
                    if (pollCount >= 100) {
                        clearInterval(pollInterval);
                        updateImportStatus('error', 'Import is taking too long.');
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
                    } catch (pollError: any) {
                        if (pollError.response?.status === 404) {
                            clearInterval(pollInterval);
                            updateImportStatus('error', 'Import expired.');
                            setTimeout(() => setImportingFile(null), 5000);
                        }
                    }
                }, 3000);
            } else {
                updateImportStatus('success', undefined, response.data.data?.fileId);
                setTimeout(() => setImportingFile(null), 3000);
            }
        } catch (error: any) {
            updateImportStatus('error', error.response?.data?.error || 'Failed to import');
            setTimeout(() => setImportingFile(null), 5000);
        }
        setSelectedMessage(null);
    };

    const selectedChat = chats.find(c => c.id === selectedChatId);

    return (
        <HUDLayout>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {selectedChatId && (
                            <button onClick={handleBackToChats} className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                            <MessageSquare className="w-10 h-10 text-blue-400" style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                                {selectedChat ? selectedChat.title : 'TELEGRAM IMPORT'}
                            </h1>
                            <p className="text-cyan-600/70 mt-1 font-mono">
                                {selectedChatId ? 'Select a file to import' : 'Browse chats and import files'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="hud-input pl-10 pr-4 py-2 w-48"
                            />
                        </div>
                        {!selectedChatId && (
                            <HUDButton onClick={loadChats} disabled={chatsLoading}>
                                <RefreshCw className={cn("w-4 h-4 mr-2", chatsLoading && "animate-spin")} />
                                Refresh
                            </HUDButton>
                        )}
                    </div>
                </div>
                <motion.div className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1 }} />
            </motion.div>

            {/* Import Toast */}
            <AnimatePresence>
                {importingFile && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "fixed top-4 right-4 z-50 p-4 rounded-xl border backdrop-blur-sm flex items-center gap-3",
                            importingFile.status === 'importing' && "bg-blue-500/20 border-blue-500/50",
                            importingFile.status === 'success' && "bg-green-500/20 border-green-500/50",
                            importingFile.status === 'error' && "bg-red-500/20 border-red-500/50"
                        )}
                    >
                        {importingFile.status === 'importing' && <><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /><span className="text-blue-400">Importing...</span></>}
                        {importingFile.status === 'success' && <><Check className="w-5 h-5 text-green-400" /><span className="text-green-400">Imported!</span></>}
                        {importingFile.status === 'error' && <><X className="w-5 h-5 text-red-400" /><span className="text-red-400">{importingFile.error}</span></>}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            {!selectedChatId ? (
                // Chats List
                <div>
                    {chatsLoading && chats.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <motion.div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                        </div>
                    ) : chatsError ? (
                        <HUDPanel className="p-8 text-center border-red-500/50">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                            <p className="text-red-400">{chatsError}</p>
                        </HUDPanel>
                    ) : filteredChats.length === 0 ? (
                        <HUDPanel className="p-8 text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-cyan-600" />
                            <p className="text-cyan-400">No chats found</p>
                        </HUDPanel>
                    ) : (
                        <div className="grid gap-3">
                            {filteredChats.map((chat, index) => {
                                const Icon = chatTypeIcons[chat.type];
                                return (
                                    <motion.div key={chat.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                                        <HUDPanel
                                            className="p-4 cursor-pointer hover:border-cyan-400/50 transition-all"
                                            onClick={() => handleSelectChat(chat.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                                                    <Icon className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-cyan-200 truncate">{chat.title}</p>
                                                        <HUDBadge className="capitalize">{chat.type}</HUDBadge>
                                                    </div>
                                                    {chat.lastMessage && <p className="text-sm text-cyan-600 truncate">{chat.lastMessage}</p>}
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-cyan-600" />
                                            </div>
                                        </HUDPanel>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                // Messages List
                <div className="space-y-4">
                    {/* Filter tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {FILE_TYPE_TABS.map((tab) => {
                            const count = tab.value === 'all' ? fileCounts.total : fileCounts[tab.value];
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => handleFilterChange(tab.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border",
                                        fileTypeFilter === tab.value
                                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                                            : "border-cyan-500/30 text-cyan-600 hover:border-cyan-500/50"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {count > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/30">{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Messages */}
                    {messagesLoading && messages.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <motion.div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                        </div>
                    ) : messagesError ? (
                        <HUDPanel className="p-8 text-center border-red-500/50">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                            <p className="text-red-400">{messagesError}</p>
                        </HUDPanel>
                    ) : messages.length === 0 ? (
                        <HUDPanel className="p-8 text-center">
                            <FileIcon className="w-12 h-12 mx-auto mb-4 text-cyan-600" />
                            <p className="text-cyan-400">No files found</p>
                        </HUDPanel>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message, index) => {
                                const Icon = getMediaIcon(message);
                                const fileInfo = getFileInfo(message);
                                const isImporting = importingFile?.messageId === message.id && importingFile?.status === 'importing';
                                return (
                                    <motion.div key={message.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}>
                                        <HUDPanel className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                                    <Icon className="w-6 h-6 text-cyan-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-cyan-200 truncate">{fileInfo?.name || 'Unknown'}</p>
                                                    <div className="flex items-center gap-2 text-xs text-cyan-600">
                                                        <span>{formatFileSize(fileInfo?.size || 0)}</span>
                                                        <span>•</span>
                                                        <span>{formatDate(message.date)}</span>
                                                        {message.hasVideo && <><span>•</span><span className="text-blue-400">Video</span></>}
                                                        {message.hasAudio && <><span>•</span><span className="text-purple-400">Audio</span></>}
                                                    </div>
                                                </div>
                                                <HUDButton
                                                    variant="primary"
                                                    onClick={() => handleImportClick(message)}
                                                    disabled={isImporting}
                                                    className="px-4"
                                                >
                                                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-2" />Import</>}
                                                </HUDButton>
                                            </div>
                                        </HUDPanel>
                                    </motion.div>
                                );
                            })}
                            {hasMoreMessages && (
                                <div className="text-center pt-4">
                                    <HUDButton onClick={handleLoadMore} disabled={messagesLoading}>
                                        {messagesLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Load More
                                    </HUDButton>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Folder Dialog */}
            {showFolderDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <HUDPanel className="p-6 w-full max-w-md" glow>
                        <h2 className="text-xl font-bold text-cyan-400 mb-4">Import to TAAS</h2>
                        {selectedMessage && (
                            <div className="mb-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                                <p className="font-medium text-cyan-200">{getFileInfo(selectedMessage)?.name}</p>
                                <p className="text-xs text-cyan-600">{formatFileSize(getFileInfo(selectedMessage)?.size || 0)}</p>
                            </div>
                        )}
                        <p className="text-sm text-cyan-600 mb-3">Select destination folder:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            <button
                                onClick={() => setSelectedFolderId(undefined)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all border",
                                    !selectedFolderId ? "bg-cyan-500/20 border-cyan-500/50" : "border-cyan-500/20 hover:border-cyan-500/40"
                                )}
                            >
                                <FolderOpen className="w-5 h-5 text-cyan-500" />
                                <span className="text-cyan-200">Root (My Files)</span>
                            </button>
                            {folders.map((folder) => (
                                <button
                                    key={folder.id}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all border",
                                        selectedFolderId === folder.id ? "bg-cyan-500/20 border-cyan-500/50" : "border-cyan-500/20 hover:border-cyan-500/40"
                                    )}
                                >
                                    <FolderOpen className="w-5 h-5 text-cyan-400" />
                                    <span className="text-cyan-200">{folder.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <HUDButton onClick={() => setShowFolderDialog(false)}>Cancel</HUDButton>
                            <HUDButton variant="primary" onClick={handleImportConfirm}>
                                <Download className="w-4 h-4 mr-2" />Import
                            </HUDButton>
                        </div>
                    </HUDPanel>
                </div>
            )}
        </HUDLayout>
    );
}
