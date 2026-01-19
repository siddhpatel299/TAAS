import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MessageSquare, Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, Search, Play, ChevronDown } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalFileRow, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { useTelegramStore, TelegramMessage, FileTypeFilter } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

const FILE_TYPE_TABS: { value: FileTypeFilter; label: string }[] = [
    { value: 'all', label: 'ALL' }, { value: 'video', label: 'VIDEO' }, { value: 'photo', label: 'PHOTO' }, { value: 'document', label: 'DOC' }, { value: 'audio', label: 'AUDIO' },
];

function getMessageMediaType(msg: TelegramMessage): string {
    if (msg.hasVideo) return 'video';
    if (msg.hasPhoto) return 'photo';
    if (msg.hasAudio) return 'audio';
    if (msg.hasDocument) return 'document';
    return 'text';
}

function getMessageFileName(msg: TelegramMessage): string {
    if (msg.document) return msg.document.fileName;
    if (msg.video) return msg.video.fileName;
    if (msg.audio) return msg.audio.fileName || msg.audio.title || 'Audio';
    if (msg.hasPhoto) return 'Photo';
    return msg.text?.slice(0, 30) || 'Message';
}

function getMessageFileSize(msg: TelegramMessage): number | undefined {
    if (msg.document) return msg.document.size;
    if (msg.video) return msg.video.size;
    if (msg.audio) return msg.audio.size;
    if (msg.photo) return msg.photo.size;
    return undefined;
}

function getFileIcon(type: string) {
    if (type === 'video') return Video;
    if (type === 'photo') return Image;
    if (type === 'audio') return Music;
    return FileText;
}

export function TerminalTelegramPage() {
    const {
        chats, chatsLoading, selectedChatId, messages, messagesLoading, hasMoreMessages, fileTypeFilter, importingFile,
        setChats, setChatsLoading, selectChat, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages,
        setFileTypeFilter, setImportingFile, updateImportStatus
    } = useTelegramStore();
    const { folders, setFolders } = useFilesStore();

    const [showImport, setShowImport] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<TelegramMessage | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    // New features
    const [chatSearch, setChatSearch] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewMessage, setPreviewMessage] = useState<TelegramMessage | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const loadChats = useCallback(async () => {
        setChatsLoading(true);
        try {
            const res = await telegramApi.getChats();
            setChats(res.data?.data || []);
        } catch (e) { console.error(e); }
        finally { setChatsLoading(false); }
    }, [setChats, setChatsLoading]);

    const loadMessages = useCallback(async (chatId: string, offsetId?: number) => {
        setMessagesLoading(true);
        try {
            const params: { limit: number; offsetId?: number; filesOnly: boolean; fileType?: 'video' | 'photo' | 'document' | 'audio' } = {
                limit: 50,
                offsetId,
                filesOnly: true,
            };
            if (fileTypeFilter && fileTypeFilter !== 'all') {
                params.fileType = fileTypeFilter;
            }
            const res = await telegramApi.getChatMessages(chatId, params);
            if (offsetId) {
                appendMessages(res.data?.data || []);
            } else {
                setMessages(res.data?.data || []);
            }
            setHasMoreMessages(res.data?.meta?.hasMore || false);
        } catch (e) { console.error(e); }
        finally { setMessagesLoading(false); }
    }, [fileTypeFilter, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages]);

    const loadFolders = useCallback(async () => {
        try { const res = await foldersApi.getFolders(); setFolders(res.data?.data || []); }
        catch (e) { console.error(e); }
    }, [setFolders]);

    useEffect(() => { loadChats(); loadFolders(); }, [loadChats, loadFolders]);
    useEffect(() => { if (selectedChatId) loadMessages(selectedChatId); }, [selectedChatId, fileTypeFilter, loadMessages]);

    const handleLoadMore = () => {
        if (selectedChatId && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            loadMessages(selectedChatId, lastMessage.id);
        }
    };

    const handleImport = async () => {
        if (!selectedMessage || !selectedChatId) return;
        setImporting(true);
        try {
            const response = await telegramApi.importFile(selectedChatId, selectedMessage.id, selectedFolder || undefined);

            if (response.data.deferred && response.data.importId) {
                // Deferred import - poll for status
                setImportingFile({
                    chatId: selectedChatId,
                    messageId: selectedMessage.id,
                    fileName: getMessageFileName(selectedMessage),
                    status: 'importing',
                });

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
                        const statusRes = await telegramApi.getImportStatus(importId);
                        const imp = statusRes.data.data;
                        if (imp.status === 'completed') {
                            clearInterval(pollInterval);
                            updateImportStatus('success', undefined, imp.result?.fileId);
                            setTimeout(() => setImportingFile(null), 3000);
                        } else if (imp.status === 'failed' || imp.status === 'aborted') {
                            clearInterval(pollInterval);
                            updateImportStatus('error', imp.error || 'Import failed');
                            setTimeout(() => setImportingFile(null), 5000);
                        }
                    } catch (err: any) {
                        if (err.response?.status === 404) {
                            clearInterval(pollInterval);
                            updateImportStatus('error', 'Import expired.');
                            setTimeout(() => setImportingFile(null), 5000);
                        }
                    }
                }, 3000);
            } else {
                updateImportStatus('success');
                setTimeout(() => setImportingFile(null), 3000);
            }

            setShowImport(false);
            setSelectedMessage(null);
        } catch (e) { console.error(e); }
        finally { setImporting(false); }
    };

    const handlePreview = (msg: TelegramMessage) => {
        setPreviewMessage(msg);
        setShowPreview(true);
    };

    const selectedChat = chats.find(c => c.id === selectedChatId);
    const getChatIcon = (type: string) => type === 'group' ? Users : type === 'channel' ? Megaphone : User;

    // Filter chats by search
    const filteredChats = useMemo(() => {
        if (!chatSearch.trim()) return chats;
        return chats.filter(c => c.title.toLowerCase().includes(chatSearch.toLowerCase()));
    }, [chats, chatSearch]);

    // Get stream URL for preview
    const getStreamUrl = (chatId: string, messageId: number) => {
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        return `${baseUrl}/telegram/chats/${chatId}/messages/${messageId}/stream?token=${token}`;
    };

    return (
        <TerminalLayout>
            <TerminalHeader title="Telegram" subtitle="Import files from Telegram" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: 'calc(100vh - 180px)' }}>
                {/* Chats */}
                <TerminalPanel title="Chats" className="overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--terminal-border)]">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--terminal-text-dim)]" />
                            <input type="text" placeholder="Filter..." value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} className="terminal-input pl-7 !py-1 !text-xs w-full" />
                        </div>
                        <button onClick={loadChats} className="p-1 text-[var(--terminal-text-dim)] hover:text-[var(--terminal-amber)]"><RefreshCw className={cn("w-3 h-3", chatsLoading && "animate-spin")} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {chatsLoading && filteredChats.length === 0 ? <Loader2 className="w-4 h-4 text-[var(--terminal-amber)] animate-spin mx-auto mt-8" /> : filteredChats.map(chat => {
                            const Icon = getChatIcon(chat.type);
                            return (
                                <button key={chat.id} onClick={() => selectChat(chat.id)} className={cn("w-full text-left p-2 text-xs border-b border-[var(--terminal-border)] flex items-center gap-2", selectedChatId === chat.id ? "bg-[rgba(255,176,0,0.1)] text-[var(--terminal-amber)]" : "hover:bg-[var(--terminal-dark)]")}>
                                    <Icon className="w-3 h-3" />
                                    <span className="truncate">{chat.title}</span>
                                </button>
                            );
                        })}
                        {!chatsLoading && filteredChats.length === 0 && <p className="text-xs text-center text-[var(--terminal-text-dim)] mt-4">No chats found</p>}
                    </div>
                </TerminalPanel>

                {/* Messages */}
                <div className="lg:col-span-3">
                    <TerminalPanel title={selectedChat?.title || 'SELECT CHAT'} className="h-full overflow-hidden flex flex-col">
                        {selectedChatId && (
                            <div className="flex items-center gap-1 mb-2 pb-2 border-b border-[var(--terminal-border)]">
                                {FILE_TYPE_TABS.map(tab => (
                                    <button key={tab.value} onClick={() => setFileTypeFilter(tab.value)} className={cn("px-2 py-1 text-[10px]", fileTypeFilter === tab.value ? "bg-[var(--terminal-amber)] text-black" : "bg-[var(--terminal-dark)] border border-[var(--terminal-border)]")}>{tab.label}</button>
                                ))}
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            {!selectedChatId ? <TerminalEmpty icon={<MessageSquare className="w-full h-full" />} text="Select a chat" /> :
                                messagesLoading && messages.length === 0 ? <Loader2 className="w-4 h-4 text-[var(--terminal-amber)] animate-spin mx-auto mt-8" /> :
                                    messages.length === 0 ? <TerminalEmpty icon={<FileText className="w-full h-full" />} text="No files" /> :
                                        <>
                                            {messages.map(msg => {
                                                const mediaType = getMessageMediaType(msg);
                                                const Icon = getFileIcon(mediaType);
                                                const fileName = getMessageFileName(msg);
                                                const fileSize = getMessageFileSize(msg);
                                                const canPreview = mediaType === 'video' || mediaType === 'audio';

                                                return (
                                                    <TerminalFileRow
                                                        key={msg.id}
                                                        icon={<Icon className="w-4 h-4" />}
                                                        name={fileName}
                                                        meta={fileSize ? formatFileSize(fileSize) : undefined}
                                                        actions={
                                                            <div className="flex items-center gap-1">
                                                                {canPreview && (
                                                                    <TerminalButton onClick={() => handlePreview(msg)}><Play className="w-3 h-3" /></TerminalButton>
                                                                )}
                                                                <TerminalButton onClick={() => { setSelectedMessage(msg); setShowImport(true); }}><Download className="w-3 h-3" /></TerminalButton>
                                                            </div>
                                                        }
                                                    />
                                                );
                                            })}

                                            {/* Load More */}
                                            {hasMoreMessages && (
                                                <div className="p-2 text-center border-t border-[var(--terminal-border)]">
                                                    <TerminalButton onClick={handleLoadMore} disabled={messagesLoading}>
                                                        {messagesLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                                                        Load More
                                                    </TerminalButton>
                                                </div>
                                            )}
                                        </>
                            }
                        </div>

                        {/* Import Status */}
                        {importingFile && (
                            <div className="p-2 border-t border-[var(--terminal-border)] text-xs">
                                <span className={cn(importingFile.status === 'error' ? 'text-[var(--terminal-red)]' : importingFile.status === 'success' ? 'text-[var(--terminal-green)]' : 'text-[var(--terminal-amber)]')}>
                                    {importingFile.status === 'importing' && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
                                    {importingFile.status === 'success' ? '✓ Imported' : importingFile.status === 'error' ? '✗ Failed' : 'Importing...'} {importingFile.fileName}
                                </span>
                            </div>
                        )}
                    </TerminalPanel>
                </div>
            </div>

            {/* Import Dialog */}
            {showImport && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <TerminalPanel title="Import File" className="w-full max-w-md">
                        <p className="text-xs mb-4">File: <span className="text-[var(--terminal-amber)]">{selectedMessage && getMessageFileName(selectedMessage)}</span></p>
                        <div className="mb-4">
                            <label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">Select Folder</label>
                            <div className="max-h-40 overflow-y-auto border border-[var(--terminal-border)]">
                                <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-2 text-xs border-b border-[var(--terminal-border)] flex items-center gap-2", !selectedFolder ? "bg-[rgba(255,176,0,0.1)] text-[var(--terminal-amber)]" : "hover:bg-[var(--terminal-dark)]")}>
                                    <FolderOpen className="w-3 h-3" /> Root
                                </button>
                                {folders.map((f: Folder) => (
                                    <button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-2 text-xs border-b border-[var(--terminal-border)] flex items-center gap-2", selectedFolder === f.id ? "bg-[rgba(255,176,0,0.1)] text-[var(--terminal-amber)]" : "hover:bg-[var(--terminal-dark)]")}>
                                        <FolderOpen className="w-3 h-3" /> {f.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <TerminalButton onClick={() => setShowImport(false)}>Cancel</TerminalButton>
                            <TerminalButton variant="primary" onClick={handleImport} disabled={importing}>
                                {importing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />} Import
                            </TerminalButton>
                        </div>
                    </TerminalPanel>
                </div>
            )}

            {/* Preview Dialog */}
            {showPreview && previewMessage && selectedChatId && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
                    <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <TerminalPanel title={getMessageFileName(previewMessage)} actions={<TerminalButton onClick={() => setShowPreview(false)}>Close</TerminalButton>}>
                            <div className="aspect-video bg-black flex items-center justify-center">
                                {getMessageMediaType(previewMessage) === 'video' ? (
                                    <video
                                        ref={videoRef}
                                        src={getStreamUrl(selectedChatId, previewMessage.id)}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-full"
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                ) : (
                                    <audio
                                        ref={audioRef}
                                        src={getStreamUrl(selectedChatId, previewMessage.id)}
                                        controls
                                        autoPlay
                                        className="w-full"
                                    >
                                        Your browser does not support audio playback.
                                    </audio>
                                )}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <TerminalButton variant="primary" onClick={() => { setSelectedMessage(previewMessage); setShowPreview(false); setShowImport(true); }}>
                                    <Download className="w-3 h-3 mr-1" /> Import
                                </TerminalButton>
                            </div>
                        </TerminalPanel>
                    </div>
                </div>
            )}
        </TerminalLayout>
    );
}
