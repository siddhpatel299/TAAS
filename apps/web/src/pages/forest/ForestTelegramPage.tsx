import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Megaphone, User, ArrowLeft, Download, FileText, Image, Video, Loader2, RefreshCw, Check, X, ChevronRight, FolderOpen, Music, Search } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestButton, ForestBadge, ForestEmpty } from '@/components/forest/ForestComponents';
import { useTelegramStore, TelegramMessage, FileTypeFilter } from '@/stores/telegram.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { cn, formatFileSize, formatDate } from '@/lib/utils';

const chatTypeIcons = { user: User, group: Users, supergroup: Users, channel: Megaphone };

function getFileIcon(message: TelegramMessage) {
    if (message.hasVideo) return Video;
    if (message.hasPhoto) return Image;
    if (message.hasAudio) return Music;
    return FileText;
}

function getFileInfo(message: TelegramMessage) {
    if (message.hasDocument && message.document) return { name: message.document.fileName, size: message.document.size };
    if (message.hasVideo && message.video) return { name: message.video.fileName, size: message.video.size };
    if (message.hasPhoto && message.photo) return { name: `photo_${message.id}.jpg`, size: message.photo.size };
    if (message.hasAudio && message.audio) return { name: message.audio.fileName || 'audio', size: message.audio.size };
    return null;
}

const FILE_TABS: { value: FileTypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'video', label: 'Videos' },
    { value: 'photo', label: 'Photos' },
    { value: 'document', label: 'Documents' },
    { value: 'audio', label: 'Audio' },
];

export function ForestTelegramPage() {
    const {
        chats, chatsLoading, chatsError, selectedChatId, messages, messagesLoading, messagesError,
        hasMoreMessages, importingFile, fileTypeFilter,
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
        return chats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));
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
            const params: any = { limit: 50, offsetId, filesOnly: true };
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
            updateImportStatus('success', undefined, response.data.data?.fileId);
            setTimeout(() => setImportingFile(null), 3000);
        } catch (error: any) {
            updateImportStatus('error', error.response?.data?.error || 'Failed to import');
            setTimeout(() => setImportingFile(null), 5000);
        }
        setSelectedMessage(null);
    };

    const selectedChat = chats.find(c => c.id === selectedChatId);

    return (
        <ForestLayout>
            <ForestPageHeader
                title={selectedChat ? selectedChat.title : 'Telegram Import'}
                subtitle={selectedChatId ? 'Select a file to import' : 'Browse your Telegram chats'}
                icon={<MessageSquare className="w-6 h-6" />}
                actions={
                    <div className="flex items-center gap-2">
                        {selectedChatId && (
                            <ForestButton onClick={() => selectChat(null)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</ForestButton>
                        )}
                        {!selectedChatId && (
                            <ForestButton onClick={loadChats} disabled={chatsLoading}>
                                <RefreshCw className={cn("w-4 h-4 mr-2", chatsLoading && "animate-spin")} /> Refresh
                            </ForestButton>
                        )}
                    </div>
                }
            />

            {/* Import Toast */}
            <AnimatePresence>
                {importingFile && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "fixed top-20 right-4 z-50 p-4 rounded-xl flex items-center gap-3",
                            importingFile.status === 'importing' && "bg-white border border-[var(--forest-leaf)]",
                            importingFile.status === 'success' && "bg-[rgba(104,180,104,0.1)] border border-[var(--forest-success)]",
                            importingFile.status === 'error' && "bg-[rgba(196,92,92,0.1)] border border-[var(--forest-danger)]"
                        )}
                    >
                        {importingFile.status === 'importing' && <Loader2 className="w-5 h-5 text-[var(--forest-leaf)] animate-spin" />}
                        {importingFile.status === 'success' && <Check className="w-5 h-5 text-[var(--forest-success)]" />}
                        {importingFile.status === 'error' && <X className="w-5 h-5 text-[var(--forest-danger)]" />}
                        <span className="text-[var(--forest-moss)]">
                            {importingFile.status === 'importing' && 'Importing...'}
                            {importingFile.status === 'success' && 'Imported!'}
                            {importingFile.status === 'error' && importingFile.error}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search */}
            {!selectedChatId && (
                <div className="relative max-w-md mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--forest-wood)]" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="forest-input pl-10"
                    />
                </div>
            )}

            {/* Content */}
            {!selectedChatId ? (
                // Chats
                chatsLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                    </div>
                ) : chatsError ? (
                    <ForestCard><p className="text-[var(--forest-danger)]">{chatsError}</p></ForestCard>
                ) : filteredChats.length === 0 ? (
                    <ForestCard><ForestEmpty icon={<MessageSquare className="w-full h-full" />} title="No chats found" /></ForestCard>
                ) : (
                    <div className="space-y-3">
                        {filteredChats.map((chat, index) => {
                            const Icon = chatTypeIcons[chat.type];
                            return (
                                <motion.div key={chat.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                                    <ForestCard className="!p-4 cursor-pointer" onClick={() => handleSelectChat(chat.id)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[rgba(74,124,89,0.1)] flex items-center justify-center">
                                                <Icon className="w-6 h-6 text-[var(--forest-leaf)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-[var(--forest-moss)] truncate">{chat.title}</p>
                                                <ForestBadge className="capitalize">{chat.type}</ForestBadge>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-[var(--forest-wood)]" />
                                        </div>
                                    </ForestCard>
                                </motion.div>
                            );
                        })}
                    </div>
                )
            ) : (
                // Messages
                <div>
                    {/* File type tabs */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                        {FILE_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => { setFileTypeFilter(tab.value); loadMessages(selectedChatId, undefined, tab.value); }}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                    fileTypeFilter === tab.value
                                        ? "bg-[var(--forest-gradient-primary)] text-white"
                                        : "bg-[rgba(74,124,89,0.1)] text-[var(--forest-moss)]"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {messagesLoading && messages.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                        </div>
                    ) : messagesError ? (
                        <ForestCard><p className="text-[var(--forest-danger)]">{messagesError}</p></ForestCard>
                    ) : messages.length === 0 ? (
                        <ForestCard><ForestEmpty icon={<FileText className="w-full h-full" />} title="No files found" /></ForestCard>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message, index) => {
                                const FileIcon = getFileIcon(message);
                                const fileInfo = getFileInfo(message);
                                const isImporting = importingFile?.messageId === message.id;
                                return (
                                    <motion.div key={message.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}>
                                        <ForestCard className="!p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="forest-file-icon">
                                                    <FileIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[var(--forest-moss)] truncate">{fileInfo?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-[var(--forest-wood)]">
                                                        {formatFileSize(fileInfo?.size || 0)} • {formatDate(message.date)}
                                                    </p>
                                                </div>
                                                <ForestButton variant="primary" onClick={() => handleImportClick(message)} disabled={isImporting}>
                                                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-2" /> Import</>}
                                                </ForestButton>
                                            </div>
                                        </ForestCard>
                                    </motion.div>
                                );
                            })}
                            {hasMoreMessages && (
                                <div className="text-center pt-4">
                                    <ForestButton onClick={() => loadMessages(selectedChatId, messages[messages.length - 1].id, fileTypeFilter)} disabled={messagesLoading}>
                                        {messagesLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Load More
                                    </ForestButton>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Folder Dialog */}
            {showFolderDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <ForestCard className="w-full max-w-md p-6">
                        <h2 className="text-lg font-semibold text-[var(--forest-moss)] mb-4">Import to TAAS</h2>
                        {selectedMessage && (
                            <div className="mb-4 p-3 rounded-lg bg-[rgba(74,124,89,0.05)]">
                                <p className="font-medium text-[var(--forest-moss)]">{getFileInfo(selectedMessage)?.name}</p>
                                <p className="text-xs text-[var(--forest-wood)]">{formatFileSize(getFileInfo(selectedMessage)?.size || 0)}</p>
                            </div>
                        )}
                        <p className="text-sm text-[var(--forest-wood)] mb-3">Select destination:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            <button
                                onClick={() => setSelectedFolderId(undefined)}
                                className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all", !selectedFolderId ? "bg-[rgba(74,124,89,0.1)]" : "hover:bg-[rgba(74,124,89,0.05)]")}
                            >
                                <FolderOpen className="w-5 h-5 text-[var(--forest-leaf)]" />
                                <span className="text-[var(--forest-moss)]">Root (My Files)</span>
                            </button>
                            {folders.map((folder) => (
                                <button
                                    key={folder.id}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all", selectedFolderId === folder.id ? "bg-[rgba(74,124,89,0.1)]" : "hover:bg-[rgba(74,124,89,0.05)]")}
                                >
                                    <FolderOpen className="w-5 h-5 text-[var(--forest-wood)]" />
                                    <span className="text-[var(--forest-moss)]">{folder.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <ForestButton onClick={() => setShowFolderDialog(false)}>Cancel</ForestButton>
                            <ForestButton variant="primary" onClick={handleImportConfirm}><Download className="w-4 h-4 mr-2" /> Import</ForestButton>
                        </div>
                    </ForestCard>
                </div>
            )}
        </ForestLayout>
    );
}
