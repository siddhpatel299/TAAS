import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Search, ChevronRight, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintButton, NewsprintEmpty, NewsprintInput, NewsprintModal, NewsprintFileItem, NewsprintBadge } from '@/components/newsprint/NewsprintComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function NewsprintFilesPage() {
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
        <NewsprintLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Files Section</h1>
                    {breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                            <Link to="/files" className="text-[var(--newsprint-red)] hover:underline">Files</Link>
                            {breadcrumbs.map((c) => (<span key={c.id} className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[var(--newsprint-ink-faded)]" /><Link to={`/files?folderId=${c.id}`} className="text-[var(--newsprint-red)] hover:underline">{c.name}</Link></span>))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="newsprint-btn newsprint-btn-primary cursor-pointer"><Upload className="w-4 h-4 mr-2" /> Upload</span></label>
                    <NewsprintButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4 mr-2" /> New Folder</NewsprintButton>
                </div>
            </div>

            {/* Search & Bulk Actions */}
            <NewsprintCard className="mb-6 !p-4">
                <div className="flex items-center justify-between gap-4">
                    <NewsprintInput value={search} onChange={setSearch} placeholder="Search files..." icon={<Search className="w-4 h-4" />} className="flex-1 max-w-md" />
                    {selected.size > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-[var(--newsprint-ink-muted)]">{selected.size} selected</span>
                            <NewsprintButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</NewsprintButton>
                            <NewsprintButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></NewsprintButton>
                        </div>
                    )}
                </div>
            </NewsprintCard>

            {/* Content */}
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <NewsprintEmpty text={search ? 'No matching files found' : 'This folder is empty. Upload your first file to get started.'} /> : (
                    <div className="grid grid-cols-3 gap-6">
                        {/* Folders Column */}
                        {filteredFolders.length > 0 && (
                            <div>
                                <NewsprintSection title="Folders">
                                    <div className="space-y-2">
                                        {filteredFolders.map((folder) => (
                                            <NewsprintCard key={folder.id} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--newsprint-bg)]" onClick={() => setSearchParams({ folderId: folder.id })}>
                                                <Folder className="w-5 h-5 text-[var(--newsprint-ink-muted)]" />
                                                <span className="flex-1 font-medium">{folder.name}</span>
                                                <span className="text-xs text-[var(--newsprint-ink-faded)]">{folder._count?.files || 0}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 text-[var(--newsprint-red)] opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                            </NewsprintCard>
                                        ))}
                                    </div>
                                </NewsprintSection>
                            </div>
                        )}

                        {/* Files */}
                        <div className={filteredFolders.length > 0 ? "col-span-2" : "col-span-3"}>
                            <NewsprintSection title="Files">
                                <NewsprintCard className="!p-0">
                                    {filteredFiles.map((file) => {
                                        const Icon = getFileIcon(file.mimeType);
                                        return (
                                            <NewsprintFileItem
                                                key={file.id}
                                                icon={<Icon className="w-4 h-4" />}
                                                name={file.originalName || file.name}
                                                meta={formatFileSize(file.size)}
                                                selected={selected.has(file.id)}
                                                onClick={() => toggleSelect(file.id)}
                                                actions={
                                                    <div className="flex items-center gap-2">
                                                        {file.isStarred && <NewsprintBadge variant="red">★</NewsprintBadge>}
                                                        <button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }}><Star className={cn("w-4 h-4", file.isStarred && "fill-current text-[var(--newsprint-red)]")} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }}><Download className="w-4 h-4" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="text-[var(--newsprint-red)]"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                }
                                            />
                                        );
                                    })}
                                </NewsprintCard>
                            </NewsprintSection>
                        </div>
                    </div>
                )}

            <NewsprintModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="Create New Folder" footer={<><NewsprintButton onClick={() => setShowNewFolder(false)}>Cancel</NewsprintButton><NewsprintButton variant="primary" onClick={handleCreateFolder}>Create</NewsprintButton></>}>
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" className="newsprint-input" autoFocus />
            </NewsprintModal>

            <NewsprintModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><NewsprintButton onClick={() => setShowMove(false)}>Cancel</NewsprintButton><NewsprintButton variant="primary" onClick={handleBulkMove}>Move</NewsprintButton></>}>
                <div className="max-h-64 overflow-y-auto border border-[var(--newsprint-rule-light)]">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b border-[var(--newsprint-rule-light)] flex items-center gap-3", !moveTarget ? "bg-[var(--newsprint-bg)]" : "hover:bg-[var(--newsprint-bg)]")}><Folder className="w-4 h-4" /> Root</button>
                    {allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--newsprint-rule-light)] flex items-center gap-3", moveTarget === f.id ? "bg-[var(--newsprint-bg)]" : "hover:bg-[var(--newsprint-bg)]")}><Folder className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </NewsprintModal>
        </NewsprintLayout>
    );
}
