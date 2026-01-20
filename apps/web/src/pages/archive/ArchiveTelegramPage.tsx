import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveCard, ArchiveButton, ArchiveEmpty, ArchiveModal, ArchiveTitle, ArchiveFileRow } from '@/components/archive/ArchiveComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getType(m: TelegramMessage): string { if (m.hasVideo) return 'video'; if (m.hasPhoto) return 'photo'; if (m.hasAudio) return 'audio'; if (m.hasDocument) return 'document'; return 'text'; }
function getName(m: TelegramMessage): string { if (m.document) return m.document.fileName; if (m.video) return m.video.fileName; if (m.audio) return m.audio.fileName || 'Audio'; if (m.hasPhoto) return 'Photo'; return m.text?.slice(0, 30) || 'Message'; }
function getSize(m: TelegramMessage): number | undefined { if (m.document) return m.document.size; if (m.video) return m.video.size; if (m.audio) return m.audio.size; return undefined; }

export function ArchiveTelegramPage() {
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
        <ArchiveLayout>
            <ArchiveTitle>Telegram Import</ArchiveTitle>
            <div className="grid grid-cols-4 gap-8" style={{ minHeight: 'calc(100vh - 250px)' }}>
                <div>
                    <ArchiveSection title="Sources">
                        <ArchiveButton onClick={loadChats} variant="primary" className="mb-4 w-full"><RefreshCw className={cn("w-4 h-4", chatsLoading && "animate-spin")} /> Refresh</ArchiveButton>
                        <div className="space-y-1">
                            {chats.map(c => (<ArchiveCard key={c.id} featured={selectedChatId === c.id} onClick={() => selectChat(c.id)}><div className="flex items-center gap-2 text-sm">{c.type === 'group' ? <Users className="w-4 h-4" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4" /> : <User className="w-4 h-4" />}<span className="truncate">{c.title}</span></div></ArchiveCard>))}
                        </div>
                    </ArchiveSection>
                </div>
                <div className="col-span-3">
                    <ArchiveSection title={chat?.title || 'Select a source'} count={messages.length}>
                        <div className="flex gap-2 mb-6">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("archive-btn", fileTypeFilter === t && "archive-btn-primary")}>{t}</button>))}</div>
                        {!selectedChatId ? <ArchiveEmpty title="Select a source" text="Choose a channel or group to browse files." /> :
                            messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--archive-accent)]" /></div> :
                                messages.length === 0 ? <ArchiveEmpty title="No files" text="This source contains no media files." /> :
                                    <>{messages.map((m, i) => { const t = getType(m); const I = t === 'video' ? Video : t === 'photo' ? Image : t === 'audio' ? Music : FileText; return <ArchiveFileRow key={m.id} index={i} icon={<I className="w-5 h-5" />} name={getName(m)} meta={getSize(m) ? formatFileSize(getSize(m)!) : undefined} actions={<ArchiveButton variant="primary" onClick={() => { setSelectedMsg(m); setShowImport(true); }}><Download className="w-4 h-4" /></ArchiveButton>} />; })}{hasMoreMessages && <div className="mt-6 text-center"><ArchiveButton variant="primary" onClick={() => loadMsgs(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-4 h-4" /> Load More</ArchiveButton></div>}</>}
                    </ArchiveSection>
                </div>
            </div>
            <ArchiveModal open={showImport} onClose={() => setShowImport(false)} title="Import to Archive" footer={<><ArchiveButton onClick={() => setShowImport(false)}>Cancel</ArchiveButton><ArchiveButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Import</ArchiveButton></>}>
                <p className="font-medium mb-4">{selectedMsg && getName(selectedMsg)}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--archive-text-muted)] mb-2">Destination</p>
                <div className="max-h-48 overflow-y-auto border border-[var(--archive-border)]">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b border-[var(--archive-border)] flex items-center gap-2", !selectedFolder && "bg-[var(--archive-bg)]")}><FolderOpen className="w-4 h-4" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--archive-border)] flex items-center gap-2", selectedFolder === f.id && "bg-[var(--archive-bg)]")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </ArchiveModal>
        </ArchiveLayout>
    );
}
