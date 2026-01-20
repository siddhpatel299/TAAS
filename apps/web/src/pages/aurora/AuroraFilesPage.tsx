import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraEmpty, AuroraInput, AuroraModal, AuroraFileRow, AuroraBadge, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function AuroraFilesPage() {
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

    const loadData = useCallback(async () => { setLoading(true); try { const [filesRes, foldersRes] = await Promise.all([filesApi.getFiles({ folderId, search: search || undefined }), foldersApi.getFolders(folderId)]); setFiles(filesRes.data?.data || []); setFolders(foldersRes.data?.data || []); if (folderId) { const r = await foldersApi.getFolder(folderId); setBreadcrumbs(r.data?.data?.path || []); } else { setBreadcrumbs([]); } } catch (e) { console.error(e); } finally { setLoading(false); } }, [folderId, search, setFiles, setFolders]);
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
        <AuroraLayout>
            <div className="flex items-center justify-between mb-6">
                <div><AuroraTitle subtitle={breadcrumbs.length ? breadcrumbs.map(c => c.name).join(' / ') : 'Your personal cloud'}>Files</AuroraTitle></div>
                <div className="flex items-center gap-3"><label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="aurora-btn aurora-btn-primary cursor-pointer"><Upload className="w-4 h-4" /> Upload</span></label><AuroraButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4" /> New Folder</AuroraButton></div>
            </div>

            <AuroraCard className="mb-6">
                <div className="flex items-center justify-between gap-4">
                    <AuroraInput value={search} onChange={setSearch} placeholder="Search files..." className="max-w-md" />
                    {selected.size > 0 && (<div className="flex items-center gap-3"><AuroraBadge color="purple">{selected.size} selected</AuroraBadge><AuroraButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</AuroraButton><AuroraButton onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></AuroraButton></div>)}
                </div>
            </AuroraCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--aurora-gradient-1)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <AuroraEmpty text={search ? 'No matching files' : 'Empty folder'} /> : (
                    <>
                        {filteredFolders.length > 0 && (<div className="aurora-grid aurora-grid-4 mb-6">{filteredFolders.map((folder) => (<AuroraCard key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })}><div className="flex items-center gap-3"><Folder className="w-8 h-8 text-[var(--aurora-gradient-1)]" /><div className="flex-1 min-w-0"><p className="truncate font-medium">{folder.name}</p><p className="text-xs text-[var(--aurora-text-muted)]">{folder._count?.files || 0} files</p></div><button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 hover:text-[var(--aurora-pink)]"><Trash2 className="w-4 h-4" /></button></div></AuroraCard>))}</div>)}
                        {filteredFiles.length > 0 && (<AuroraCard>{filteredFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <AuroraFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={formatFileSize(file.size)} selected={selected.has(file.id)} onClick={() => toggleSelect(file.id)} actions={<div className="flex items-center gap-1">{file.isStarred && <AuroraBadge color="purple">★</AuroraBadge>}<button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="p-1 hover:text-[var(--aurora-pink)]"><Star className={cn("w-4 h-4", file.isStarred && "fill-current")} /></button><button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1 hover:text-[var(--aurora-teal)]"><Download className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1 hover:text-[var(--aurora-pink)]"><Trash2 className="w-4 h-4" /></button></div>} />; })}</AuroraCard>)}
                    </>
                )}

            <AuroraModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={<><AuroraButton onClick={() => setShowNewFolder(false)}>Cancel</AuroraButton><AuroraButton variant="primary" onClick={handleCreateFolder}>Create</AuroraButton></>}><AuroraInput value={newFolderName} onChange={setNewFolderName} placeholder="Folder name..." /></AuroraModal>
            <AuroraModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><AuroraButton onClick={() => setShowMove(false)}>Cancel</AuroraButton><AuroraButton variant="primary" onClick={handleBulkMove}>Move</AuroraButton></>}><div className="max-h-64 overflow-y-auto"><button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 rounded-lg flex items-center gap-3 mb-1", !moveTarget && "bg-[rgba(102,126,234,0.15)]")}><Folder className="w-4 h-4" /> Root</button>{allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 rounded-lg flex items-center gap-3 mb-1", moveTarget === f.id && "bg-[rgba(102,126,234,0.15)]")}><Folder className="w-4 h-4" /> {f.name}</button>))}</div></AuroraModal>
        </AuroraLayout>
    );
}
