import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, ChevronRight, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicButton, ComicEmpty, ComicInput, ComicModal, ComicFileRow, ComicBadge, ComicTitle } from '@/components/comic/ComicComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function ComicFilesPage() {
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
        <ComicLayout>
            <div className="flex items-center justify-between mb-6">
                <ComicTitle>Files!</ComicTitle>
                <div className="flex items-center gap-3">
                    <label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="comic-btn comic-btn-primary cursor-pointer"><Upload className="w-5 h-5" /> Upload!</span></label>
                    <ComicButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-5 h-5" /> New Folder!</ComicButton>
                </div>
            </div>

            {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 mb-4 font-bold">
                    <Link to="/files" className="hover:text-[var(--comic-blue)]">Files</Link>
                    {breadcrumbs.map((c) => (<span key={c.id} className="flex items-center gap-1"><ChevronRight className="w-4 h-4" /><Link to={`/files?folderId=${c.id}`} className="hover:text-[var(--comic-blue)]">{c.name}</Link></span>))}
                </div>
            )}

            <ComicPanel title="Search!">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 max-w-md"><ComicInput value={search} onChange={setSearch} placeholder="Search files..." /></div>
                    {selected.size > 0 && (
                        <div className="flex items-center gap-3">
                            <ComicBadge color="blue">{selected.size} selected</ComicBadge>
                            <ComicButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move!</ComicButton>
                            <ComicButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /> ZAP!</ComicButton>
                        </div>
                    )}
                </div>
            </ComicPanel>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--comic-blue)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <ComicEmpty text={search ? 'No matches!' : 'Empty folder!'} /> : (
                    <>
                        {filteredFolders.length > 0 && (
                            <div className="comic-grid comic-grid-4 mb-6">
                                {filteredFolders.map((folder) => (
                                    <ComicPanel key={folder.id} className="cursor-pointer" onClick={() => setSearchParams({ folderId: folder.id })}>
                                        <div className="text-center">
                                            <Folder className="w-10 h-10 mx-auto mb-2 text-[var(--comic-yellow)]" style={{ stroke: '#000', strokeWidth: 2 }} />
                                            <p className="font-bold truncate">{folder.name}</p>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-[var(--comic-red)] text-sm font-bold mt-2">DELETE!</button>
                                        </div>
                                    </ComicPanel>
                                ))}
                            </div>
                        )}
                        {filteredFiles.length > 0 && (
                            <ComicPanel title="Files!">
                                {filteredFiles.map((file) => {
                                    const Icon = getFileIcon(file.mimeType);
                                    return (
                                        <ComicFileRow
                                            key={file.id}
                                            icon={<Icon className="w-6 h-6" />}
                                            name={file.originalName || file.name}
                                            meta={formatFileSize(file.size)}
                                            selected={selected.has(file.id)}
                                            onClick={() => toggleSelect(file.id)}
                                            actions={
                                                <div className="flex items-center gap-1">
                                                    {file.isStarred && <ComicBadge>★</ComicBadge>}
                                                    <button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="p-1 hover:text-[var(--comic-yellow)]"><Star className={cn("w-5 h-5", file.isStarred && "fill-current")} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1 hover:text-[var(--comic-blue)]"><Download className="w-5 h-5" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1 text-[var(--comic-red)]"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            }
                                        />
                                    );
                                })}
                            </ComicPanel>
                        )}
                    </>
                )}

            <ComicModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder!" footer={<><ComicButton onClick={() => setShowNewFolder(false)}>Cancel</ComicButton><ComicButton variant="primary" onClick={handleCreateFolder}>Create!</ComicButton></>}>
                <ComicInput value={newFolderName} onChange={setNewFolderName} placeholder="Folder name..." />
            </ComicModal>

            <ComicModal open={showMove} onClose={() => setShowMove(false)} title="Move Files!" footer={<><ComicButton onClick={() => setShowMove(false)}>Cancel</ComicButton><ComicButton variant="primary" onClick={handleBulkMove}>Move!</ComicButton></>}>
                <div className="max-h-64 overflow-y-auto border-3 border-black">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b-2 border-black flex items-center gap-3 font-bold", !moveTarget && "bg-[var(--comic-yellow)]")}><Folder className="w-5 h-5" /> Root</button>
                    {allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b-2 border-black flex items-center gap-3 font-bold", moveTarget === f.id && "bg-[var(--comic-yellow)]")}><Folder className="w-5 h-5" /> {f.name}</button>))}
                </div>
            </ComicModal>
        </ComicLayout>
    );
}
