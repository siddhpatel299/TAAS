import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Search, ChevronRight, Loader2, Grid3X3, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiButton, OrigamiEmpty, OrigamiInput, OrigamiModal } from '@/components/origami/OrigamiComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.03, duration: 0.2 } }),
};

export function OrigamiFilesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const folderId = searchParams.get('folderId') || undefined;
    const { files, folders, setFiles, setFolders } = useFilesStore();

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showMove, setShowMove] = useState(false);
    const [moveTarget, setMoveTarget] = useState<string | null>(null);
    const [allFolders, setAllFolders] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [filesRes, foldersRes] = await Promise.all([
                filesApi.getFiles({ folderId, search: search || undefined }),
                foldersApi.getFolders(folderId),
            ]);
            setFiles(filesRes.data?.data || []);
            setFolders(foldersRes.data?.data || []);

            if (folderId) {
                const folderRes = await foldersApi.getFolder(folderId);
                setBreadcrumbs(folderRes.data?.data?.path || []);
            } else {
                setBreadcrumbs([]);
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            setLoading(false);
        }
    }, [folderId, search, setFiles, setFolders]);

    useEffect(() => { loadData(); }, [loadData]);

    const loadAllFolders = async () => { const res = await foldersApi.getFolders(); setAllFolders(res.data?.data || []); };
    const handleCreateFolder = async () => { if (!newFolderName.trim()) return; await foldersApi.createFolder(newFolderName.trim(), folderId); setNewFolderName(''); setShowNewFolder(false); loadData(); };
    const handleDelete = async (fileId: string) => { if (!confirm('Move to trash?')) return; await filesApi.deleteFile(fileId, false); loadData(); };
    const handleDeleteFolder = async (id: string) => { if (!confirm('Delete folder?')) return; await foldersApi.deleteFolder(id); loadData(); };
    const handleStar = async (fileId: string) => { await filesApi.toggleStar(fileId); loadData(); };
    const handleDownload = async (file: any) => { const res = await filesApi.downloadFile(file.id); window.open(res.data?.data?.url, '_blank'); };
    const toggleSelect = (id: string) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); setSelected(n); };
    const handleBulkDelete = async () => { if (!confirm(`Delete ${selected.size} files?`)) return; await bulkApi.deleteFiles(Array.from(selected), false); setSelected(new Set()); loadData(); };
    const handleBulkMove = async () => { await bulkApi.moveFiles(Array.from(selected), moveTarget); setSelected(new Set()); setShowMove(false); loadData(); };
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files; if (!f?.length) return; for (const file of Array.from(f)) { await filesApi.uploadFile(file, folderId); } loadData(); e.target.value = ''; };

    const filteredFiles = files.filter(f => !search || f.originalName?.toLowerCase().includes(search.toLowerCase()));
    const filteredFolders = folders.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <OrigamiLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-light text-[var(--origami-text)]">Files</h1>
                    {breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                            <Link to="/files" className="text-[var(--origami-terracotta)] hover:underline">Files</Link>
                            {breadcrumbs.map((c) => (
                                <span key={c.id} className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-[var(--origami-text-muted)]" />
                                    <Link to={`/files?folderId=${c.id}`} className="text-[var(--origami-terracotta)] hover:underline">{c.name}</Link>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <label>
                        <input type="file" multiple className="hidden" onChange={handleUpload} />
                        <span className="origami-btn origami-btn-primary cursor-pointer inline-flex items-center"><Upload className="w-4 h-4 mr-2" /> Upload</span>
                    </label>
                    <OrigamiButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4 mr-2" /> Folder</OrigamiButton>
                </div>
            </div>

            {/* Search & Controls */}
            <OrigamiCard className="mb-6 !p-4">
                <div className="flex items-center justify-between gap-4">
                    <OrigamiInput value={search} onChange={setSearch} placeholder="Search files..." icon={<Search className="w-4 h-4" />} className="flex-1 max-w-md" />
                    <div className="flex items-center gap-2">
                        <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded", viewMode === 'grid' ? 'bg-[var(--origami-terracotta)] text-white' : 'text-[var(--origami-text-dim)]')}>
                            <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={cn("p-2 rounded", viewMode === 'list' ? 'bg-[var(--origami-terracotta)] text-white' : 'text-[var(--origami-text-dim)]')}>
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                    {selected.size > 0 && (
                        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-[var(--origami-crease)]">
                            <span className="text-sm text-[var(--origami-text-dim)]">{selected.size} selected</span>
                            <OrigamiButton onClick={() => { loadAllFolders(); setShowMove(true); }}>Move</OrigamiButton>
                            <OrigamiButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" /></OrigamiButton>
                        </div>
                    )}
                </div>
            </OrigamiCard>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--origami-terracotta)] animate-spin" /></div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <OrigamiEmpty icon={<Folder className="w-8 h-8" />} text={search ? 'No matching files' : 'This folder is empty'} />
            ) : viewMode === 'grid' ? (
                /* Bento Grid View */
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Folders */}
                    {filteredFolders.map((folder, i) => (
                        <motion.div key={folder.id} variants={cardVariants} initial="hidden" animate="visible" custom={i}>
                            <div
                                onClick={() => setSearchParams({ folderId: folder.id })}
                                className="group bg-[var(--origami-paper)] border border-[var(--origami-crease)] rounded-xl p-5 cursor-pointer hover:border-[var(--origami-terracotta)] hover:shadow-lg transition-all"
                            >
                                <div className="w-12 h-12 bg-[var(--origami-bg)] rounded-lg flex items-center justify-center mb-3">
                                    <Folder className="w-6 h-6 text-[var(--origami-terracotta)]" />
                                </div>
                                <p className="font-medium text-[var(--origami-text)] truncate">{folder.name}</p>
                                <p className="text-xs text-[var(--origami-text-dim)] mt-1">{folder._count?.files || 0} files</p>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 text-[var(--origami-error)]">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {/* Files */}
                    {filteredFiles.map((file, i) => {
                        const Icon = getFileIcon(file.mimeType);
                        const isSelected = selected.has(file.id);
                        return (
                            <motion.div key={file.id} variants={cardVariants} initial="hidden" animate="visible" custom={i + filteredFolders.length}>
                                <div
                                    onClick={() => toggleSelect(file.id)}
                                    className={cn(
                                        "group bg-[var(--origami-paper)] border rounded-xl p-5 cursor-pointer transition-all relative",
                                        isSelected ? "border-[var(--origami-terracotta)] bg-[rgba(196,112,75,0.05)]" : "border-[var(--origami-crease)] hover:border-[var(--origami-terracotta)] hover:shadow-lg"
                                    )}
                                >
                                    <div className="w-12 h-12 bg-[var(--origami-bg)] rounded-lg flex items-center justify-center mb-3">
                                        <Icon className="w-6 h-6 text-[var(--origami-slate)]" />
                                    </div>
                                    <p className="font-medium text-[var(--origami-text)] truncate text-sm">{file.originalName || file.name}</p>
                                    <p className="text-xs text-[var(--origami-text-dim)] mt-1">{formatFileSize(file.size)}</p>

                                    {/* Hover Actions */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                                        <button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }} className="p-1.5 bg-white rounded shadow">
                                            <Star className={cn("w-3 h-3", file.isStarred && "fill-current text-[var(--origami-terracotta)]")} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1.5 bg-white rounded shadow">
                                            <Download className="w-3 h-3" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="p-1.5 bg-white rounded shadow text-[var(--origami-error)]">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {file.isStarred && (
                                        <Star className="absolute bottom-3 right-3 w-4 h-4 fill-current text-[var(--origami-terracotta)]" />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <OrigamiCard className="!p-0 overflow-hidden">
                    {filteredFolders.map((folder) => (
                        <div key={folder.id} onClick={() => setSearchParams({ folderId: folder.id })} className="flex items-center gap-4 p-4 border-b border-[var(--origami-crease)] hover:bg-[var(--origami-bg)] cursor-pointer">
                            <Folder className="w-5 h-5 text-[var(--origami-terracotta)]" />
                            <span className="font-medium">{folder.name}</span>
                            <span className="text-sm text-[var(--origami-text-dim)] ml-auto">{folder._count?.files || 0} files</span>
                        </div>
                    ))}
                    {filteredFiles.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        return (
                            <div key={file.id} onClick={() => toggleSelect(file.id)} className={cn("flex items-center gap-4 p-4 border-b border-[var(--origami-crease)] cursor-pointer", selected.has(file.id) ? "bg-[rgba(196,112,75,0.05)]" : "hover:bg-[var(--origami-bg)]")}>
                                <Icon className="w-5 h-5 text-[var(--origami-slate)]" />
                                <span className="font-medium flex-1">{file.originalName || file.name}</span>
                                <span className="text-sm text-[var(--origami-text-dim)]">{formatFileSize(file.size)}</span>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleStar(file.id); }}><Star className={cn("w-4 h-4", file.isStarred && "fill-current text-[var(--origami-terracotta)]")} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }}><Download className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }} className="text-[var(--origami-error)]"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        );
                    })}
                </OrigamiCard>
            )}

            {/* Modals */}
            <OrigamiModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={<><OrigamiButton onClick={() => setShowNewFolder(false)}>Cancel</OrigamiButton><OrigamiButton variant="primary" onClick={handleCreateFolder}>Create</OrigamiButton></>}>
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" className="origami-input" autoFocus />
            </OrigamiModal>

            <OrigamiModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={<><OrigamiButton onClick={() => setShowMove(false)}>Cancel</OrigamiButton><OrigamiButton variant="primary" onClick={handleBulkMove}>Move</OrigamiButton></>}>
                <div className="max-h-64 overflow-y-auto border border-[var(--origami-crease)] rounded-lg">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b border-[var(--origami-crease)] flex items-center gap-3", !moveTarget ? "bg-[var(--origami-bg)] text-[var(--origami-terracotta)]" : "hover:bg-[var(--origami-bg)]")}><Folder className="w-4 h-4" /> Root</button>
                    {allFolders.map((f) => (<button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--origami-crease)] flex items-center gap-3", moveTarget === f.id ? "bg-[var(--origami-bg)] text-[var(--origami-terracotta)]" : "hover:bg-[var(--origami-bg)]")}><Folder className="w-4 h-4" /> {f.name}</button>))}
                </div>
            </OrigamiModal>
        </OrigamiLayout>
    );
}
