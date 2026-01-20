import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperSticky, PaperButton, PaperEmpty, PaperModal, PaperTitle, PaperFileRow, PaperBadge } from '@/components/paper/PaperComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getType(m: TelegramMessage): string { if (m.hasVideo) return 'video'; if (m.hasPhoto) return 'photo'; if (m.hasAudio) return 'audio'; if (m.hasDocument) return 'document'; return 'text'; }
function getName(m: TelegramMessage): string { if (m.document) return m.document.fileName; if (m.video) return m.video.fileName; if (m.audio) return m.audio.fileName || 'Audio'; if (m.hasPhoto) return 'Photo'; return m.text?.slice(0, 30) || 'Message'; }
function getSize(m: TelegramMessage): number | undefined { if (m.document) return m.document.size; if (m.video) return m.video.size; if (m.audio) return m.audio.size; return undefined; }

export function PaperTelegramPage() {
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
        <PaperLayout>
            <PaperTitle subtitle="import from your channels">📬 Telegram</PaperTitle>
            <div className="grid grid-cols-4 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <PaperSticky color="blue" className="overflow-hidden flex flex-col h-fit">
                    <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', marginBottom: '16px' }}>Channels</h3>
                    <div className="mb-4"><PaperButton onClick={loadChats} variant="primary" className="w-full"><RefreshCw className={cn("w-4 h-4", chatsLoading && "animate-spin")} /> refresh</PaperButton></div>
                    <div className="flex-1 overflow-y-auto max-h-80">
                        {chats.map(c => (<button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 mb-1 flex items-center gap-2 rounded", selectedChatId === c.id && "bg-white/50")}>{c.type === 'group' ? <Users className="w-4 h-4" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4" /> : <User className="w-4 h-4" />}<span className="truncate text-sm" style={{ fontFamily: 'var(--font-handwritten)' }}>{c.title}</span></button>))}
                    </div>
                </PaperSticky>
                <div className="col-span-3">
                    <PaperCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem' }}>{chat?.title || 'Select a channel'}</h3>
                            {chat && <PaperBadge color="green">connected</PaperBadge>}
                        </div>
                        <div className="flex gap-2 mb-4">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("paper-btn", fileTypeFilter === t && "paper-btn-primary")}>{t}</button>))}</div>
                        <div className="max-h-96 overflow-y-auto">
                            {!selectedChatId ? <PaperEmpty text="pick a channel from the left" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--ink-blue)]" /></div> :
                                    messages.length === 0 ? <PaperEmpty text="no files found" /> :
                                        <>{messages.map(m => { const t = getType(m); const I = t === 'video' ? Video : t === 'photo' ? Image : t === 'audio' ? Music : FileText; return <PaperFileRow key={m.id} icon={<I className="w-5 h-5" />} name={getName(m)} meta={getSize(m) ? formatFileSize(getSize(m)!) : undefined} actions={<PaperButton variant="primary" onClick={() => { setSelectedMsg(m); setShowImport(true); }}><Download className="w-4 h-4" /></PaperButton>} />; })}{hasMoreMessages && <div className="py-4 text-center"><PaperButton variant="primary" onClick={() => loadMsgs(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-4 h-4" /> load more</PaperButton></div>}</>}
                        </div>
                    </PaperCard>
                </div>
            </div>
            <PaperModal open={showImport} onClose={() => setShowImport(false)} title="📥 Import File" footer={<><PaperButton onClick={() => setShowImport(false)}>cancel</PaperButton><PaperButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} import</PaperButton></>}>
                <p style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.25rem', marginBottom: '16px' }}>{selectedMsg && getName(selectedMsg)}</p>
                <p className="text-sm text-[var(--ink-blue)] mb-2">Save to folder:</p>
                <div className="max-h-48 overflow-y-auto">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 flex items-center gap-2 mb-1", !selectedFolder && "bg-[var(--paper-cream)]")}><FolderOpen className="w-4 h-4" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 flex items-center gap-2 mb-1", selectedFolder === f.id && "bg-[var(--paper-cream)]")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </PaperModal>
        </PaperLayout>
    );
}
