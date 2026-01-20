import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistButton, BrutalistEmpty, BrutalistModal, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getMessageMediaType(msg: TelegramMessage): string { if (msg.hasVideo) return 'video'; if (msg.hasPhoto) return 'photo'; if (msg.hasAudio) return 'audio'; if (msg.hasDocument) return 'document'; return 'text'; }
function getMessageFileName(msg: TelegramMessage): string { if (msg.document) return msg.document.fileName; if (msg.video) return msg.video.fileName; if (msg.audio) return msg.audio.fileName || 'Audio'; if (msg.hasPhoto) return 'Photo'; return msg.text?.slice(0, 30) || 'Message'; }
function getMessageFileSize(msg: TelegramMessage): number | undefined { if (msg.document) return msg.document.size; if (msg.video) return msg.video.size; if (msg.audio) return msg.audio.size; return undefined; }

export function BrutalistTelegramPage() {
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
        <BrutalistLayout>
            <BrutalistTitle>Telegram Import</BrutalistTitle>

            <div className="grid grid-cols-4 gap-6" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Chats */}
                <BrutalistCard className="!p-0 overflow-hidden flex flex-col">
                    <div className="p-3 border-b-3 border-black bg-[var(--brutalist-gray)]"><BrutalistButton onClick={loadChats} className="w-full !shadow-none"><RefreshCw className={cn("w-5 h-5", chatsLoading && "animate-spin")} /> Refresh</BrutalistButton></div>
                    <div className="flex-1 overflow-y-auto">
                        {chats.map(c => (
                            <button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-4 border-b-2 border-black flex items-center gap-3 font-semibold", selectedChatId === c.id ? "bg-[var(--brutalist-black)] text-white" : "hover:bg-[var(--brutalist-gray)]")}>
                                {c.type === 'group' ? <Users className="w-5 h-5" /> : c.type === 'channel' ? <Megaphone className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                <span className="truncate">{c.title}</span>
                            </button>
                        ))}
                    </div>
                </BrutalistCard>

                {/* Messages */}
                <div className="col-span-3 flex flex-col">
                    <BrutalistCard className="flex-1 !p-0 overflow-hidden flex flex-col">
                        <div className="p-3 border-b-3 border-black bg-[var(--brutalist-gray)] flex items-center justify-between">
                            <span className="font-bold uppercase">{selectedChat?.title || 'Select a chat'}</span>
                            <div className="flex gap-2">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("brutalist-btn !p-2 !text-xs !shadow-none", fileTypeFilter === t && "brutalist-btn-primary")}>{t}</button>))}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {!selectedChatId ? <BrutalistEmpty text="Select a chat to view files" /> :
                                messagesLoading && messages.length === 0 ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto" /></div> :
                                    messages.length === 0 ? <BrutalistEmpty text="No files in this chat" /> :
                                        messages.map(msg => {
                                            const type = getMessageMediaType(msg);
                                            const Icon = type === 'video' ? Video : type === 'photo' ? Image : type === 'audio' ? Music : FileText;
                                            return (
                                                <div key={msg.id} className="brutalist-file-row">
                                                    <Icon className="w-6 h-6" />
                                                    <div className="flex-1 min-w-0"><p className="font-semibold truncate">{getMessageFileName(msg)}</p>{getMessageFileSize(msg) && <p className="text-sm opacity-70">{formatFileSize(getMessageFileSize(msg)!)}</p>}</div>
                                                    <BrutalistButton variant="primary" onClick={() => { setSelectedMessage(msg); setShowImport(true); }}><Download className="w-5 h-5" /></BrutalistButton>
                                                </div>
                                            );
                                        })}
                            {hasMoreMessages && <div className="p-4 text-center"><BrutalistButton variant="primary" onClick={() => loadMessages(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-5 h-5" /> Load More</BrutalistButton></div>}
                        </div>
                    </BrutalistCard>
                </div>
            </div>

            <BrutalistModal open={showImport} onClose={() => setShowImport(false)} title="Import File" footer={<><BrutalistButton onClick={() => setShowImport(false)}>Cancel</BrutalistButton><BrutalistButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} Import</BrutalistButton></>}>
                <p className="mb-4 font-semibold">File: {selectedMessage && getMessageFileName(selectedMessage)}</p>
                <p className="text-sm font-bold uppercase mb-2">Select folder:</p>
                <div className="max-h-48 overflow-y-auto border-3 border-black">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b-2 border-black flex items-center gap-3 font-semibold", !selectedFolder && "bg-[var(--brutalist-gray)]")}><FolderOpen className="w-5 h-5" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b-2 border-black flex items-center gap-3 font-semibold", selectedFolder === f.id && "bg-[var(--brutalist-gray)]")}><FolderOpen className="w-5 h-5" /> {f.name}</button>))}
                </div>
            </BrutalistModal>
        </BrutalistLayout>
    );
}
