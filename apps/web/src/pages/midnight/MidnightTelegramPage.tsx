import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MessageSquare, Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, Search, Play, ChevronDown } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton, MidnightFileRow, MidnightEmpty, MidnightModal, MidnightInput } from '@/components/midnight/MidnightComponents';
import { useTelegramStore, TelegramMessage, FileTypeFilter } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

const FILE_TYPE_TABS: { value: FileTypeFilter; label: string }[] = [
    { value: 'all', label: 'All' }, { value: 'video', label: 'Videos' }, { value: 'photo', label: 'Photos' }, { value: 'document', label: 'Documents' }, { value: 'audio', label: 'Audio' },
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

export function MidnightTelegramPage() {
    const { chats, chatsLoading, selectedChatId, messages, messagesLoading, hasMoreMessages, fileTypeFilter, importingFile, setChats, setChatsLoading, selectChat, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages, setFileTypeFilter, setImportingFile, updateImportStatus } = useTelegramStore();
    const { folders, setFolders } = useFilesStore();

    const [showImport, setShowImport] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<TelegramMessage | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [chatSearch, setChatSearch] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewMessage, setPreviewMessage] = useState<TelegramMessage | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

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
            const params: { limit: number; offsetId?: number; filesOnly: boolean; fileType?: 'video' | 'photo' | 'document' | 'audio' } = { limit: 50, offsetId, filesOnly: true };
            if (fileTypeFilter && fileTypeFilter !== 'all') params.fileType = fileTypeFilter;
            const res = await telegramApi.getChatMessages(chatId, params);
            if (offsetId) appendMessages(res.data?.data || []);
            else setMessages(res.data?.data || []);
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

    const handleLoadMore = () => { if (selectedChatId && messages.length > 0) loadMessages(selectedChatId, messages[messages.length - 1].id); };

    const handleImport = async () => {
        if (!selectedMessage || !selectedChatId) return;
        setImporting(true);
        try {
            const response = await telegramApi.importFile(selectedChatId, selectedMessage.id, selectedFolder || undefined);
            if (response.data.deferred && response.data.importId) {
                setImportingFile({ chatId: selectedChatId, messageId: selectedMessage.id, fileName: getMessageFileName(selectedMessage), status: 'importing' });
                const importId = response.data.importId;
                let pollCount = 0;
                const pollInterval = setInterval(async () => {
                    pollCount++;
                    if (pollCount >= 100) { clearInterval(pollInterval); updateImportStatus('error', 'Import timeout'); setTimeout(() => setImportingFile(null), 5000); return; }
                    try {
                        const statusRes = await telegramApi.getImportStatus(importId);
                        const imp = statusRes.data.data;
                        if (imp.status === 'completed') { clearInterval(pollInterval); updateImportStatus('success', undefined, imp.result?.fileId); setTimeout(() => setImportingFile(null), 3000); }
                        else if (imp.status === 'failed' || imp.status === 'aborted') { clearInterval(pollInterval); updateImportStatus('error', imp.error || 'Import failed'); setTimeout(() => setImportingFile(null), 5000); }
                    } catch (err: any) { if (err.response?.status === 404) { clearInterval(pollInterval); updateImportStatus('error', 'Import expired'); setTimeout(() => setImportingFile(null), 5000); } }
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

    const handlePreview = (msg: TelegramMessage) => { setPreviewMessage(msg); setShowPreview(true); };
    const selectedChat = chats.find(c => c.id === selectedChatId);
    const getChatIcon = (type: string) => type === 'group' ? Users : type === 'channel' ? Megaphone : User;
    const filteredChats = useMemo(() => !chatSearch.trim() ? chats : chats.filter(c => c.title.toLowerCase().includes(chatSearch.toLowerCase())), [chats, chatSearch]);

    const getStreamUrl = (chatId: string, messageId: number) => {
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        return `${baseUrl}/telegram/chats/${chatId}/messages/${messageId}/stream?token=${token}`;
    };

    return (
        <MidnightLayout>
            <MidnightHeader title="Telegram" subtitle="Import files from your Telegram chats" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Chats */}
                <MidnightCard className="!p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-[var(--midnight-border)]">
                        <MidnightInput value={chatSearch} onChange={setChatSearch} placeholder="Search chats..." icon={<Search className="w-4 h-4" />} />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {chatsLoading && filteredChats.length === 0 ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-[var(--midnight-gold)] animate-spin mx-auto" /></div> : filteredChats.map(chat => {
                            const Icon = getChatIcon(chat.type);
                            return (
                                <button key={chat.id} onClick={() => selectChat(chat.id)} className={cn("w-full text-left p-4 border-b border-[var(--midnight-border)] flex items-center gap-3", selectedChatId === chat.id ? "bg-[rgba(212,175,55,0.1)]" : "hover:bg-[var(--midnight-surface-hover)]")}>
                                    <Icon className={cn("w-5 h-5", selectedChatId === chat.id ? "text-[var(--midnight-gold)]" : "text-[var(--midnight-text-dim)]")} />
                                    <span className={cn("truncate font-medium", selectedChatId === chat.id && "text-[var(--midnight-gold)]")}>{chat.title}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-3 border-t border-[var(--midnight-border)]">
                        <MidnightButton onClick={loadChats} className="w-full"><RefreshCw className={cn("w-4 h-4 mr-2", chatsLoading && "animate-spin")} /> Refresh</MidnightButton>
                    </div>
                </MidnightCard>

                {/* Messages */}
                <div className="lg:col-span-3">
                    <MidnightCard className="h-full !p-0 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[var(--midnight-border)] flex items-center justify-between">
                            <h3 className="font-semibold">{selectedChat?.title || 'Select a chat'}</h3>
                            {selectedChatId && (
                                <div className="flex items-center gap-2">
                                    {FILE_TYPE_TABS.map(tab => (
                                        <button key={tab.value} onClick={() => setFileTypeFilter(tab.value)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", fileTypeFilter === tab.value ? "bg-[var(--midnight-gold)] text-[var(--midnight-bg)]" : "bg-[var(--midnight-surface)] text-[var(--midnight-text-dim)]")}>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {!selectedChatId ? <MidnightEmpty icon={<MessageSquare className="w-8 h-8" />} text="Select a chat to view files" /> :
                                messagesLoading && messages.length === 0 ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-[var(--midnight-gold)] animate-spin mx-auto" /></div> :
                                    messages.length === 0 ? <MidnightEmpty icon={<FileText className="w-8 h-8" />} text="No files in this chat" /> :
                                        <>
                                            {messages.map(msg => {
                                                const mediaType = getMessageMediaType(msg);
                                                const Icon = getFileIcon(mediaType);
                                                const fileName = getMessageFileName(msg);
                                                const fileSize = getMessageFileSize(msg);
                                                const canPreview = mediaType === 'video' || mediaType === 'audio';
                                                return (
                                                    <MidnightFileRow key={msg.id} icon={<Icon className="w-5 h-5" />} name={fileName} meta={fileSize ? formatFileSize(fileSize) : undefined} actions={
                                                        <div className="flex items-center gap-2">
                                                            {canPreview && <MidnightButton variant="ghost" onClick={() => handlePreview(msg)}><Play className="w-4 h-4" /></MidnightButton>}
                                                            <MidnightButton variant="primary" onClick={() => { setSelectedMessage(msg); setShowImport(true); }}><Download className="w-4 h-4" /></MidnightButton>
                                                        </div>
                                                    } />
                                                );
                                            })}
                                            {hasMoreMessages && (
                                                <div className="p-4 text-center">
                                                    <MidnightButton onClick={handleLoadMore} disabled={messagesLoading}>{messagesLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />} Load More</MidnightButton>
                                                </div>
                                            )}
                                        </>
                            }
                        </div>
                        {importingFile && (
                            <div className="p-4 border-t border-[var(--midnight-border)]">
                                <span className={cn("text-sm", importingFile.status === 'error' ? 'text-[var(--midnight-error)]' : importingFile.status === 'success' ? 'text-[var(--midnight-success)]' : 'text-[var(--midnight-gold)]')}>
                                    {importingFile.status === 'importing' && <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />}
                                    {importingFile.status === 'success' ? '✓ Imported' : importingFile.status === 'error' ? '✗ Failed' : 'Importing...'} {importingFile.fileName}
                                </span>
                            </div>
                        )}
                    </MidnightCard>
                </div>
            </div>

            {/* Import Dialog */}
            <MidnightModal open={showImport} onClose={() => setShowImport(false)} title="Import File" footer={
                <>
                    <MidnightButton onClick={() => setShowImport(false)}>Cancel</MidnightButton>
                    <MidnightButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Import</MidnightButton>
                </>
            }>
                <p className="text-sm text-[var(--midnight-text-dim)] mb-4">File: <span className="text-[var(--midnight-gold)]">{selectedMessage && getMessageFileName(selectedMessage)}</span></p>
                <label className="block text-sm font-medium mb-2">Select folder</label>
                <div className="max-h-48 overflow-y-auto border border-[var(--midnight-border)] rounded-lg">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b border-[var(--midnight-border)] flex items-center gap-3", !selectedFolder ? "bg-[rgba(212,175,55,0.1)] text-[var(--midnight-gold)]" : "hover:bg-[var(--midnight-surface-hover)]")}>
                        <FolderOpen className="w-4 h-4" /> Root
                    </button>
                    {folders.map((f: Folder) => (
                        <button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--midnight-border)] flex items-center gap-3", selectedFolder === f.id ? "bg-[rgba(212,175,55,0.1)] text-[var(--midnight-gold)]" : "hover:bg-[var(--midnight-surface-hover)]")}>
                            <FolderOpen className="w-4 h-4" /> {f.name}
                        </button>
                    ))}
                </div>
            </MidnightModal>

            {/* Preview Dialog */}
            {showPreview && previewMessage && selectedChatId && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8" onClick={() => setShowPreview(false)}>
                    <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        <MidnightCard>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">{getMessageFileName(previewMessage)}</h3>
                                <MidnightButton onClick={() => setShowPreview(false)}>Close</MidnightButton>
                            </div>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                {getMessageMediaType(previewMessage) === 'video' ? (
                                    <video ref={videoRef} src={getStreamUrl(selectedChatId, previewMessage.id)} controls autoPlay className="w-full h-full" />
                                ) : (
                                    <audio src={getStreamUrl(selectedChatId, previewMessage.id)} controls autoPlay className="w-full mt-20" />
                                )}
                            </div>
                            <div className="mt-4 text-right">
                                <MidnightButton variant="primary" onClick={() => { setSelectedMessage(previewMessage); setShowPreview(false); setShowImport(true); }}><Download className="w-4 h-4 mr-2" /> Import</MidnightButton>
                            </div>
                        </MidnightCard>
                    </div>
                </div>
            )}
        </MidnightLayout>
    );
}
