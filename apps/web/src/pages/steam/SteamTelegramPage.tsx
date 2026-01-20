import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamButton, SteamEmpty, SteamModal, SteamTitle, SteamFileRow } from '@/components/steam/SteamComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getType(m: TelegramMessage): string { if (m.hasVideo) return 'video'; if (m.hasPhoto) return 'photo'; if (m.hasAudio) return 'audio'; if (m.hasDocument) return 'document'; return 'text'; }
function getName(m: TelegramMessage): string { if (m.document) return m.document.fileName; if (m.video) return m.video.fileName; if (m.audio) return m.audio.fileName || 'Audio'; if (m.hasPhoto) return 'Photo'; return m.text?.slice(0, 30) || 'Message'; }
function getSize(m: TelegramMessage): number | undefined { if (m.document) return m.document.size; if (m.video) return m.video.size; if (m.audio) return m.audio.size; return undefined; }

export function SteamTelegramPage() {
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
        <SteamLayout>
            <SteamTitle>Telegraph Import</SteamTitle>
            <div className="grid grid-cols-4 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <SteamPanel title="Channels" className="overflow-hidden flex flex-col">
                    <SteamButton onClick={loadChats} variant="primary" className="mb-4 w-full"><RefreshCw className={cn("w-4 h-4", chatsLoading && "animate-spin")} /> Refresh</SteamButton>
                    <div className="flex-1 overflow-y-auto -mx-5 px-5">
                        {chats.map(c => (<button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 border-b border-[var(--steam-iron)] flex items-center gap-2", selectedChatId === c.id ? "bg-[rgba(184,134,11,0.15)]" : "hover:bg-[rgba(184,134,11,0.1)]")}>{c.type === 'group' ? <Users className="w-4 h-4 text-[var(--steam-brass)]" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4 text-[var(--steam-copper)]" /> : <User className="w-4 h-4" />}<span className="truncate text-sm">{c.title}</span></button>))}
                    </div>
                </SteamPanel>
                <div className="col-span-3">
                    <SteamPanel title={chat?.title || 'Select a channel'} className="h-full flex flex-col">
                        <div className="flex gap-2 mb-4">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("steam-btn !py-1", fileTypeFilter === t && "steam-btn-primary")}>{t}</button>))}</div>
                        <div className="flex-1 overflow-y-auto -mx-5 px-5">
                            {!selectedChatId ? <SteamEmpty text="Select a channel to browse" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--steam-brass)]" /></div> :
                                    messages.length === 0 ? <SteamEmpty text="No files in this channel" /> :
                                        <>{messages.map(m => { const t = getType(m); const I = t === 'video' ? Video : t === 'photo' ? Image : t === 'audio' ? Music : FileText; return <SteamFileRow key={m.id} icon={<I className="w-5 h-5" />} name={getName(m)} meta={getSize(m) ? formatFileSize(getSize(m)!) : undefined} actions={<SteamButton variant="primary" onClick={() => { setSelectedMsg(m); setShowImport(true); }}><Download className="w-4 h-4" /></SteamButton>} />; })}{hasMoreMessages && <div className="py-4 text-center"><SteamButton variant="primary" onClick={() => loadMsgs(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-4 h-4" /> Load More</SteamButton></div>}</>}
                        </div>
                    </SteamPanel>
                </div>
            </div>
            <SteamModal open={showImport} onClose={() => setShowImport(false)} title="Import to Archive" footer={<><SteamButton onClick={() => setShowImport(false)}>Cancel</SteamButton><SteamButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Import</SteamButton></>}>
                <p className="mb-4">{selectedMsg && getName(selectedMsg)}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--steam-brass-light)] mb-2">Destination</p>
                <div className="max-h-48 overflow-y-auto border-2 border-[var(--steam-brass)]">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b border-[var(--steam-iron)] flex items-center gap-2", !selectedFolder && "bg-[rgba(184,134,11,0.15)]")}><FolderOpen className="w-4 h-4" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--steam-iron)] flex items-center gap-2", selectedFolder === f.id && "bg-[rgba(184,134,11,0.15)]")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </SteamModal>
        </SteamLayout>
    );
}
