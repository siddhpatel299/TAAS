import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, ChevronRight, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveCard, ArchiveButton, ArchiveEmpty, ArchiveInput, ArchiveModal, ArchiveFileRow, ArchiveBadge, ArchiveTitle } from '@/components/archive/ArchiveComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function ArchiveFilesPage() {
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
        <ArchiveLayout>
            <div className="flex items-center justify-between mb-8">
                <div><ArchiveTitle>File Index</ArchiveTitle>
                    {breadcrumbs.length > 0 && (<div className="flex items-center gap-2 mt-2 text-sm text-[var(--archive-text-muted)]"><Link to="/files" className="hover:text-[var(--archive-accent)]">Root</Link>{breadcrumbs.map((c) => (<span key={c.id} className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /><Link to={`/files?folderId=${c.id}`} className="hover:text-[var(--archive-accent)]">{c.name}</Link></span>))}</div>)}</div>
                <div className="flex items-center gap-3"><label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="archive-btn archive-btn-primary cursor-pointer"><Upload className="w-4 h-4" /> Upload</span></label><ArchiveButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4" /> New Folder</ArchiveButton></div>
            </div>

            <ArchiveSection title="Search & Filter">
                <div className="flex items-center justify-between gap-4">
                    <ArchiveInput value={search} onChange={setSearch} placeholder="Search the archive..." className="max-w-md" />
                    {selected.size > 0 && (<div className="flex items-center gap-3"><ArchiveBadge variant="dark">{selected.size} selected</ArchiveBadge><ArchiveButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</ArchiveButton><ArchiveButton onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></ArchiveButton></div>)}
                </div>
            </ArchiveSection>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--archive-accent)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <ArchiveEmpty title={search ? 'No matching entries' : 'Empty archive'} text="This location contains no files." /> : (
                    <>
                        {filteredFolders.length > 0 && (<ArchiveSection title="Folders" count={filteredFolders.length}><div className="archive-columns archive-columns-4">{filteredFolders.map((folder) => (<ArchiveCard key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })}><div className="flex items-center gap-3"><Folder className="w-6 h-6 text-[var(--archive-accent)]" /><div className="flex-1 min-w-0"><p className="font-medium truncate">{folder.name}</p><p className="text-xs text-[var(--archive-text-muted)]">{folder._count?.files || 0} files</p></div><button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 hover:text-[var(--archive-accent)]"><Trash2 className="w-4 h-4" /></button></div></ArchiveCard>))}</div></ArchiveSection>)}
                        {filteredFiles.length > 0 && (<ArchiveSection title="Files" count={filteredFiles.length}>{filteredFiles.map((file, i) => { const Icon = getFileIcon(file.mimeType); return (<ArchiveFileRow key={file.id} index={i} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={formatFileSize(file.size)} onClick={() => toggleSelect(file.id)} actions={<div className="flex items-center gap-1">{file.isStarred && <ArchiveBadge variant="accent">★</ArchiveBadge>}<button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="p-1 hover:text-[var(--archive-accent)]"><Star className={cn("w-4 h-4", file.isStarred && "fill-current")} /></button><button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1 hover:text-[var(--archive-accent)]"><Download className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1 hover:text-[var(--archive-accent)]"><Trash2 className="w-4 h-4" /></button></div>} />); })}</ArchiveSection>)}
                    </>
                )}

            <ArchiveModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={<><ArchiveButton onClick={() => setShowNewFolder(false)}>Cancel</ArchiveButton><ArchiveButton variant="primary" onClick={handleCreateFolder}>Create</ArchiveButton></>}><ArchiveInput value={newFolderName} onChange={setNewFolderName} placeholder="Folder name" /></ArchiveModal>
            <ArchiveModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><ArchiveButton onClick={() => setShowMove(false)}>Cancel</ArchiveButton><ArchiveButton variant="primary" onClick={handleBulkMove}>Move</ArchiveButton></>}><div className="max-h-64 overflow-y-auto border border-[var(--archive-border)]"><button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b border-[var(--archive-border)] flex items-center gap-3", !moveTarget && "bg-[var(--archive-bg)]")}><Folder className="w-4 h-4" /> Root</button>{allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--archive-border)] flex items-center gap-3", moveTarget === f.id && "bg-[var(--archive-bg)]")}><Folder className="w-4 h-4" /> {f.name}</button>))}</div></ArchiveModal>
        </ArchiveLayout>
    );
}
