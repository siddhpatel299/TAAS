import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Search, ChevronRight, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTBox, CRTButton, CRTEmpty, CRTInput, CRTModal, CRTFileRow, CRTBadge, CRTTitle } from '@/components/crt/CRTComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function CRTFilesPage() {
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
    const handleDeleteFolder = async (id: string) => { if (!confirm('Delete dir?')) return; await foldersApi.deleteFolder(id); loadData(); };
    const handleStar = async (id: string) => { await filesApi.toggleStar(id); loadData(); };
    const handleDownload = async (file: any) => { const r = await filesApi.downloadFile(file.id); window.open(r.data?.data?.url, '_blank'); };
    const toggleSelect = (id: string) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };
    const handleBulkDelete = async () => { if (!confirm(`Delete ${selected.size} files?`)) return; await bulkApi.deleteFiles(Array.from(selected), false); setSelected(new Set()); loadData(); };
    const handleBulkMove = async () => { await bulkApi.moveFiles(Array.from(selected), moveTarget); setSelected(new Set()); setShowMove(false); loadData(); };
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files; if (!f?.length) return; for (const file of Array.from(f)) { await filesApi.uploadFile(file, folderId); } loadData(); e.target.value = ''; };

    const filteredFiles = files.filter(f => !search || f.originalName?.toLowerCase().includes(search.toLowerCase()));
    const filteredFolders = folders.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <CRTLayout>
            <div className="flex items-center justify-between mb-4">
                <CRTTitle>File System</CRTTitle>
                <div className="flex items-center gap-3">
                    <label><input type="file" multiple className="hidden" onChange={handleUpload} /><span className="crt-btn crt-btn-primary cursor-pointer"><Upload className="w-4 h-4" /> [UPLOAD]</span></label>
                    <CRTButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4" /> [MKDIR]</CRTButton>
                </div>
            </div>

            {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                    <Link to="/files" className="text-[var(--crt-green-dim)] hover:text-[var(--crt-green)]">/ROOT</Link>
                    {breadcrumbs.map((c) => (<span key={c.id} className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[var(--crt-green-dim)]" /><Link to={`/files?folderId=${c.id}`} className="text-[var(--crt-green-dim)] hover:text-[var(--crt-green)]">/{c.name.toUpperCase()}</Link></span>))}
                </div>
            )}

            <CRTBox className="mb-4 flex items-center justify-between gap-4">
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--crt-green-dim)]" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH FILES..." className="crt-input !pl-10" />
                </div>
                {selected.size > 0 && (
                    <div className="flex items-center gap-3">
                        <CRTBadge color="amber">{selected.size} SELECTED</CRTBadge>
                        <CRTButton onClick={() => { loadAllFolders(); setShowMove(true); }}>[MOVE]</CRTButton>
                        <CRTButton variant="danger" onClick={handleBulkDelete}>[DEL]</CRTButton>
                    </div>
                )}
            </CRTBox>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--crt-green)]" /></div> :
                filteredFolders.length === 0 && filteredFiles.length === 0 ? <CRTEmpty text={search ? 'NO MATCH' : 'DIRECTORY EMPTY'} /> : (
                    <div className="crt-panels crt-panels-2">
                        {/* Folders Panel */}
                        <CRTPanel header="Directories">
                            {filteredFolders.length === 0 ? <div className="text-[var(--crt-green-dim)]">No subdirectories</div> :
                                filteredFolders.map((folder) => (
                                    <CRTBox key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })} className="flex items-center gap-3">
                                        <Folder className="w-5 h-5" />
                                        <span className="flex-1 truncate">/{folder.name.toUpperCase()}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-[var(--crt-red)]"><Trash2 className="w-4 h-4" /></button>
                                    </CRTBox>
                                ))}
                        </CRTPanel>

                        {/* Files Panel */}
                        <CRTPanel header="Files">
                            {filteredFiles.length === 0 ? <div className="text-[var(--crt-green-dim)]">No files</div> :
                                filteredFiles.map((file) => {
                                    const Icon = getFileIcon(file.mimeType);
                                    return (
                                        <CRTFileRow
                                            key={file.id}
                                            icon={<Icon className="w-5 h-5" />}
                                            name={file.originalName || file.name}
                                            meta={formatFileSize(file.size)}
                                            selected={selected.has(file.id)}
                                            onClick={() => toggleSelect(file.id)}
                                            actions={
                                                <div className="flex items-center gap-2">
                                                    {file.isStarred && <CRTBadge color="amber">★</CRTBadge>}
                                                    <button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }}><Star className={cn("w-4 h-4", file.isStarred && "fill-current text-[var(--crt-amber)]")} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }}><Download className="w-4 h-4" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="text-[var(--crt-red)]"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            }
                                        />
                                    );
                                })}
                        </CRTPanel>
                    </div>
                )}

            <CRTModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="MKDIR" footer={<><CRTButton onClick={() => setShowNewFolder(false)}>[CANCEL]</CRTButton><CRTButton variant="primary" onClick={handleCreateFolder}>[CREATE]</CRTButton></>}>
                <CRTInput value={newFolderName} onChange={setNewFolderName} placeholder="DIRECTORY NAME..." />
            </CRTModal>

            <CRTModal open={showMove} onClose={() => setShowMove(false)} title="MOVE FILES" footer={<><CRTButton onClick={() => setShowMove(false)}>[CANCEL]</CRTButton><CRTButton variant="primary" onClick={handleBulkMove}>[MOVE]</CRTButton></>}>
                <div className="max-h-64 overflow-y-auto border border-[var(--crt-green-dim)]">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b border-dashed border-[var(--crt-green-dim)] flex items-center gap-3", !moveTarget && "bg-[rgba(0,255,65,0.1)]")}><Folder className="w-5 h-5" /> /ROOT</button>
                    {allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b border-dashed border-[var(--crt-green-dim)] flex items-center gap-3", moveTarget === f.id && "bg-[rgba(0,255,65,0.1)]")}><Folder className="w-5 h-5" /> /{f.name.toUpperCase()}</button>))}
                </div>
            </CRTModal>
        </CRTLayout>
    );
}
