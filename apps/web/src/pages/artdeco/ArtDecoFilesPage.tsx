import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Search, ChevronRight, Loader2 } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoButton, DecoEmpty, DecoInput, DecoModal, DecoFileRow, DecoBadge, DecoTitle, DecoDivider } from '@/components/artdeco/ArtDecoComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function ArtDecoFilesPage() {
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
        <ArtDecoLayout>
            <div className="flex items-center justify-between mb-6">
                <DecoTitle>File Archive</DecoTitle>
                <div className="flex items-center gap-4">
                    <label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="deco-btn deco-btn-primary cursor-pointer"><Upload className="w-5 h-5" /> Upload</span></label>
                    <DecoButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-5 h-5" /> New Folder</DecoButton>
                </div>
            </div>

            {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 mb-6 text-[var(--deco-text-muted)]">
                    <Link to="/files" className="hover:text-[var(--deco-gold)]">Files</Link>
                    {breadcrumbs.map((c) => (<span key={c.id} className="flex items-center gap-2"><ChevronRight className="w-4 h-4" /><Link to={`/files?folderId=${c.id}`} className="hover:text-[var(--deco-gold)]">{c.name}</Link></span>))}
                </div>
            )}

            <DecoCard className="!p-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--deco-gold-dark)]" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="deco-input !pl-12" />
                    </div>
                    {selected.size > 0 && (
                        <div className="flex items-center gap-3">
                            <DecoBadge color="sage">{selected.size} selected</DecoBadge>
                            <DecoButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</DecoButton>
                            <DecoButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></DecoButton>
                        </div>
                    )}
                </div>
            </DecoCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--deco-gold)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <DecoEmpty text={search ? 'No matches found' : 'This folder is empty'} /> : (
                    <>
                        {filteredFolders.length > 0 && (
                            <>
                                <DecoDivider text="Folders" />
                                <div className="deco-grid deco-grid-4 mb-6">
                                    {filteredFolders.map((folder) => (
                                        <DecoCard key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })} className="text-center !py-6">
                                            <Folder className="w-10 h-10 mx-auto mb-3 text-[var(--deco-gold)]" />
                                            <p className="font-medium truncate">{folder.name}</p>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="mt-3 text-[var(--deco-rose)] text-sm hover:underline">Delete</button>
                                        </DecoCard>
                                    ))}
                                </div>
                            </>
                        )}
                        {filteredFiles.length > 0 && (
                            <>
                                <DecoDivider text="Files" />
                                <DecoCard>
                                    {filteredFiles.map((file) => {
                                        const Icon = getFileIcon(file.mimeType);
                                        return (
                                            <DecoFileRow
                                                key={file.id}
                                                icon={<Icon className="w-6 h-6" />}
                                                name={file.originalName || file.name}
                                                meta={formatFileSize(file.size)}
                                                selected={selected.has(file.id)}
                                                onClick={() => toggleSelect(file.id)}
                                                actions={
                                                    <div className="flex items-center gap-2">
                                                        {file.isStarred && <DecoBadge>★</DecoBadge>}
                                                        <button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="p-1 hover:text-[var(--deco-gold)]"><Star className={cn("w-5 h-5", file.isStarred && "fill-current")} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1 hover:text-[var(--deco-gold)]"><Download className="w-5 h-5" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1 text-[var(--deco-rose)]"><Trash2 className="w-5 h-5" /></button>
                                                    </div>
                                                }
                                            />
                                        );
                                    })}
                                </DecoCard>
                            </>
                        )}
                    </>
                )}

            <DecoModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={<><DecoButton onClick={() => setShowNewFolder(false)}>Cancel</DecoButton><DecoButton variant="primary" onClick={handleCreateFolder}>Create</DecoButton></>}>
                <DecoInput value={newFolderName} onChange={setNewFolderName} placeholder="Enter folder name..." />
            </DecoModal>

            <DecoModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><DecoButton onClick={() => setShowMove(false)}>Cancel</DecoButton><DecoButton variant="primary" onClick={handleBulkMove}>Move</DecoButton></>}>
                <div className="max-h-64 overflow-y-auto border border-[var(--deco-gold-dark)]">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b border-[var(--deco-gold-dark)] flex items-center gap-3", !moveTarget && "bg-[rgba(212,175,55,0.1)]")}><Folder className="w-5 h-5" /> Root</button>
                    {allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--deco-gold-dark)] flex items-center gap-3", moveTarget === f.id && "bg-[rgba(212,175,55,0.1)]")}><Folder className="w-5 h-5" /> {f.name}</button>))}
                </div>
            </DecoModal>
        </ArtDecoLayout>
    );
}
