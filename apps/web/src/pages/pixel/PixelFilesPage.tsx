import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Loader2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelEmpty, PixelInput, PixelModal, PixelFileRow, PixelBadge, PixelTitle } from '@/components/pixel/PixelComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function PixelFilesPage() {
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
    const handleDelete = async (id: string) => { if (!confirm('Delete item?')) return; await filesApi.deleteFile(id, false); loadData(); };
    const handleDeleteFolder = async (id: string) => { if (!confirm('Delete folder?')) return; await foldersApi.deleteFolder(id); loadData(); };
    const handleStar = async (id: string) => { await filesApi.toggleStar(id); loadData(); };
    const handleDownload = async (file: any) => { const r = await filesApi.downloadFile(file.id); window.open(r.data?.data?.url, '_blank'); };
    const toggleSelect = (id: string) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };
    const handleBulkDelete = async () => { if (!confirm(`Delete ${selected.size} items?`)) return; await bulkApi.deleteFiles(Array.from(selected), false); setSelected(new Set()); loadData(); };
    const handleBulkMove = async () => { await bulkApi.moveFiles(Array.from(selected), moveTarget); setSelected(new Set()); setShowMove(false); loadData(); };
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files; if (!f?.length) return; for (const file of Array.from(f)) { await filesApi.uploadFile(file, folderId); } loadData(); e.target.value = ''; };

    const filteredFiles = files.filter(f => !search || f.originalName?.toLowerCase().includes(search.toLowerCase()));
    const filteredFolders = folders.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <PixelLayout>
            <div className="flex items-center justify-between mb-6">
                <PixelTitle subtitle={breadcrumbs.length ? '> ' + breadcrumbs.map(c => c.name).join(' > ') : '> ROOT DIRECTORY'}>INVENTORY</PixelTitle>
                <div className="flex items-center gap-3"><label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="pixel-btn pixel-btn-primary cursor-pointer"><Upload className="w-4 h-4" /> UPLOAD</span></label><PixelButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4" /> NEW FOLDER</PixelButton></div>
            </div>

            <PixelCard className="mb-6">
                <div className="flex items-center justify-between gap-4">
                    <PixelInput value={search} onChange={setSearch} placeholder="> SEARCH..." className="max-w-md" />
                    {selected.size > 0 && (<div className="flex items-center gap-3"><PixelBadge color="pink">{selected.size} SELECTED</PixelBadge><PixelButton onClick={() => { loadAllFolders(); setShowMove(true); }}>MOVE</PixelButton><PixelButton onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></PixelButton></div>)}
                </div>
            </PixelCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--pixel-cyan)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <PixelEmpty text={search ? 'NO ITEMS FOUND' : 'EMPTY FOLDER'} /> : (
                    <>
                        {filteredFolders.length > 0 && (<div className="pixel-grid pixel-grid-4 mb-6">{filteredFolders.map((folder) => (<PixelCard key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })}><div className="flex items-center gap-3"><Folder className="w-8 h-8 text-[var(--pixel-yellow)]" /><div className="flex-1 min-w-0"><p className="truncate" style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem' }}>{folder.name}</p><p className="text-xs text-[var(--pixel-text-dim)]">{folder._count?.files || 0} items</p></div><button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="p-1 text-[var(--pixel-red)]"><Trash2 className="w-4 h-4" /></button></div></PixelCard>))}</div>)}
                        {filteredFiles.length > 0 && (<PixelCard>{filteredFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <PixelFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={formatFileSize(file.size)} selected={selected.has(file.id)} onClick={() => toggleSelect(file.id)} actions={<div className="flex items-center gap-1">{file.isStarred && <PixelBadge color="yellow">★</PixelBadge>}<button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="p-1"><Star className={cn("w-4 h-4", file.isStarred ? "text-[var(--pixel-yellow)]" : "text-[var(--pixel-text-dim)]")} /></button><button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1 text-[var(--pixel-green)]"><Download className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1 text-[var(--pixel-red)]"><Trash2 className="w-4 h-4" /></button></div>} />; })}</PixelCard>)}
                    </>
                )}

            <PixelModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="NEW FOLDER" footer={<><PixelButton onClick={() => setShowNewFolder(false)}>CANCEL</PixelButton><PixelButton variant="primary" onClick={handleCreateFolder}>CREATE</PixelButton></>}><PixelInput value={newFolderName} onChange={setNewFolderName} placeholder="> ENTER NAME..." /></PixelModal>
            <PixelModal open={showMove} onClose={() => setShowMove(false)} title="MOVE ITEMS" footer={<><PixelButton onClick={() => setShowMove(false)}>CANCEL</PixelButton><PixelButton variant="primary" onClick={handleBulkMove}>MOVE</PixelButton></>}><div className="max-h-64 overflow-y-auto"><button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 flex items-center gap-3 mb-1 border-2", !moveTarget ? "border-[var(--pixel-cyan)]" : "border-transparent")}><Folder className="w-4 h-4" /> ROOT</button>{allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 flex items-center gap-3 mb-1 border-2", moveTarget === f.id ? "border-[var(--pixel-cyan)]" : "border-transparent")}><Folder className="w-4 h-4" /> {f.name}</button>))}</div></PixelModal>
        </PixelLayout>
    );
}
