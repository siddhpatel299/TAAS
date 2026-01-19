import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalFileRow, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { useTelegramStore, TelegramMessage, FileTypeFilter } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi, api } from '@/lib/api';
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
    const { chats, chatsLoading, selectedChatId, messages, messagesLoading, fileTypeFilter, setChats, setChatsLoading, selectChat, setMessages, setMessagesLoading, setFileTypeFilter } = useTelegramStore();
    const { folders, setFolders } = useFilesStore();
    const [showImport, setShowImport] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<TelegramMessage | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    const loadChats = useCallback(async () => {
        setChatsLoading(true);
        try {
            const res = await telegramApi.getChats();
            setChats(res.data?.data || []);
        } catch (e) { console.error(e); }
        finally { setChatsLoading(false); }
    }, [setChats, setChatsLoading]);

    const loadMessages = useCallback(async (chatId: string) => {
        setMessagesLoading(true);
        try {
            const res = await telegramApi.getChatMessages(chatId, { fileType: fileTypeFilter === 'all' ? undefined : fileTypeFilter });
            setMessages(res.data?.data || []);
        } catch (e) { console.error(e); }
        finally { setMessagesLoading(false); }
    }, [fileTypeFilter, setMessages, setMessagesLoading]);

    const loadFolders = useCallback(async () => {
        try { const res = await foldersApi.getFolders(); setFolders(res.data?.data || []); }
        catch (e) { console.error(e); }
    }, [setFolders]);

    useEffect(() => { loadChats(); loadFolders(); }, [loadChats, loadFolders]);
    useEffect(() => { if (selectedChatId) loadMessages(selectedChatId); }, [selectedChatId, fileTypeFilter, loadMessages]);

    const handleImport = async () => {
        if (!selectedMessage) return;
        setImporting(true);
        try {
            await api.post('/telegram/import', { messageId: selectedMessage.id, chatId: selectedChatId, folderId: selectedFolder });
            setShowImport(false);
            setSelectedMessage(null);
        } catch (e) { console.error(e); }
        finally { setImporting(false); }
    };

    const selectedChat = chats.find(c => c.id === selectedChatId);
    const getChatIcon = (type: string) => type === 'group' ? Users : type === 'channel' ? Megaphone : User;

    return (
        <TerminalLayout>
            <TerminalHeader title="Telegram" subtitle="Import files from Telegram" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: 'calc(100vh - 180px)' }}>
                {/* Chats */}
                <TerminalPanel title="Chats" className="overflow-hidden flex flex-col">
                    <button onClick={loadChats} className="mb-2 text-xs text-[var(--terminal-text-dim)] hover:text-[var(--terminal-amber)]"><RefreshCw className={cn("w-3 h-3 inline mr-1", chatsLoading && "animate-spin")} />Refresh</button>
                    <div className="flex-1 overflow-y-auto">
                        {chatsLoading ? <Loader2 className="w-4 h-4 text-[var(--terminal-amber)] animate-spin mx-auto mt-8" /> : chats.map(chat => {
                            const Icon = getChatIcon(chat.type);
                            return (
                                <button key={chat.id} onClick={() => selectChat(chat.id)} className={cn("w-full text-left p-2 text-xs border-b border-[var(--terminal-border)] flex items-center gap-2", selectedChatId === chat.id ? "bg-[rgba(255,176,0,0.1)] text-[var(--terminal-amber)]" : "hover:bg-[var(--terminal-dark)]")}>
                                    <Icon className="w-3 h-3" />
                                    <span className="truncate">{chat.title}</span>
                                </button>
                            );
                        })}
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
                                messagesLoading ? <Loader2 className="w-4 h-4 text-[var(--terminal-amber)] animate-spin mx-auto mt-8" /> :
                                    messages.length === 0 ? <TerminalEmpty icon={<FileText className="w-full h-full" />} text="No files" /> :
                                        messages.map(msg => {
                                            const mediaType = getMessageMediaType(msg);
                                            const Icon = getFileIcon(mediaType);
                                            const fileName = getMessageFileName(msg);
                                            const fileSize = getMessageFileSize(msg);
                                            return (
                                                <TerminalFileRow
                                                    key={msg.id}
                                                    icon={<Icon className="w-4 h-4" />}
                                                    name={fileName}
                                                    meta={fileSize ? formatFileSize(fileSize) : undefined}
                                                    actions={<TerminalButton onClick={() => { setSelectedMessage(msg); setShowImport(true); }}><Download className="w-3 h-3 mr-1" /> Import</TerminalButton>}
                                                />
                                            );
                                        })}
                        </div>
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
        </TerminalLayout>
    );
}
