import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Trash2, Star, Download, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenEmpty, ZenInput, ZenModal, ZenFileRow, ZenBadge, ZenTitle, ZenSection } from '@/components/zen/ZenComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function ZenFilesPage() {
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
        <ZenLayout>
            <div className="flex items-center justify-between" style={{ marginBottom: '64px' }}>
                <ZenTitle subtitle={breadcrumbs.length ? breadcrumbs.map(c => c.name).join(' / ') : 'Your collection'}>Files</ZenTitle>
                <div className="flex items-center gap-4"><label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="zen-btn zen-btn-primary cursor-pointer">Upload</span></label><ZenButton onClick={() => setShowNewFolder(true)}>New Folder</ZenButton></div>
            </div>

            <ZenSection>
                <div className="flex items-center justify-between gap-8" style={{ marginBottom: '40px' }}>
                    <ZenInput value={search} onChange={setSearch} placeholder="Search" className="max-w-sm" />
                    {selected.size > 0 && (<div className="flex items-center gap-4"><ZenBadge>{selected.size} selected</ZenBadge><ZenButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</ZenButton><ZenButton onClick={handleBulkDelete}><Trash2 className="w-3 h-3" /></ZenButton></div>)}
                </div>
            </ZenSection>

            {loading ? <div className="flex items-center justify-center" style={{ minHeight: '30vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <ZenEmpty text={search ? 'No results' : 'Empty'} /> : (
                    <>
                        {filteredFolders.length > 0 && (<ZenSection title="Folders"><div className="zen-grid zen-grid-4">{filteredFolders.map((folder) => (<ZenCard key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })}><div className="flex items-center gap-4"><Folder className="w-5 h-5 text-[var(--zen-text-light)]" /><div className="flex-1 min-w-0"><p className="truncate">{folder.name}</p><p className="text-xs text-[var(--zen-text-light)]">{folder._count?.files || 0} files</p></div><button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-[var(--zen-text-light)] hover:text-[var(--zen-text)]"><Trash2 className="w-4 h-4" /></button></div></ZenCard>))}</div></ZenSection>)}
                        {filteredFiles.length > 0 && (<ZenSection title="Files"><ZenCard>{filteredFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <ZenFileRow key={file.id} icon={<Icon className="w-4 h-4" />} name={file.originalName || file.name} meta={formatFileSize(file.size)} selected={selected.has(file.id)} onClick={() => toggleSelect(file.id)} actions={<div className="flex items-center gap-3">{file.isStarred && <ZenBadge color="sage">★</ZenBadge>}<button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="text-[var(--zen-text-light)] hover:text-[var(--zen-text)]"><Star className={cn("w-4 h-4", file.isStarred && "fill-current")} /></button><button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="text-[var(--zen-text-light)] hover:text-[var(--zen-text)]"><Download className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="text-[var(--zen-text-light)] hover:text-[var(--zen-text)]"><Trash2 className="w-4 h-4" /></button></div>} />; })}</ZenCard></ZenSection>)}
                    </>
                )}

            <ZenModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={<><ZenButton onClick={() => setShowNewFolder(false)}>Cancel</ZenButton><ZenButton variant="primary" onClick={handleCreateFolder}>Create</ZenButton></>}><ZenInput value={newFolderName} onChange={setNewFolderName} placeholder="Name" /></ZenModal>
            <ZenModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><ZenButton onClick={() => setShowMove(false)}>Cancel</ZenButton><ZenButton variant="primary" onClick={handleBulkMove}>Move</ZenButton></>}><div style={{ maxHeight: '240px', overflow: 'auto' }}><button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 flex items-center gap-3", !moveTarget && "bg-[var(--zen-bg)]")}><Folder className="w-4 h-4" /> Root</button>{allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 flex items-center gap-3", moveTarget === f.id && "bg-[var(--zen-bg)]")}><Folder className="w-4 h-4" /> {f.name}</button>))}</div></ZenModal>
        </ZenLayout>
    );
}
