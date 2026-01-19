import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Trash2, Star, Download, Search, ChevronRight, Loader2 } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiButton, OrigamiFileRow, OrigamiEmpty, OrigamiInput, OrigamiModal } from '@/components/origami/OrigamiComponents';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { useFilesStore } from '@/stores/files.store';
import { formatFileSize, cn } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function OrigamiFilesPage() {
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

    const loadAllFolders = async () => {
        const res = await foldersApi.getFolders();
        setAllFolders(res.data?.data || []);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await foldersApi.createFolder(newFolderName.trim(), folderId);
        setNewFolderName('');
        setShowNewFolder(false);
        loadData();
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('Move to trash?')) return;
        await filesApi.deleteFile(fileId, false);
        loadData();
    };

    const handleDeleteFolder = async (id: string) => {
        if (!confirm('Delete folder and contents?')) return;
        await foldersApi.deleteFolder(id);
        loadData();
    };

    const handleStar = async (fileId: string) => {
        await filesApi.toggleStar(fileId);
        loadData();
    };

    const handleDownload = async (file: any) => {
        const res = await filesApi.downloadFile(file.id);
        window.open(res.data?.data?.url, '_blank');
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selected.size} files?`)) return;
        await bulkApi.deleteFiles(Array.from(selected), false);
        setSelected(new Set());
        loadData();
    };

    const handleBulkMove = async () => {
        await bulkApi.moveFiles(Array.from(selected), moveTarget);
        setSelected(new Set());
        setShowMove(false);
        loadData();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadFiles = e.target.files;
        if (!uploadFiles?.length) return;

        for (const file of Array.from(uploadFiles)) {
            await filesApi.uploadFile(file, folderId);
        }
        loadData();
        e.target.value = '';
    };

    const filteredFiles = files.filter(f => !search || f.originalName?.toLowerCase().includes(search.toLowerCase()));
    const filteredFolders = folders.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <OrigamiLayout>
            <OrigamiHeader
                title="Files"
                subtitle={`${files.length} files, ${folders.length} folders`}
                actions={
                    <div className="flex items-center gap-3">
                        <label>
                            <input type="file" multiple className="hidden" onChange={handleUpload} />
                            <span className="origami-btn origami-btn-primary cursor-pointer inline-flex items-center"><Upload className="w-4 h-4 mr-2" /> Upload</span>
                        </label>
                        <OrigamiButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4 mr-2" /> New Folder</OrigamiButton>
                    </div>
                }
            />

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                    <Link to="/files" className="text-[var(--origami-terracotta)] hover:underline">Files</Link>
                    {breadcrumbs.map((crumb) => (
                        <span key={crumb.id} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-[var(--origami-text-muted)]" />
                            <Link to={`/files?folderId=${crumb.id}`} className="text-[var(--origami-terracotta)] hover:underline">{crumb.name}</Link>
                        </span>
                    ))}
                </div>
            )}

            {/* Search & Bulk Actions */}
            <OrigamiCard className="mb-6 !p-4">
                <div className="flex items-center justify-between">
                    <OrigamiInput value={search} onChange={setSearch} placeholder="Search files..." icon={<Search className="w-4 h-4" />} className="w-80" />
                    {selected.size > 0 && (
                        <div className="flex items-center gap-3">
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
            ) : (
                <OrigamiCard className="!p-0 overflow-hidden">
                    {/* Folders */}
                    {filteredFolders.map((folder) => (
                        <OrigamiFileRow
                            key={folder.id}
                            icon={<Folder className="w-5 h-5 text-[var(--origami-terracotta)]" />}
                            name={folder.name}
                            meta={`${folder._count?.files || 0} files`}
                            onClick={() => setSearchParams({ folderId: folder.id })}
                            actions={
                                <OrigamiButton variant="ghost" onClick={() => handleDeleteFolder(folder.id)}><Trash2 className="w-4 h-4" /></OrigamiButton>
                            }
                        />
                    ))}
                    {/* Files */}
                    {filteredFiles.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        return (
                            <OrigamiFileRow
                                key={file.id}
                                icon={<Icon className="w-5 h-5" />}
                                name={file.originalName || file.name}
                                meta={formatFileSize(file.size)}
                                selected={selected.has(file.id)}
                                onClick={() => toggleSelect(file.id)}
                                actions={
                                    <div className="flex items-center gap-1">
                                        <OrigamiButton variant="ghost" onClick={() => handleStar(file.id)}>
                                            <Star className={cn("w-4 h-4", file.isStarred && "fill-current text-[var(--origami-terracotta)]")} />
                                        </OrigamiButton>
                                        <OrigamiButton variant="ghost" onClick={() => handleDownload(file)}><Download className="w-4 h-4" /></OrigamiButton>
                                        <OrigamiButton variant="ghost" onClick={() => handleDelete(file.id)}><Trash2 className="w-4 h-4" /></OrigamiButton>
                                    </div>
                                }
                            />
                        );
                    })}
                </OrigamiCard>
            )}

            {/* New Folder Modal */}
            <OrigamiModal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder" footer={
                <>
                    <OrigamiButton onClick={() => setShowNewFolder(false)}>Cancel</OrigamiButton>
                    <OrigamiButton variant="primary" onClick={handleCreateFolder}>Create</OrigamiButton>
                </>
            }>
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" className="origami-input" autoFocus />
            </OrigamiModal>

            {/* Move Modal */}
            <OrigamiModal open={showMove} onClose={() => setShowMove(false)} title="Move Files" footer={
                <>
                    <OrigamiButton onClick={() => setShowMove(false)}>Cancel</OrigamiButton>
                    <OrigamiButton variant="primary" onClick={handleBulkMove}>Move</OrigamiButton>
                </>
            }>
                <div className="max-h-64 overflow-y-auto border border-[var(--origami-crease)] rounded">
                    <button onClick={() => setMoveTarget(null)} className={cn("w-full text-left p-3 border-b border-[var(--origami-crease)] flex items-center gap-3", !moveTarget ? "bg-[var(--origami-bg)] text-[var(--origami-terracotta)]" : "hover:bg-[var(--origami-bg)]")}>
                        <Folder className="w-4 h-4" /> Root
                    </button>
                    {allFolders.map((f) => (
                        <button key={f.id} onClick={() => setMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--origami-crease)] flex items-center gap-3", moveTarget === f.id ? "bg-[var(--origami-bg)] text-[var(--origami-terracotta)]" : "hover:bg-[var(--origami-bg)]")}>
                            <Folder className="w-4 h-4" /> {f.name}
                        </button>
                    ))}
                </div>
            </OrigamiModal>
        </OrigamiLayout>
    );
}
