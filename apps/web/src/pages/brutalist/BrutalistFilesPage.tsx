import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Search, ChevronRight, Loader2 } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistButton, BrutalistEmpty, BrutalistInput, BrutalistModal, BrutalistFileRow, BrutalistBadge, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function BrutalistFilesPage() {
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
        <BrutalistLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <BrutalistTitle>Files</BrutalistTitle>
                    {breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-2 -mt-4">
                            <Link to="/files" className="font-bold hover:underline">Files</Link>
                            {breadcrumbs.map((c) => (<span key={c.id} className="flex items-center gap-2"><ChevronRight className="w-4 h-4" /><Link to={`/files?folderId=${c.id}`} className="font-bold hover:underline">{c.name}</Link></span>))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="brutalist-btn brutalist-btn-yellow cursor-pointer"><Upload className="w-5 h-5" /> Upload</span></label>
                    <BrutalistButton color="pink" onClick={() => setShowNewFolder(true)}><FolderPlus className="w-5 h-5" /> New Folder</BrutalistButton>
                </div>
            </div>

            {/* Search & Bulk */}
            <BrutalistCard className="mb-6 flex items-center justify-between gap-4">
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="brutalist-input !pl-12" />
                </div>
                {selected.size > 0 && (
                    <div className="flex items-center gap-3">
                        <BrutalistBadge color="pink">{selected.size} selected</BrutalistBadge>
                        <BrutalistButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</BrutalistButton>
                        <BrutalistButton color="red" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></BrutalistButton>
                    </div>
                )}
            </BrutalistCard>

            {/* Content */}
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <BrutalistEmpty text={search ? 'No matching files' : 'This folder is empty'} icon={<Folder />} /> : (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {filteredFolders.map((folder) => (
                            <BrutalistCard key={folder.id} color="yellow" onClick={() => setSearchParams({ folderId: folder.id })} className="flex items-center gap-3">
                                <Folder className="w-8 h-8" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{folder.name}</p>
                                    <p className="text-sm">{folder._count?.files || 0} files</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-2 hover:bg-black/10"><Trash2 className="w-4 h-4" /></button>
                            </BrutalistCard>
                        ))}
                    </div>
                )}

            {filteredFiles.length > 0 && (
                <BrutalistCard className="!p-0">
                    {filteredFiles.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        return (
                            <BrutalistFileRow
                                key={file.id}
                                icon={<Icon className="w-6 h-6" />}
                                name={file.originalName || file.name}
                                meta={formatFileSize(file.size)}
                                selected={selected.has(file.id)}
                                onClick={() => toggleSelect(file.id)}
                                actions={
                                    <div className="flex items-center gap-2">
                                        {file.isStarred && <BrutalistBadge color="yellow">★</BrutalistBadge>}
                                        <button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }}><Star className={cn("w-5 h-5", file.isStarred && "fill-current")} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }}><Download className="w-5 h-5" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="text-red-600"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                }
                            />
                        );
                    })}
                </BrutalistCard>
            )}

            <BrutalistModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={<><BrutalistButton onClick={() => setShowNewFolder(false)}>Cancel</BrutalistButton><BrutalistButton color="yellow" onClick={handleCreateFolder}>Create</BrutalistButton></>}>
                <BrutalistInput value={newFolderName} onChange={setNewFolderName} placeholder="Folder name" />
            </BrutalistModal>

            <BrutalistModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><BrutalistButton onClick={() => setShowMove(false)}>Cancel</BrutalistButton><BrutalistButton color="blue" onClick={handleBulkMove}>Move</BrutalistButton></>}>
                <div className="max-h-64 overflow-y-auto border-3 border-black">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b-2 border-black flex items-center gap-3 font-semibold", !moveTarget && "bg-[var(--brutalist-yellow)]")}><Folder className="w-5 h-5" /> Root</button>
                    {allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b-2 border-black flex items-center gap-3 font-semibold", moveTarget === f.id && "bg-[var(--brutalist-yellow)]")}><Folder className="w-5 h-5" /> {f.name}</button>))}
                </div>
            </BrutalistModal>
        </BrutalistLayout>
    );
}
