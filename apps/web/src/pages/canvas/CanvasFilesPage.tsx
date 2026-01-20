import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Search, ChevronRight, Loader2 } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasCard, CanvasButton, CanvasEmpty, CanvasInput, CanvasModal, CanvasFileRow, CanvasBadge, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function CanvasFilesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const folderId = searchParams.get('folderId') || undefined;
    const { files, folders, setFiles, setFolders } = useFilesStore();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showMove, setShowMove] = useState(false);
    const [moveTarget, setMoveTarget] = useState<string | null>(null);
    const [allFolders, setAllFolders] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [filesRes, foldersRes] = await Promise.all([filesApi.getFiles({ folderId, search: search || undefined }), foldersApi.getFolders(folderId)]);
            setFiles(filesRes.data?.data || []);
            setFolders(foldersRes.data?.data || []);
            if (folderId) { const r = await foldersApi.getFolder(folderId); setBreadcrumbs(r.data?.data?.path || []); }
            else { setBreadcrumbs([]); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [folderId, search, setFiles, setFolders]);

    useEffect(() => { loadData(); }, [loadData]);
    const loadAllFolders = async () => { const r = await foldersApi.getFolders(); setAllFolders(r.data?.data || []); };
    const handleCreateFolder = async () => { if (!newFolderName.trim()) return; await foldersApi.createFolder(newFolderName.trim(), folderId); setNewFolderName(''); setShowNewFolder(false); loadData(); };
    const handleDelete = async (id: string) => { if (!confirm('Move to trash?')) return; await filesApi.deleteFile(id, false); loadData(); };
    const handleDeleteFolder = async (id: string) => { if (!confirm('Delete folder?')) return; await foldersApi.deleteFolder(id); loadData(); };
    const handleStar = async (id: string) => { await filesApi.toggleStar(id); loadData(); };
    const handleDownload = async (file: any) => { const r = await filesApi.downloadFile(file.id); window.open(r.data?.data?.url, '_blank'); };
    const toggleSelect = (id: string) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };
    const handleBulkDelete = async () => { if (!confirm(`Delete ${selected.size} files?`)) return; await bulkApi.deleteFiles(Array.from(selected), false); setSelected(new Set()); loadData(); };
    const handleBulkMove = async () => { await bulkApi.moveFiles(Array.from(selected), moveTarget); setSelected(new Set()); setShowMove(false); loadData(); };
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files; if (!f?.length) return; for (const file of Array.from(f)) { await filesApi.uploadFile(file, folderId); } loadData(); e.target.value = ''; };

    const filteredFiles = files.filter(f => !search || f.originalName?.toLowerCase().includes(search.toLowerCase()));
    const filteredFolders = folders.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <CanvasLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <CanvasTitle>Files</CanvasTitle>
                    {breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-2 -mt-3 text-[var(--canvas-text-muted)] text-sm">
                            <Link to="/files" className="hover:text-white">Root</Link>
                            {breadcrumbs.map((c) => (<span key={c.id} className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /><Link to={`/files?folderId=${c.id}`} className="hover:text-white">{c.name}</Link></span>))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="canvas-btn canvas-btn-primary cursor-pointer"><Upload className="w-4 h-4" /> Upload</span></label>
                    <CanvasButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4" /> New Folder</CanvasButton>
                </div>
            </div>

            <CanvasWindow title="Search & Actions" icon={<Search className="w-4 h-4" />} zLevel="far" className="mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--canvas-text-muted)]" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="canvas-input !pl-10" />
                    </div>
                    {selected.size > 0 && (
                        <div className="flex items-center gap-3">
                            <CanvasBadge color="pink">{selected.size} selected</CanvasBadge>
                            <CanvasButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</CanvasButton>
                            <CanvasButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></CanvasButton>
                        </div>
                    )}
                </div>
            </CanvasWindow>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--canvas-accent)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <CanvasEmpty text={search ? 'No matching files' : 'This folder is empty'} icon={<Folder className="w-12 h-12" />} /> : (
                    <>
                        {filteredFolders.length > 0 && (
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                {filteredFolders.map((folder) => (
                                    <CanvasCard key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })} className="flex items-center gap-3">
                                        <Folder className="w-8 h-8 text-[var(--canvas-accent)]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{folder.name}</p>
                                            <p className="text-xs text-[var(--canvas-text-muted)]">{folder._count?.files || 0} files</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                    </CanvasCard>
                                ))}
                            </div>
                        )}
                        {filteredFiles.length > 0 && (
                            <CanvasWindow title={`Files (${filteredFiles.length})`} icon={<FileText className="w-4 h-4" />} zLevel="mid">
                                {filteredFiles.map((file) => {
                                    const Icon = getFileIcon(file.mimeType);
                                    return (
                                        <CanvasFileRow
                                            key={file.id}
                                            icon={<Icon className="w-5 h-5" />}
                                            name={file.originalName || file.name}
                                            meta={formatFileSize(file.size)}
                                            selected={selected.has(file.id)}
                                            onClick={() => toggleSelect(file.id)}
                                            actions={
                                                <div className="flex items-center gap-1">
                                                    {file.isStarred && <CanvasBadge color="pink">★</CanvasBadge>}
                                                    <button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="p-1 hover:text-[var(--canvas-accent)]"><Star className={cn("w-4 h-4", file.isStarred && "fill-current")} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1 hover:text-[var(--canvas-accent)]"><Download className="w-4 h-4" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            }
                                        />
                                    );
                                })}
                            </CanvasWindow>
                        )}
                    </>
                )}

            <CanvasModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={<><CanvasButton onClick={() => setShowNewFolder(false)}>Cancel</CanvasButton><CanvasButton variant="primary" onClick={handleCreateFolder}>Create</CanvasButton></>}>
                <CanvasInput value={newFolderName} onChange={setNewFolderName} placeholder="Folder name" />
            </CanvasModal>

            <CanvasModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><CanvasButton onClick={() => setShowMove(false)}>Cancel</CanvasButton><CanvasButton variant="primary" onClick={handleBulkMove}>Move</CanvasButton></>}>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--canvas-border)]">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 flex items-center gap-3 border-b border-[var(--canvas-border)]", !moveTarget && "bg-[var(--canvas-surface)]")}><Folder className="w-4 h-4" /> Root</button>
                    {allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 flex items-center gap-3 border-b border-[var(--canvas-border)]", moveTarget === f.id && "bg-[var(--canvas-surface)]")}><Folder className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </CanvasModal>
        </CanvasLayout>
    );
}
