import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecEmpty, ExecModal, ExecTitle, ExecFileRow, ExecBadge } from '@/components/exec/ExecComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getType(m: TelegramMessage): string { if (m.hasVideo) return 'video'; if (m.hasPhoto) return 'photo'; if (m.hasAudio) return 'audio'; if (m.hasDocument) return 'document'; return 'text'; }
function getName(m: TelegramMessage): string { if (m.document) return m.document.fileName; if (m.video) return m.video.fileName; if (m.audio) return m.audio.fileName || 'Audio'; if (m.hasPhoto) return 'Photo'; return m.text?.slice(0, 30) || 'Message'; }
function getSize(m: TelegramMessage): number | undefined { if (m.document) return m.document.size; if (m.video) return m.video.size; if (m.audio) return m.audio.size; return undefined; }

export function ExecTelegramPage() {
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
        <ExecLayout>
            <ExecTitle subtitle="Import assets from your channels">Telegram Acquisition</ExecTitle>
            <div className="grid grid-cols-4 gap-8" style={{ minHeight: 'calc(100vh - 240px)' }}>
                <ExecCard className="overflow-hidden flex flex-col">
                    <h3 className="text-[var(--exec-gold)] uppercase tracking-wider text-sm mb-6" style={{ fontFamily: 'var(--font-exec-heading)' }}>Channels</h3>
                    <div className="mb-6"><ExecButton onClick={loadChats} variant="primary" className="w-full"><RefreshCw className={cn("w-4 h-4", chatsLoading && "animate-spin")} /> Refresh</ExecButton></div>
                    <div className="flex-1 overflow-y-auto -mx-8 px-8">
                        {chats.map(c => (<button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-4 mb-2 flex items-center gap-3 border transition-all", selectedChatId === c.id ? "border-[var(--exec-gold)] bg-[rgba(201,164,86,0.05)]" : "border-transparent hover:border-[var(--exec-border)]")}>{c.type === 'group' ? <Users className="w-4 h-4 text-[var(--exec-gold)]" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4 text-[var(--exec-gold)]" /> : <User className="w-4 h-4" />}<span className="truncate text-sm">{c.title}</span></button>))}
                    </div>
                </ExecCard>
                <div className="col-span-3">
                    <ExecCard className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[var(--exec-gold)] uppercase tracking-wider text-sm" style={{ fontFamily: 'var(--font-exec-heading)' }}>{chat?.title || 'Select a channel'}</h3>
                            {chat && <ExecBadge color="green">Connected</ExecBadge>}
                        </div>
                        <div className="flex gap-3 mb-6">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("exec-btn uppercase", fileTypeFilter === t && "exec-btn-primary")}>{t}</button>))}</div>
                        <div className="flex-1 overflow-y-auto -mx-8 px-8">
                            {!selectedChatId ? <ExecEmpty text="Select a channel to view assets" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--exec-gold)]" /></div> :
                                    messages.length === 0 ? <ExecEmpty text="No assets found in this channel" /> :
                                        <>{messages.map(m => { const t = getType(m); const I = t === 'video' ? Video : t === 'photo' ? Image : t === 'audio' ? Music : FileText; return <ExecFileRow key={m.id} icon={<I className="w-5 h-5" />} name={getName(m)} meta={getSize(m) ? formatFileSize(getSize(m)!) : undefined} actions={<ExecButton variant="primary" onClick={() => { setSelectedMsg(m); setShowImport(true); }}><Download className="w-4 h-4" /></ExecButton>} />; })}{hasMoreMessages && <div className="py-6 text-center"><ExecButton variant="primary" onClick={() => loadMsgs(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-4 h-4" /> Load More</ExecButton></div>}</>}
                        </div>
                    </ExecCard>
                </div>
            </div>
            <ExecModal open={showImport} onClose={() => setShowImport(false)} title="Import Asset" footer={<><ExecButton onClick={() => setShowImport(false)}>Cancel</ExecButton><ExecButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Import</ExecButton></>}>
                <p className="mb-6">{selectedMsg && getName(selectedMsg)}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--exec-gold)] mb-3" style={{ fontFamily: 'var(--font-exec-heading)' }}>Destination Portfolio</p>
                <div className="max-h-48 overflow-y-auto">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-4 flex items-center gap-3 mb-1 border border-transparent", !selectedFolder && "border-[var(--exec-gold)]")}><FolderOpen className="w-4 h-4" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-4 flex items-center gap-3 mb-1 border border-transparent", selectedFolder === f.id && "border-[var(--exec-gold)]")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </ExecModal>
        </ExecLayout>
    );
}
