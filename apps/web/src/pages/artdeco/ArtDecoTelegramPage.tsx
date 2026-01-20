import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoButton, DecoEmpty, DecoModal, DecoTitle, DecoFileRow, DecoDivider } from '@/components/artdeco/ArtDecoComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getType(msg: TelegramMessage): string { if (msg.hasVideo) return 'video'; if (msg.hasPhoto) return 'photo'; if (msg.hasAudio) return 'audio'; if (msg.hasDocument) return 'document'; return 'text'; }
function getName(msg: TelegramMessage): string { if (msg.document) return msg.document.fileName; if (msg.video) return msg.video.fileName; if (msg.audio) return msg.audio.fileName || 'Audio'; if (msg.hasPhoto) return 'Photo'; return msg.text?.slice(0, 30) || 'Message'; }
function getSize(msg: TelegramMessage): number | undefined { if (msg.document) return msg.document.size; if (msg.video) return msg.video.size; if (msg.audio) return msg.audio.size; return undefined; }

export function ArtDecoTelegramPage() {
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
        <ArtDecoLayout>
            <DecoTitle>Telegram Import</DecoTitle>
            <div className="grid grid-cols-4 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
                <DecoCard className="overflow-hidden flex flex-col">
                    <DecoButton onClick={loadChats} variant="primary" className="mb-4 w-full"><RefreshCw className={cn("w-5 h-5", chatsLoading && "animate-spin")} /> Refresh</DecoButton>
                    <DecoDivider text="Channels" />
                    <div className="flex-1 overflow-y-auto">
                        {chats.map(c => (<button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 border-b border-[var(--deco-gold-dark)] flex items-center gap-3", selectedChatId === c.id ? "bg-[rgba(212,175,55,0.1)]" : "hover:bg-[rgba(212,175,55,0.05)]")}>{c.type === 'group' ? <Users className="w-5 h-5" /> : c.type === 'channel' ? <Megaphone className="w-5 h-5" /> : <User className="w-5 h-5" />}<span className="truncate">{c.title}</span></button>))}
                    </div>
                </DecoCard>
                <div className="col-span-3">
                    <DecoCard className="h-full overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-medium text-lg">{chat?.title || 'Select a channel'}</span>
                            <div className="flex gap-2">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("deco-btn !py-1 !px-3 !text-sm", fileTypeFilter === t && "deco-btn-primary")}>{t}</button>))}</div>
                        </div>
                        <DecoDivider />
                        <div className="flex-1 overflow-y-auto">
                            {!selectedChatId ? <DecoEmpty text="Select a channel to view files" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--deco-gold)]" /></div> :
                                    messages.length === 0 ? <DecoEmpty text="No files in this channel" /> :
                                        messages.map(msg => { const t = getType(msg); const I = t === 'video' ? Video : t === 'photo' ? Image : t === 'audio' ? Music : FileText; return <DecoFileRow key={msg.id} icon={<I className="w-6 h-6" />} name={getName(msg)} meta={getSize(msg) ? formatFileSize(getSize(msg)!) : undefined} actions={<DecoButton variant="primary" onClick={() => { setSelectedMsg(msg); setShowImport(true); }}><Download className="w-5 h-5" /></DecoButton>} />; })}
                            {hasMoreMessages && <div className="p-4 text-center"><DecoButton variant="primary" onClick={() => loadMsgs(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-5 h-5" /> Load More</DecoButton></div>}
                        </div>
                    </DecoCard>
                </div>
            </div>
            <DecoModal open={showImport} onClose={() => setShowImport(false)} title="Import File" footer={<><DecoButton onClick={() => setShowImport(false)}>Cancel</DecoButton><DecoButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} Import</DecoButton></>}>
                <p className="mb-4 font-medium">File: {selectedMsg && getName(selectedMsg)}</p>
                <p className="text-sm text-[var(--deco-gold)] mb-2 uppercase tracking-wider">Select folder:</p>
                <div className="max-h-48 overflow-y-auto border border-[var(--deco-gold-dark)]">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b border-[var(--deco-gold-dark)] flex items-center gap-3", !selectedFolder && "bg-[rgba(212,175,55,0.1)]")}><FolderOpen className="w-5 h-5" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--deco-gold-dark)] flex items-center gap-3", selectedFolder === f.id && "bg-[rgba(212,175,55,0.1)]")}><FolderOpen className="w-5 h-5" /> {f.name}</button>))}
                </div>
            </DecoModal>
        </ArtDecoLayout>
    );
}
