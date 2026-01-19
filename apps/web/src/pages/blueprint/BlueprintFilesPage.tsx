import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Search, ChevronRight, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton, BlueprintFileRow, BlueprintEmpty, BlueprintInput, BlueprintModal } from '@/components/blueprint/BlueprintComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function BlueprintFilesPage() {
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
        <BlueprintLayout>
            <BlueprintHeader title="File System" subtitle={`${files.length} files, ${folders.length} folders`} actions={
                <div className="flex items-center gap-3">
                    <label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="blueprint-btn blueprint-btn-primary cursor-pointer"><Upload className="w-4 h-4 mr-2" /> Upload</span></label>
                    <BlueprintButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4 mr-2" /> New Folder</BlueprintButton>
                </div>
            } />

            {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-wide">
                    <Link to="/files" className="text-[var(--blueprint-cyan)]">Files</Link>
                    {breadcrumbs.map((c) => (<span key={c.id} className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-[var(--blueprint-text-muted)]" /><Link to={`/files?folderId=${c.id}`} className="text-[var(--blueprint-cyan)]">{c.name}</Link></span>))}
                </div>
            )}

            <BlueprintCard className="mb-4 !p-3">
                <div className="flex items-center justify-between">
                    <BlueprintInput value={search} onChange={setSearch} placeholder="Search..." icon={<Search className="w-4 h-4" />} className="w-72" />
                    {selected.size > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-[var(--blueprint-text-dim)]">{selected.size} selected</span>
                            <BlueprintButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</BlueprintButton>
                            <BlueprintButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></BlueprintButton>
                        </div>
                    )}
                </div>
            </BlueprintCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <BlueprintEmpty icon={<Folder className="w-8 h-8" />} text={search ? 'No matches' : 'Empty folder'} /> : (
                    <BlueprintCard className="!p-0 overflow-hidden">
                        {filteredFolders.map((f) => (
                            <BlueprintFileRow key={f.id} icon={<Folder className="w-4 h-4" />} name={f.name} meta={`${f._count?.files || 0} files`} onClick={() => setSearchParams({ folderId: f.id })} actions={<BlueprintButton variant="ghost" onClick={() => handleDeleteFolder(f.id)}><Trash2 className="w-4 h-4" /></BlueprintButton>} />
                        ))}
                        {filteredFiles.map((file) => {
                            const Icon = getFileIcon(file.mimeType);
                            return <BlueprintFileRow key={file.id} icon={<Icon className="w-4 h-4" />} name={file.originalName || file.name} meta={formatFileSize(file.size)} selected={selected.has(file.id)} onClick={() => toggleSelect(file.id)} actions={
                                <div className="flex items-center gap-1">
                                    <BlueprintButton variant="ghost" onClick={() => handleStar(file.id)}><Star className={cn("w-4 h-4", file.isStarred && "fill-current text-[var(--blueprint-cyan)]")} /></BlueprintButton>
                                    <BlueprintButton variant="ghost" onClick={() => handleDownload(file)}><Download className="w-4 h-4" /></BlueprintButton>
                                    <BlueprintButton variant="ghost" onClick={() => handleDelete(file.id)}><Trash2 className="w-4 h-4" /></BlueprintButton>
                                </div>
                            } />;
                        })}
                    </BlueprintCard>
                )}

            <BlueprintModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={<><BlueprintButton onClick={() => setShowNewFolder(false)}>Cancel</BlueprintButton><BlueprintButton variant="primary" onClick={handleCreateFolder}>Create</BlueprintButton></>}>
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name" className="blueprint-input" autoFocus />
            </BlueprintModal>

            <BlueprintModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><BlueprintButton onClick={() => setShowMove(false)}>Cancel</BlueprintButton><BlueprintButton variant="primary" onClick={handleBulkMove}>Move</BlueprintButton></>}>
                <div className="max-h-48 overflow-y-auto border border-[var(--blueprint-line-dim)]">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b border-[var(--blueprint-line-dim)] flex items-center gap-3 text-sm", !moveTarget ? "bg-[rgba(0,150,199,0.1)] text-[var(--blueprint-cyan)]" : "hover:bg-[rgba(0,150,199,0.05)]")}><Folder className="w-4 h-4" /> Root</button>
                    {allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--blueprint-line-dim)] flex items-center gap-3 text-sm", moveTarget === f.id ? "bg-[rgba(0,150,199,0.1)] text-[var(--blueprint-cyan)]" : "hover:bg-[rgba(0,150,199,0.05)]")}><Folder className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </BlueprintModal>
        </BlueprintLayout>
    );
}
