import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MessageSquare, Users, Megaphone, User, Download, FileText, Image, Video, Loader2, RefreshCw, FolderOpen, Music, Search, Play, ChevronDown } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton, BlueprintFileRow, BlueprintEmpty, BlueprintModal, BlueprintInput } from '@/components/blueprint/BlueprintComponents';
import { useTelegramStore, TelegramMessage, FileTypeFilter } from '@/stores/telegram.store';
import { useFilesStore, Folder } from '@/stores/files.store';
import { telegramApi, foldersApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';

const FILE_TYPE_TABS: { value: FileTypeFilter; label: string }[] = [{ value: 'all', label: 'All' }, { value: 'video', label: 'Video' }, { value: 'photo', label: 'Photo' }, { value: 'document', label: 'Doc' }, { value: 'audio', label: 'Audio' }];

function getMessageMediaType(msg: TelegramMessage): string { if (msg.hasVideo) return 'video'; if (msg.hasPhoto) return 'photo'; if (msg.hasAudio) return 'audio'; if (msg.hasDocument) return 'document'; return 'text'; }
function getMessageFileName(msg: TelegramMessage): string { if (msg.document) return msg.document.fileName; if (msg.video) return msg.video.fileName; if (msg.audio) return msg.audio.fileName || msg.audio.title || 'Audio'; if (msg.hasPhoto) return 'Photo'; return msg.text?.slice(0, 30) || 'Message'; }
function getMessageFileSize(msg: TelegramMessage): number | undefined { if (msg.document) return msg.document.size; if (msg.video) return msg.video.size; if (msg.audio) return msg.audio.size; if (msg.photo) return msg.photo.size; return undefined; }
function getFileIcon(type: string) { if (type === 'video') return Video; if (type === 'photo') return Image; if (type === 'audio') return Music; return FileText; }

export function BlueprintTelegramPage() {
    const { chats, chatsLoading, selectedChatId, messages, messagesLoading, hasMoreMessages, fileTypeFilter, importingFile, setChats, setChatsLoading, selectChat, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages, setFileTypeFilter, setImportingFile, updateImportStatus } = useTelegramStore();
    const { folders, setFolders } = useFilesStore();
    const [showImport, setShowImport] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<TelegramMessage | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [chatSearch, setChatSearch] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewMessage, setPreviewMessage] = useState<TelegramMessage | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const loadChats = useCallback(async () => { setChatsLoading(true); try { const r = await telegramApi.getChats(); setChats(r.data?.data || []); } catch (e) { console.error(e); } finally { setChatsLoading(false); } }, [setChats, setChatsLoading]);
    const loadMessages = useCallback(async (chatId: string, offsetId?: number) => { setMessagesLoading(true); try { const params: { limit: number; offsetId?: number; filesOnly: boolean; fileType?: 'video' | 'photo' | 'document' | 'audio' } = { limit: 50, offsetId, filesOnly: true }; if (fileTypeFilter && fileTypeFilter !== 'all') params.fileType = fileTypeFilter; const r = await telegramApi.getChatMessages(chatId, params); if (offsetId) appendMessages(r.data?.data || []); else setMessages(r.data?.data || []); setHasMoreMessages(r.data?.meta?.hasMore || false); } catch (e) { console.error(e); } finally { setMessagesLoading(false); } }, [fileTypeFilter, setMessages, appendMessages, setMessagesLoading, setHasMoreMessages]);
    const loadFolders = useCallback(async () => { try { const r = await foldersApi.getFolders(); setFolders(r.data?.data || []); } catch (e) { console.error(e); } }, [setFolders]);

    useEffect(() => { loadChats(); loadFolders(); }, [loadChats, loadFolders]);
    useEffect(() => { if (selectedChatId) loadMessages(selectedChatId); }, [selectedChatId, fileTypeFilter, loadMessages]);

    const handleLoadMore = () => { if (selectedChatId && messages.length > 0) loadMessages(selectedChatId, messages[messages.length - 1].id); };
    const handleImport = async () => { if (!selectedMessage || !selectedChatId) return; setImporting(true); try { const response = await telegramApi.importFile(selectedChatId, selectedMessage.id, selectedFolder || undefined); if (response.data.deferred && response.data.importId) { setImportingFile({ chatId: selectedChatId, messageId: selectedMessage.id, fileName: getMessageFileName(selectedMessage), status: 'importing' }); const importId = response.data.importId; let pollCount = 0; const pollInterval = setInterval(async () => { pollCount++; if (pollCount >= 100) { clearInterval(pollInterval); updateImportStatus('error', 'Timeout'); setTimeout(() => setImportingFile(null), 5000); return; } try { const s = await telegramApi.getImportStatus(importId); const i = s.data.data; if (i.status === 'completed') { clearInterval(pollInterval); updateImportStatus('success', undefined, i.result?.fileId); setTimeout(() => setImportingFile(null), 3000); } else if (i.status === 'failed' || i.status === 'aborted') { clearInterval(pollInterval); updateImportStatus('error', i.error || 'Failed'); setTimeout(() => setImportingFile(null), 5000); } } catch (err: any) { if (err.response?.status === 404) { clearInterval(pollInterval); updateImportStatus('error', 'Expired'); setTimeout(() => setImportingFile(null), 5000); } } }, 3000); } else { updateImportStatus('success'); setTimeout(() => setImportingFile(null), 3000); } setShowImport(false); setSelectedMessage(null); } catch (e) { console.error(e); } finally { setImporting(false); } };
    const handlePreview = (msg: TelegramMessage) => { setPreviewMessage(msg); setShowPreview(true); };

    const selectedChat = chats.find(c => c.id === selectedChatId);
    const getChatIcon = (type: string) => type === 'group' ? Users : type === 'channel' ? Megaphone : User;
    const filteredChats = useMemo(() => !chatSearch.trim() ? chats : chats.filter(c => c.title.toLowerCase().includes(chatSearch.toLowerCase())), [chats, chatSearch]);
    const getStreamUrl = (chatId: string, messageId: number) => { const token = localStorage.getItem('token'); const baseUrl = import.meta.env.VITE_API_URL || '/api'; return `${baseUrl}/telegram/chats/${chatId}/messages/${messageId}/stream?token=${token}`; };

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Telegram Import" subtitle="Import files from chats" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: 'calc(100vh - 180px)' }}>
                <BlueprintCard className="!p-0 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-[var(--blueprint-line-dim)]"><BlueprintInput value={chatSearch} onChange={setChatSearch} placeholder="Search..." icon={<Search className="w-4 h-4" />} /></div>
                    <div className="flex-1 overflow-y-auto">{chatsLoading && filteredChats.length === 0 ? <div className="p-6 text-center"><Loader2 className="w-5 h-5 text-[var(--blueprint-cyan)] animate-spin mx-auto" /></div> : filteredChats.map(c => { const Icon = getChatIcon(c.type); return (<button key={c.id} onClick={() => selectChat(c.id)} className={cn("w-full text-left p-3 border-b border-[var(--blueprint-line-dim)] flex items-center gap-3 text-sm", selectedChatId === c.id ? "bg-[rgba(0,150,199,0.1)]" : "hover:bg-[rgba(0,150,199,0.05)]")}><Icon className={cn("w-4 h-4", selectedChatId === c.id ? "text-[var(--blueprint-cyan)]" : "text-[var(--blueprint-text-dim)]")} /><span className={cn("truncate", selectedChatId === c.id && "text-[var(--blueprint-cyan)]")}>{c.title}</span></button>); })}</div>
                    <div className="p-3 border-t border-[var(--blueprint-line-dim)]"><BlueprintButton onClick={loadChats} className="w-full"><RefreshCw className={cn("w-4 h-4 mr-2", chatsLoading && "animate-spin")} /> Refresh</BlueprintButton></div>
                </BlueprintCard>
                <div className="lg:col-span-3">
                    <BlueprintCard className="h-full !p-0 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-[var(--blueprint-line-dim)] flex items-center justify-between"><h3 className="text-xs uppercase tracking-wide text-[var(--blueprint-cyan)]">{selectedChat?.title || 'Select chat'}</h3>{selectedChatId && <div className="flex items-center gap-1">{FILE_TYPE_TABS.map(t => (<button key={t.value} onClick={() => setFileTypeFilter(t.value)} className={cn("px-2 py-1 text-xs uppercase tracking-wide", fileTypeFilter === t.value ? "bg-[var(--blueprint-cyan)] text-[var(--blueprint-bg)]" : "border border-[var(--blueprint-line-dim)] text-[var(--blueprint-text-dim)]")}>{t.label}</button>))}</div>}</div>
                        <div className="flex-1 overflow-y-auto">{!selectedChatId ? <BlueprintEmpty icon={<MessageSquare className="w-8 h-8" />} text="Select a chat" /> : messagesLoading && messages.length === 0 ? <div className="p-6 text-center"><Loader2 className="w-5 h-5 text-[var(--blueprint-cyan)] animate-spin mx-auto" /></div> : messages.length === 0 ? <BlueprintEmpty icon={<FileText className="w-8 h-8" />} text="No files" /> : <>{messages.map(msg => { const mediaType = getMessageMediaType(msg); const Icon = getFileIcon(mediaType); const fileName = getMessageFileName(msg); const fileSize = getMessageFileSize(msg); const canPreview = mediaType === 'video' || mediaType === 'audio'; return (<BlueprintFileRow key={msg.id} icon={<Icon className="w-4 h-4" />} name={fileName} meta={fileSize ? formatFileSize(fileSize) : undefined} actions={<div className="flex items-center gap-2">{canPreview && <BlueprintButton variant="ghost" onClick={() => handlePreview(msg)}><Play className="w-4 h-4" /></BlueprintButton>}<BlueprintButton variant="primary" onClick={() => { setSelectedMessage(msg); setShowImport(true); }}><Download className="w-4 h-4" /></BlueprintButton></div>} />); })}{hasMoreMessages && <div className="p-4 text-center"><BlueprintButton onClick={handleLoadMore} disabled={messagesLoading}>{messagesLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />} Load More</BlueprintButton></div>}</>}</div>
                        {importingFile && <div className="p-3 border-t border-[var(--blueprint-line-dim)]"><span className={cn("text-xs uppercase tracking-wide", importingFile.status === 'error' ? 'text-[var(--blueprint-error)]' : importingFile.status === 'success' ? 'text-[var(--blueprint-success)]' : 'text-[var(--blueprint-cyan)]')}>{importingFile.status === 'importing' && <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />}{importingFile.status === 'success' ? '✓ Imported' : importingFile.status === 'error' ? '✗ Failed' : 'Importing...'} {importingFile.fileName}</span></div>}
                    </BlueprintCard>
                </div>
            </div>

            <BlueprintModal open={showImport} onClose={() => setShowImport(false)} title="Import File" footer={<><BlueprintButton onClick={() => setShowImport(false)}>Cancel</BlueprintButton><BlueprintButton variant="primary" onClick={handleImport} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Import</BlueprintButton></>}>
                <p className="text-xs text-[var(--blueprint-text-dim)] mb-4">File: <span className="text-[var(--blueprint-cyan)]">{selectedMessage && getMessageFileName(selectedMessage)}</span></p>
                <label className="block text-xs uppercase tracking-wide text-[var(--blueprint-text-dim)] mb-2">Folder</label>
                <div className="max-h-48 overflow-y-auto border border-[var(--blueprint-line-dim)]">
                    <button onClick={() => setSelectedFolder(null)} className={cn("w-full text-left p-3 border-b border-[var(--blueprint-line-dim)] flex items-center gap-3 text-sm", !selectedFolder ? "bg-[rgba(0,150,199,0.1)] text-[var(--blueprint-cyan)]" : "hover:bg-[rgba(0,150,199,0.05)]")}><FolderOpen className="w-4 h-4" /> Root</button>
                    {folders.map((f: Folder) => (<button key={f.id} onClick={() => setSelectedFolder(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--blueprint-line-dim)] flex items-center gap-3 text-sm", selectedFolder === f.id ? "bg-[rgba(0,150,199,0.1)] text-[var(--blueprint-cyan)]" : "hover:bg-[rgba(0,150,199,0.05)]")}><FolderOpen className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </BlueprintModal>

            {showPreview && previewMessage && selectedChatId && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8" onClick={() => setShowPreview(false)}>
                    <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        <BlueprintCard>
                            <div className="flex items-center justify-between mb-4"><h3 className="text-xs uppercase tracking-wide text-[var(--blueprint-cyan)]">{getMessageFileName(previewMessage)}</h3><BlueprintButton onClick={() => setShowPreview(false)}>Close</BlueprintButton></div>
                            <div className="aspect-video bg-black border border-[var(--blueprint-line-dim)] overflow-hidden">{getMessageMediaType(previewMessage) === 'video' ? <video ref={videoRef} src={getStreamUrl(selectedChatId, previewMessage.id)} controls autoPlay className="w-full h-full" /> : <audio src={getStreamUrl(selectedChatId, previewMessage.id)} controls autoPlay className="w-full mt-20" />}</div>
                            <div className="mt-4 text-right"><BlueprintButton variant="primary" onClick={() => { setSelectedMessage(previewMessage); setShowPreview(false); setShowImport(true); }}><Download className="w-4 h-4 mr-2" /> Import</BlueprintButton></div>
                        </BlueprintCard>
                    </div>
                </div>
            )}
        </BlueprintLayout>
    );
}
