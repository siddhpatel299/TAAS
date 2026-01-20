import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassButton, GlassEmpty, GlassModal, GlassTitle, GlassFileRow } from '@/components/glass/GlassComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getMessageMediaType(msg: TelegramMessage): string { if (msg.hasVideo) return 'video'; if (msg.hasPhoto) return 'photo'; if (msg.hasAudio) return 'audio'; if (msg.hasDocument) return 'document'; return 'text'; }
function getMessageFileName(msg: TelegramMessage): string { if (msg.document) return msg.document.fileName; if (msg.video) return msg.video.fileName; if (msg.audio) return msg.audio.fileName || 'Audio'; if (msg.hasPhoto) return 'Photo'; return msg.text?.slice(0, 30) || 'Message'; }
function getMessageFileSize(msg: TelegramMessage): number | undefined { if (msg.document) return msg.document.size; if (msg.video) return msg.video.size; if (msg.audio) return msg.audio.size; return undefined; }

export function GlassTelegramPage() {
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
        <GlassLayout>
            <GlassTitle>Telegram Import</GlassTitle>

            <div className="grid grid-cols-4 gap-6" style={{ height: 'calc(100vh - 200px)' }}>
                <GlassCard flat className="overflow-hidden flex flex-col">
                    <GlassButton onClick={loadChats} variant="primary" className="mb-3 w-full"><RefreshCw className={cn("w-5 h-5", chatsLoading && "animate-spin")} /> Refresh</GlassButton>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {chats.map(c => (
                            <button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all", selectedChatId === c.id ? "bg-white/20" : "hover:bg-white/10")}>
                                {c.type === 'group' ? <Users className="w-5 h-5" /> : c.type === 'channel' ? <Megaphone className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                <span className="truncate">{c.title}</span>
                            </button>
                        ))}
                    </div>
                </GlassCard>

                <div className="col-span-3">
                    <GlassCard flat className="h-full overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">{selectedChat?.title || 'Select a chat'}</span>
                            <div className="flex gap-2">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("glass-btn !py-1 !px-3 !text-sm", fileTypeFilter === t && "glass-btn-primary")}>{t}</button>))}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {!selectedChatId ? <GlassEmpty text="Select a chat to view files" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--glass-accent)]" /></div> :
                                    messages.length === 0 ? <GlassEmpty text="No files in this chat" /> :
                                        messages.map(msg => {
                                            const type = getMessageMediaType(msg);
                                            const Icon = type === 'video' ? Video : type === 'photo' ? Image : type === 'audio' ? Music : FileText;
                                            return (
                                                <GlassFileRow
                                                    key={msg.id}
                                                    icon={<Icon className="w-6 h-6" />}
                                                    name={getMessageFileName(msg)}
                                                    meta={getMessageFileSize(msg) ? formatFileSize(getMessageFileSize(msg)!) : undefined}
                                                    actions={<GlassButton variant="primary" onClick={() => { setSelectedMessage(msg); setShowImport(true); }}><Download className="w-5 h-5" /></GlassButton>}
                                                />
                                            );
                                        })}
                            {hasMoreMessages && <div className="p-4 text-center"><GlassButton variant="primary" onClick={() => loadMessages(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-5 h-5" /> Load More</GlassButton></div>}
                        </div>
                    </GlassCard>
                </div>
            </div>

            <GlassModal open={showImport} onClose={() => setShowImport(false)} title="Import File" footer={<><GlassButton onClick={() => setShowImport(false)}>Cancel</GlassButton><GlassButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} Import</GlassButton></>}>
                <p className="mb-4 font-medium">File: {selectedMessage && getMessageFileName(selectedMessage)}</p>
                <p className="text-sm text-[var(--glass-text-muted)] mb-2">Select folder:</p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b border-white/10 flex items-center gap-3", !selectedFolder && "bg-white/10")}><FolderOpen className="w-5 h-5" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b border-white/10 flex items-center gap-3", selectedFolder === f.id && "bg-white/10")}><FolderOpen className="w-5 h-5" /> {f.name}</button>))}
                </div>
            </GlassModal>
        </GlassLayout>
    );
}
