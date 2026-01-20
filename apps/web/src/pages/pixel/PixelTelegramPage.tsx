import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelEmpty, PixelModal, PixelTitle, PixelFileRow, PixelBadge } from '@/components/pixel/PixelComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getType(m: TelegramMessage): string { if (m.hasVideo) return 'video'; if (m.hasPhoto) return 'photo'; if (m.hasAudio) return 'audio'; if (m.hasDocument) return 'document'; return 'text'; }
function getName(m: TelegramMessage): string { if (m.document) return m.document.fileName; if (m.video) return m.video.fileName; if (m.audio) return m.audio.fileName || 'Audio'; if (m.hasPhoto) return 'Photo'; return m.text?.slice(0, 30) || 'Message'; }
function getSize(m: TelegramMessage): number | undefined { if (m.document) return m.document.size; if (m.video) return m.video.size; if (m.audio) return m.audio.size; return undefined; }

export function PixelTelegramPage() {
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
        <PixelLayout>
            <PixelTitle subtitle="> IMPORT FROM CHANNELS">📬 TELEGRAM</PixelTitle>
            <div className="grid grid-cols-4 gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <PixelCard className="overflow-hidden flex flex-col">
                    <h3 style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', marginBottom: '16px', color: 'var(--pixel-cyan)' }}>SERVERS</h3>
                    <div className="mb-4"><PixelButton onClick={loadChats} variant="primary" className="w-full"><RefreshCw className={cn("w-4 h-4", chatsLoading && "animate-spin")} /> SCAN</PixelButton></div>
                    <div className="flex-1 overflow-y-auto max-h-80">
                        {chats.map(c => (<button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 mb-1 flex items-center gap-2 border-2", selectedChatId === c.id ? "border-[var(--pixel-cyan)] bg-[rgba(41,173,255,0.1)]" : "border-transparent")}>{c.type === 'group' ? <Users className="w-4 h-4 text-[var(--pixel-yellow)]" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4 text-[var(--pixel-pink)]" /> : <User className="w-4 h-4" />}<span className="truncate text-sm">{c.title}</span></button>))}
                    </div>
                </PixelCard>
                <div className="col-span-3">
                    <PixelCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>{chat?.title || '> SELECT SERVER'}</h3>
                            {chat && <PixelBadge color="green">ONLINE</PixelBadge>}
                        </div>
                        <div className="flex gap-2 mb-4">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("pixel-btn", fileTypeFilter === t && "pixel-btn-primary")}>{t.toUpperCase()}</button>))}</div>
                        <div className="max-h-96 overflow-y-auto">
                            {!selectedChatId ? <PixelEmpty text="SELECT A SERVER" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--pixel-cyan)]" /></div> :
                                    messages.length === 0 ? <PixelEmpty text="NO LOOT FOUND" /> :
                                        <>{messages.map(m => { const t = getType(m); const I = t === 'video' ? Video : t === 'photo' ? Image : t === 'audio' ? Music : FileText; return <PixelFileRow key={m.id} icon={<I className="w-5 h-5" />} name={getName(m)} meta={getSize(m) ? formatFileSize(getSize(m)!) : undefined} actions={<PixelButton variant="primary" onClick={() => { setSelectedMsg(m); setShowImport(true); }}><Download className="w-4 h-4" /></PixelButton>} />; })}{hasMoreMessages && <div className="py-4 text-center"><PixelButton variant="primary" onClick={() => loadMsgs(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-4 h-4" /> MORE</PixelButton></div>}</>}
                        </div>
                    </PixelCard>
                </div>
            </div>
            <PixelModal open={showImport} onClose={() => setShowImport(false)} title="GRAB LOOT" footer={<><PixelButton onClick={() => setShowImport(false)}>CANCEL</PixelButton><PixelButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} GRAB</PixelButton></>}>
                <p className="mb-4">&gt; {selectedMsg && getName(selectedMsg)}</p>
                <p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)', marginBottom: '8px' }}>SAVE TO:</p>
                <div className="max-h-48 overflow-y-auto">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 flex items-center gap-2 mb-1 border-2", !selectedFolder ? "border-[var(--pixel-cyan)]" : "border-transparent")}><FolderOpen className="w-4 h-4" /> ROOT</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 flex items-center gap-2 mb-1 border-2", selectedFolder === f.id ? "border-[var(--pixel-cyan)]" : "border-transparent")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </PixelModal>
        </PixelLayout>
    );
}
