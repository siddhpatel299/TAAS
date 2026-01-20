import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecEmpty, ExecInput, ExecModal, ExecFileRow, ExecBadge, ExecTitle } from '@/components/exec/ExecComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function ExecFilesPage() {
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
    const handleDelete = async (id: string) => { if (!confirm('Archive this asset?')) return; await filesApi.deleteFile(id, false); loadData(); };
    const handleDeleteFolder = async (id: string) => { if (!confirm('Delete portfolio?')) return; await foldersApi.deleteFolder(id); loadData(); };
    const handleStar = async (id: string) => { await filesApi.toggleStar(id); loadData(); };
    const handleDownload = async (file: any) => { const r = await filesApi.downloadFile(file.id); window.open(r.data?.data?.url, '_blank'); };
    const toggleSelect = (id: string) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };
    const handleBulkDelete = async () => { if (!confirm(`Archive ${selected.size} assets?`)) return; await bulkApi.deleteFiles(Array.from(selected), false); setSelected(new Set()); loadData(); };
    const handleBulkMove = async () => { await bulkApi.moveFiles(Array.from(selected), moveTarget); setSelected(new Set()); setShowMove(false); loadData(); };
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files; if (!f?.length) return; for (const file of Array.from(f)) { await filesApi.uploadFile(file, folderId); } loadData(); e.target.value = ''; };

    const filteredFiles = files.filter(f => !search || f.originalName?.toLowerCase().includes(search.toLowerCase()));
    const filteredFolders = folders.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <ExecLayout>
            <div className="flex items-center justify-between mb-8">
                <ExecTitle subtitle={breadcrumbs.length ? breadcrumbs.map(c => c.name).join(' / ') : 'Asset management system'}>Document Vault</ExecTitle>
                <div className="flex items-center gap-4"><label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="exec-btn exec-btn-primary cursor-pointer"><Upload className="w-4 h-4" /> Upload</span></label><ExecButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4" /> New Portfolio</ExecButton></div>
            </div>

            <ExecCard className="mb-8">
                <div className="flex items-center justify-between gap-4">
                    <ExecInput value={search} onChange={setSearch} placeholder="Search assets..." className="max-w-md" />
                    {selected.size > 0 && (<div className="flex items-center gap-4"><ExecBadge>{selected.size} selected</ExecBadge><ExecButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Transfer</ExecButton><ExecButton onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></ExecButton></div>)}
                </div>
            </ExecCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--exec-gold)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <ExecEmpty text={search ? 'No matching assets found' : 'Portfolio is empty'} /> : (
                    <>
                        {filteredFolders.length > 0 && (<div className="exec-grid exec-grid-4 mb-8">{filteredFolders.map((folder) => (<ExecCard key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })}><div className="flex items-center gap-4"><Folder className="w-8 h-8 text-[var(--exec-gold)]" /><div className="flex-1 min-w-0"><p className="truncate">{folder.name}</p><p className="text-xs text-[var(--exec-text-muted)]">{folder._count?.files || 0} assets</p></div><button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 text-[var(--exec-text-muted)] hover:text-[var(--exec-gold)]"><Trash2 className="w-4 h-4" /></button></div></ExecCard>))}</div>)}
                        {filteredFiles.length > 0 && (<ExecCard>{filteredFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <ExecFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={formatFileSize(file.size)} selected={selected.has(file.id)} onClick={() => toggleSelect(file.id)} actions={<div className="flex items-center gap-2">{file.isStarred && <ExecBadge>Priority</ExecBadge>}<button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="p-1 text-[var(--exec-text-muted)] hover:text-[var(--exec-gold)]"><Star className={cn("w-4 h-4", file.isStarred && "fill-current text-[var(--exec-gold)]")} /></button><button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1 text-[var(--exec-text-muted)] hover:text-[var(--exec-gold)]"><Download className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1 text-[var(--exec-text-muted)] hover:text-[var(--exec-gold)]"><Trash2 className="w-4 h-4" /></button></div>} />; })}</ExecCard>)}
                    </>
                )}

            <ExecModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Portfolio" footer={<><ExecButton onClick={() => setShowNewFolder(false)}>Cancel</ExecButton><ExecButton variant="primary" onClick={handleCreateFolder}>Create</ExecButton></>}><ExecInput value={newFolderName} onChange={setNewFolderName} placeholder="Portfolio name..." /></ExecModal>
            <ExecModal open={showMove} onClose={() => setShowMove(false)} title="Transfer Assets" footer={<><ExecButton onClick={() => setShowMove(false)}>Cancel</ExecButton><ExecButton variant="primary" onClick={handleBulkMove}>Transfer</ExecButton></>}><div className="max-h-64 overflow-y-auto"><button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-4 flex items-center gap-3 mb-1 border border-transparent", !moveTarget && "border-[var(--exec-gold)]")}><Folder className="w-4 h-4" /> Root</button>{allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-4 flex items-center gap-3 mb-1 border border-transparent", moveTarget === f.id && "border-[var(--exec-gold)]")}><Folder className="w-4 h-4" /> {f.name}</button>))}</div></ExecModal>
        </ExecLayout>
    );
}
