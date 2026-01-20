import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenEmpty, ZenModal, ZenTitle, ZenFileRow, ZenSection } from '@/components/zen/ZenComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getType(m: TelegramMessage): string { if (m.hasVideo) return 'video'; if (m.hasPhoto) return 'photo'; if (m.hasAudio) return 'audio'; if (m.hasDocument) return 'document'; return 'text'; }
function getName(m: TelegramMessage): string { if (m.document) return m.document.fileName; if (m.video) return m.video.fileName; if (m.audio) return m.audio.fileName || 'Audio'; if (m.hasPhoto) return 'Photo'; return m.text?.slice(0, 30) || 'Message'; }
function getSize(m: TelegramMessage): number | undefined { if (m.document) return m.document.size; if (m.video) return m.video.size; if (m.audio) return m.audio.size; return undefined; }

export function ZenTelegramPage() {
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
        <ZenLayout>
            <ZenTitle subtitle="Import from channels">Telegram</ZenTitle>
            <div className="grid grid-cols-4 gap-10" style={{ minHeight: 'calc(100vh - 280px)' }}>
                <ZenSection title="Channels">
                    <ZenCard>
                        <div style={{ marginBottom: '24px' }}><ZenButton onClick={loadChats} variant="primary" className="w-full"><RefreshCw className={cn("w-3 h-3", chatsLoading && "animate-spin")} /> Refresh</ZenButton></div>
                        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                            {chats.map(c => (<button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-4 border-b border-[var(--zen-border-light)] flex items-center gap-3", selectedChatId === c.id && "bg-[var(--zen-bg)]")}>{c.type === 'group' ? <Users className="w-4 h-4 text-[var(--zen-text-light)]" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4 text-[var(--zen-text-light)]" /> : <User className="w-4 h-4" />}<span className="truncate text-sm">{c.title}</span></button>))}
                        </div>
                    </ZenCard>
                </ZenSection>
                <div className="col-span-3">
                    <ZenSection title={chat?.title || 'Select a channel'}>
                        <ZenCard>
                            <div className="flex gap-3" style={{ marginBottom: '24px' }}>{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("zen-btn", fileTypeFilter === t && "zen-btn-primary")}>{t}</button>))}</div>
                            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                                {!selectedChatId ? <ZenEmpty text="Select a channel" /> :
                                    messagesLoading && messages.length === 0 ? <div className="flex items-center justify-center" style={{ minHeight: '20vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div> :
                                        messages.length === 0 ? <ZenEmpty text="No files" /> :
                                            <>{messages.map(m => { const t = getType(m); const I = t === 'video' ? Video : t === 'photo' ? Image : t === 'audio' ? Music : FileText; return <ZenFileRow key={m.id} icon={<I className="w-4 h-4" />} name={getName(m)} meta={getSize(m) ? formatFileSize(getSize(m)!) : undefined} actions={<ZenButton variant="primary" onClick={() => { setSelectedMsg(m); setShowImport(true); }}><Download className="w-3 h-3" /></ZenButton>} />; })}{hasMoreMessages && <div style={{ marginTop: '24px', textAlign: 'center' }}><ZenButton variant="primary" onClick={() => loadMsgs(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-3 h-3" /> More</ZenButton></div>}</>}
                            </div>
                        </ZenCard>
                    </ZenSection>
                </div>
            </div>
            <ZenModal open={showImport} onClose={() => setShowImport(false)} title="Import" footer={<><ZenButton onClick={() => setShowImport(false)}>Cancel</ZenButton><ZenButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Import</ZenButton></>}>
                <p style={{ marginBottom: '24px' }}>{selectedMsg && getName(selectedMsg)}</p>
                <p className="zen-section-header">Destination</p>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 flex items-center gap-3", !selectedFolder && "bg-[var(--zen-bg)]")}><FolderOpen className="w-4 h-4" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 flex items-center gap-3", selectedFolder === f.id && "bg-[var(--zen-bg)]")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </ZenModal>
        </ZenLayout>
    );
}
