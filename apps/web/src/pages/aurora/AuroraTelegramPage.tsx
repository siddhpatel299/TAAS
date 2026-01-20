import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraEmpty, AuroraModal, AuroraTitle, AuroraFileRow } from '@/components/aurora/AuroraComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getType(m: TelegramMessage): string { if (m.hasVideo) return 'video'; if (m.hasPhoto) return 'photo'; if (m.hasAudio) return 'audio'; if (m.hasDocument) return 'document'; return 'text'; }
function getName(m: TelegramMessage): string { if (m.document) return m.document.fileName; if (m.video) return m.video.fileName; if (m.audio) return m.audio.fileName || 'Audio'; if (m.hasPhoto) return 'Photo'; return m.text?.slice(0, 30) || 'Message'; }
function getSize(m: TelegramMessage): number | undefined { if (m.document) return m.document.size; if (m.video) return m.video.size; if (m.audio) return m.audio.size; return undefined; }

export function AuroraTelegramPage() {
    const { chats, chatsLoading, selectedChatId, messages, messagesLoading, hasMoreMessages, fileTypeFilter, setChats, setChatsLoading, selectChat, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages, setFileTypeFilter, setImportingFile, updateImportStatus } = useTelegramStore();
    const { folders, setFolders } = useFilesStore();
    const [showImport, setShowImport] = useState(false);
    const [selectedMsg, setSelectedMsg] = useState<TelegramMessage | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    const loadChats = useCallback(async () => { setChatsLoading(true); try { const r = await telegramApi.getChats(); setChats(r.data?.data || []); } catch (e) { console.error(e); } finally { setChatsLoading(false); } }, [setChats, setChatsLoading]);
    const loadMsgs = useCallback(async (chatId: string, offsetId?: number) => { setMessagesLoading(true); try { const params: any = { limit: 50, offsetId, filesOnly: true }; if (fileTypeFilter && fileTypeFilter !== 'all') params.fileType = fileTypeFilter; const r = await telegramApi.getChatMessages(chatId, params); if (offsetId) appendMessages(r.data?.data || []); else setMessages(r.data?.data || []); setHasMoreMessages(r.data?.meta?.hasMore || false); } catch (e) { console.error(e); } finally { setMessagesLoading(false); } }, [fileTypeFilter, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages]);
    const loadFolders = useCallback(async () => { try { const r = await foldersApi.getFolders(); setFolders(r.data?.data || []); } catch (e) { console.error(e); } }, [setFolders]);

    useEffect(() => { loadChats(); loadFolders(); }, [loadChats, loadFolders]);
    useEffect(() => { if (selectedChatId) loadMsgs(selectedChatId); }, [selectedChatId, fileTypeFilter, loadMsgs]);

    const handleImport = async () => { if (!selectedMsg || !selectedChatId) return; setImporting(true); try { await telegramApi.importFile(selectedChatId, selectedMsg.id, selectedFolder || undefined); updateImportStatus('success'); setTimeout(() => setImportingFile(null), 3000); setShowImport(false); setSelectedMsg(null); } catch (e) { console.error(e); } finally { setImporting(false); } };
    const chat = chats.find(c => c.id === selectedChatId);

    return (
        <AuroraLayout>
            <AuroraTitle subtitle="Import from channels">Telegram</AuroraTitle>
            <div className="grid grid-cols-4 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <AuroraCard className="overflow-hidden flex flex-col">
                    <h3 className="font-semibold mb-4">Channels</h3>
                    <AuroraButton onClick={loadChats} variant="primary" className="mb-4 w-full"><RefreshCw className={cn("w-4 h-4", chatsLoading && "animate-spin")} /> Refresh</AuroraButton>
                    <div className="flex-1 overflow-y-auto -mx-6 px-6">
                        {chats.map(c => (<button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 rounded-xl mb-1 flex items-center gap-2", selectedChatId === c.id ? "bg-[rgba(102,126,234,0.2)]" : "hover:bg-[rgba(102,126,234,0.1)]")}>{c.type === 'group' ? <Users className="w-4 h-4 text-[var(--aurora-teal)]" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4 text-[var(--aurora-purple)]" /> : <User className="w-4 h-4" />}<span className="truncate text-sm">{c.title}</span></button>))}
                    </div>
                </AuroraCard>
                <div className="col-span-3">
                    <AuroraCard className="h-full flex flex-col">
                        <h3 className="font-semibold mb-4">{chat?.title || 'Select a channel'}</h3>
                        <div className="flex gap-2 mb-4">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("aurora-btn", fileTypeFilter === t && "aurora-btn-primary")}>{t}</button>))}</div>
                        <div className="flex-1 overflow-y-auto -mx-6 px-6">
                            {!selectedChatId ? <AuroraEmpty text="Select a channel" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--aurora-gradient-1)]" /></div> :
                                    messages.length === 0 ? <AuroraEmpty text="No files" /> :
                                        <>{messages.map(m => { const t = getType(m); const I = t === 'video' ? Video : t === 'photo' ? Image : t === 'audio' ? Music : FileText; return <AuroraFileRow key={m.id} icon={<I className="w-5 h-5" />} name={getName(m)} meta={getSize(m) ? formatFileSize(getSize(m)!) : undefined} actions={<AuroraButton variant="primary" onClick={() => { setSelectedMsg(m); setShowImport(true); }}><Download className="w-4 h-4" /></AuroraButton>} />; })}{hasMoreMessages && <div className="py-4 text-center"><AuroraButton variant="primary" onClick={() => loadMsgs(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-4 h-4" /> More</AuroraButton></div>}</>}
                        </div>
                    </AuroraCard>
                </div>
            </div>
            <AuroraModal open={showImport} onClose={() => setShowImport(false)} title="Import" footer={<><AuroraButton onClick={() => setShowImport(false)}>Cancel</AuroraButton><AuroraButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Import</AuroraButton></>}>
                <p className="font-medium mb-4">{selectedMsg && getName(selectedMsg)}</p>
                <p className="text-sm text-[var(--aurora-text-muted)] mb-2">Destination folder</p>
                <div className="max-h-48 overflow-y-auto">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 rounded-lg flex items-center gap-2 mb-1", !selectedFolder && "bg-[rgba(102,126,234,0.15)]")}><FolderOpen className="w-4 h-4" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 rounded-lg flex items-center gap-2 mb-1", selectedFolder === f.id && "bg-[rgba(102,126,234,0.15)]")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </AuroraModal>
        </AuroraLayout>
    );
}
