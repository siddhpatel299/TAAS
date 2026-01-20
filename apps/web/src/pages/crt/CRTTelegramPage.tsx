import { useState, useEffect, useCallback } from 'react';
import { Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, ChevronDown } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTButton, CRTEmpty, CRTModal, CRTTitle, CRTFileRow } from '@/components/crt/CRTComponents';
import { useTelegramStore, TelegramMessage } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

function getMessageMediaType(msg: TelegramMessage): string { if (msg.hasVideo) return 'video'; if (msg.hasPhoto) return 'photo'; if (msg.hasAudio) return 'audio'; if (msg.hasDocument) return 'document'; return 'text'; }
function getMessageFileName(msg: TelegramMessage): string { if (msg.document) return msg.document.fileName; if (msg.video) return msg.video.fileName; if (msg.audio) return msg.audio.fileName || 'Audio'; if (msg.hasPhoto) return 'Photo'; return msg.text?.slice(0, 30) || 'Message'; }
function getMessageFileSize(msg: TelegramMessage): number | undefined { if (msg.document) return msg.document.size; if (msg.video) return msg.video.size; if (msg.audio) return msg.audio.size; return undefined; }

export function CRTTelegramPage() {
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
        <CRTLayout>
            <CRTTitle>Telegram Import</CRTTitle>

            <div className="crt-panels crt-panels-2" style={{ height: 'calc(100vh - 180px)' }}>
                <CRTPanel header="Channels" className="flex flex-col">
                    <CRTButton onClick={loadChats} variant="primary" className="mb-3 w-full"><RefreshCw className={cn("w-4 h-4", chatsLoading && "animate-spin")} /> [REFRESH]</CRTButton>
                    <div className="flex-1 overflow-y-auto">
                        {chats.map(c => (
                            <button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 border-b border-dashed border-[var(--crt-green-dim)] flex items-center gap-3", selectedChatId === c.id ? "bg-[rgba(0,255,65,0.1)]" : "hover:bg-[rgba(0,255,65,0.05)]")}>
                                {c.type === 'group' ? <Users className="w-4 h-4" /> : c.type === 'channel' ? <Megaphone className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                <span className="truncate">{c.title}</span>
                            </button>
                        ))}
                    </div>
                </CRTPanel>

                <CRTPanel header={selectedChat?.title || 'Select Channel'} className="flex flex-col">
                    <div className="flex gap-1 mb-3">{['all', 'video', 'photo', 'document'].map(t => (<button key={t} onClick={() => setFileTypeFilter(t as any)} className={cn("crt-btn !px-2 !py-1 !text-xs", fileTypeFilter === t && "crt-btn-primary")}>[{t.toUpperCase()}]</button>))}</div>
                    <div className="flex-1 overflow-y-auto">
                        {!selectedChatId ? <CRTEmpty text="SELECT A CHANNEL" /> :
                            messagesLoading && messages.length === 0 ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--crt-green)]" /></div> :
                                messages.length === 0 ? <CRTEmpty text="NO FILES" /> :
                                    messages.map(msg => {
                                        const type = getMessageMediaType(msg);
                                        const Icon = type === 'video' ? Video : type === 'photo' ? Image : type === 'audio' ? Music : FileText;
                                        return (
                                            <CRTFileRow
                                                key={msg.id}
                                                icon={<Icon className="w-5 h-5" />}
                                                name={getMessageFileName(msg)}
                                                meta={getMessageFileSize(msg) ? formatFileSize(getMessageFileSize(msg)!) : undefined}
                                                actions={<CRTButton variant="primary" onClick={() => { setSelectedMessage(msg); setShowImport(true); }}><Download className="w-4 h-4" /></CRTButton>}
                                            />
                                        );
                                    })}
                        {hasMoreMessages && <div className="p-3 text-center"><CRTButton variant="primary" onClick={() => loadMessages(selectedChatId!, messages[messages.length - 1].id)}><ChevronDown className="w-4 h-4" /> [MORE]</CRTButton></div>}
                    </div>
                </CRTPanel>
            </div>

            <CRTModal open={showImport} onClose={() => setShowImport(false)} title="IMPORT FILE" footer={<><CRTButton onClick={() => setShowImport(false)}>[CANCEL]</CRTButton><CRTButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} [IMPORT]</CRTButton></>}>
                <p className="mb-4">&gt; FILE: {selectedMessage && getMessageFileName(selectedMessage)}</p>
                <p className="text-[var(--crt-amber)] text-sm mb-2">SELECT TARGET DIR:</p>
                <div className="max-h-48 overflow-y-auto border border-[var(--crt-green-dim)]">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b border-dashed border-[var(--crt-green-dim)] flex items-center gap-3", !selectedFolder && "bg-[rgba(0,255,65,0.1)]")}><FolderOpen className="w-4 h-4" /> /ROOT</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b border-dashed border-[var(--crt-green-dim)] flex items-center gap-3", selectedFolder === f.id && "bg-[rgba(0,255,65,0.1)]")}><FolderOpen className="w-4 h-4" /> /{f.name.toUpperCase()}</button>))}
                </div>
            </CRTModal>
        </CRTLayout>
    );
}
