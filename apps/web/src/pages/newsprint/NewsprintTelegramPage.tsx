import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintButton, NewsprintEmpty, NewsprintModal } from '@/components/newsprint/NewsprintComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getMessageMediaType(msg: TelegramMessage): string { if (msg.hasVideo) return 'video'; if (msg.hasPhoto) return 'photo'; if (msg.hasAudio) return 'audio'; if (msg.hasDocument) return 'document'; return 'text'; }
function getMessageFileName(msg: TelegramMessage): string { if (msg.document) return msg.document.fileName; if (msg.video) return msg.video.fileName; if (msg.audio) return msg.audio.fileName || 'Audio'; if (msg.hasPhoto) return 'Photo'; return msg.text?.slice(0, 30) || 'Message'; }
function getMessageFileSize(msg: TelegramMessage): number | undefined { if (msg.document) return msg.document.size; if (msg.video) return msg.video.size; if (msg.audio) return msg.audio.size; return undefined; }

export function NewsprintTelegramPage() {
    const { chats, chatsLoading, selectedChatId, messages, messagesLoading, hasMoreMessages, fileTypeFilter, setChats, setChatsLoading, selectChat, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages, setFileTypeFilter, setImportingFile, updateImportStatus } = useTelegramStore();
    const { folders, setFolders } = useFilesStore();
    const [showImport, setShowImport] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<TelegramMessage | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    const loadChats = useCallback(async () => { setChatsLoading(true); try { const r = await telegramApi.getChats(); setChats(r.data?.data || []); } catch (e) { console.error(e); } finally { setChatsLoading(false); } }, [setChats, setChatsLoading]);
    const loadMessages = useCallback(async (chatId: string, offsetId?: number) => { setMessagesLoading(true); try { const params: any = { limit: 50, offsetId, filesOnly: true }; if (fileTypeFilter && fileTypeFilter !== 'all') params.fileType = fileTypeFilter; const r = await telegramApi.getChatMessages(chatId, params); if (offsetId) appendMessages(r.data?.data || []); else setMessages(r.data?.data || []); setHasMoreMessages(r.data?.meta?.hasMore || false); } catch (e) { console.error(e); } finally { setMessagesLoading(false); } }, [fileTypeFilter, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages]);
    const loadFolders = useCallback(async () => { try { const r = await foldersApi.getFolders(); setFolders(r.data?.data || []); } catch (e) { console.error(e); } }, [setFolders]);

    useEffect(() => { loadChats(); loadFolders(); }, [loadChats, loadFolders]);
    useEffect(() => { if (selectedChatId) loadMessages(selectedChatId); }, [selectedChatId, fileTypeFilter, loadMessages]);

    const handleImport = async () => {
        if (!selectedMessage || !selectedChatId) return;
        setImporting(true);
        try {
            await telegramApi.importFile(selectedChatId, selectedMessage.id, selectedFolder || undefined);
            updateImportStatus('success');
            setTimeout(() => setImportingFile(null), 3000);
            setShowImport(false);
            setSelectedMessage(null);
        } catch (e) { console.error(e); }
        finally { setImporting(false); }
    };

    const selectedChat = chats.find(c => c.id === selectedChatId);

    return (
        <NewsprintLayout>
            <h1 className="text-3xl mb-6" style={{ fontFamily: 'var(--font-headline)' }}>Telegram Import</h1>

            <div className="grid grid-cols-4 gap-6" style={{ height: 'calc(100vh - 240px)' }}>
                {/* Chats */}
                <NewsprintCard className="!p-0 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-[var(--newsprint-rule-light)]"><NewsprintButton onClick={loadChats} className="w-full"><RefreshCw className={cn("w-4 h-4 mr-2", chatsLoading && "animate-spin")} /> Refresh</NewsprintButton></div>
                    <div className="flex-1 overflow-y-auto">
                        {chats.map(c => (
                            <button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 border-b border-[var(--newsprint-rule-light)] flex items-center gap-3", selectedChatId === c.id ? "bg-[var(--newsprint-bg)]" : "hover:bg-[var(--newsprint-bg)]")}>
                                {c.type === 'group' ? <Users className="w-4 h-4" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                <span className={cn("truncate text-sm", selectedChatId === c.id && "font-semibold")}>{c.title}</span>
                            </button>
                        ))}
                    </div>
                </NewsprintCard>

                {/* Messages */}
                <div className="col-span-3 flex flex-col">
                    <NewsprintCard className="flex-1 !p-0 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-[var(--newsprint-rule-light)] flex items-center justify-between">
                            <span className="font-semibold" style={{ fontFamily: 'var(--font-headline)' }}>{selectedChat?.title || 'Select a chat'}</span>
                            <div className="flex gap-1">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("px-2 py-1 text-xs uppercase", fileTypeFilter === t ? "bg-[var(--newsprint-ink)] text-[var(--newsprint-paper)]" : "border border-[var(--newsprint-rule-light)]")} style={{ fontFamily: 'var(--font-sans)' }}>{t}</button>))}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {!selectedChatId ? <NewsprintEmpty text="Select a chat to view files" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div> :
                                    messages.length === 0 ? <NewsprintEmpty text="No files in this chat" /> :
                                        messages.map(msg => {
                                            const type = getMessageMediaType(msg);
                                            const Icon = type === 'video' ? Video : type === 'photo' ? Image : type === 'audio' ? Music : FileText;
                                            return (
                                                <div key={msg.id} className="flex items-center gap-4 p-3 border-b border-[var(--newsprint-rule-light)] hover:bg-[var(--newsprint-bg)]">
                                                    <Icon className="w-5 h-5 text-[var(--newsprint-ink-muted)]" />
                                                    <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{getMessageFileName(msg)}</p>{getMessageFileSize(msg) && <p className="text-xs text-[var(--newsprint-ink-muted)]">{formatFileSize(getMessageFileSize(msg)!)}</p>}</div>
                                                    <NewsprintButton variant="primary" onClick={() => { setSelectedMessage(msg); setShowImport(true); }}><Download className="w-4 h-4" /></NewsprintButton>
                                                </div>
                                            );
                                        })}
                            {hasMoreMessages && <div className="p-4 text-center"><NewsprintButton onClick={() => loadMessages(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-4 h-4 mr-2" /> Load More</NewsprintButton></div>}
                        </div>
                    </NewsprintCard>
                </div>
            </div>

            <NewsprintModal open={showImport} onClose={() => setShowImport(false)} title="Import File" footer={<><NewsprintButton onClick={() => setShowImport(false)}>Cancel</NewsprintButton><NewsprintButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Import</NewsprintButton></>}>
                <p className="mb-4">File: <strong>{selectedMessage && getMessageFileName(selectedMessage)}</strong></p>
                <p className="text-sm text-[var(--newsprint-ink-muted)] mb-2">Select folder:</p>
                <div className="max-h-48 overflow-y-auto border border-[var(--newsprint-rule-light)]">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b border-[var(--newsprint-rule-light)] flex items-center gap-3", !selectedFolder && "bg-[var(--newsprint-bg)]")}><FolderOpen className="w-4 h-4" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--newsprint-rule-light)] flex items-center gap-3", selectedFolder === f.id && "bg-[var(--newsprint-bg)]")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </NewsprintModal>
        </NewsprintLayout>
    );
}
