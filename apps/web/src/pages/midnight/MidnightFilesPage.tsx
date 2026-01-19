import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Search, Trash2, Star, Home, ChevronRight, RefreshCw, Loader2, Download, Pencil, FolderInput, X, Check } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton, MidnightFileRow, MidnightEmpty, MidnightBadge, MidnightInput, MidnightModal } from '@/components/midnight/MidnightComponents';
import { useFilesStore, StoredFile, Folder as FolderType } from '@/stores/files.store';
import { useDirectUpload } from '@/contexts/DirectUploadContext';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { formatFileSize, cn } from '@/lib/utils';
import { DirectUploadQueue } from '@/components/DirectUploadQueue';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function MidnightFilesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFolderId = searchParams.get('folder');
    const { files, folders, setFiles, setFolders, selectedFiles, toggleFileSelection, clearSelection, searchQuery, setSearchQuery } = useFilesStore();
    const { uploadFiles, uploads } = useDirectUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'My Files' }]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState('');
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [folderTree, setFolderTree] = useState<FolderType[]>([]);
    const [selectedMoveTarget, setSelectedMoveTarget] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<{ fileId: string; progress: number } | null>(null);

    const loadContent = useCallback(async () => {
        setIsLoading(true);
        try {
            const [filesRes, foldersRes] = await Promise.all([
                filesApi.getFiles({ folderId: currentFolderId || undefined }),
                foldersApi.getFolders(currentFolderId || undefined),
            ]);
            setFiles(filesRes.data?.data || []);
            setFolders(foldersRes.data?.data || []);
        } catch (error) {
            console.error('Failed to load:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentFolderId, setFiles, setFolders]);

    useEffect(() => { loadContent(); }, [loadContent]);

    useEffect(() => {
        const buildBreadcrumb = async () => {
            if (!currentFolderId) {
                setBreadcrumb([{ id: null, name: 'My Files' }]);
                return;
            }
            try {
                const response = await foldersApi.getFolder(currentFolderId);
                const folder = response.data?.data;
                if (folder) {
                    setBreadcrumb([{ id: null, name: 'My Files' }, { id: folder.id, name: folder.name }]);
                }
            } catch (error) {
                console.error('Breadcrumb error:', error);
            }
        };
        buildBreadcrumb();
    }, [currentFolderId]);

    const loadFolderTree = async () => {
        try {
            const res = await foldersApi.getFolderTree();
            setFolderTree(res.data?.data || []);
        } catch (error) {
            console.error('Failed to load folder tree:', error);
        }
    };

    const navigateToFolder = (folderId: string | null) => {
        clearSelection();
        if (folderId) setSearchParams({ folder: folderId });
        else setSearchParams({});
    };

    const handleUpload = (filesList: File[]) => uploadFiles(filesList, currentFolderId || undefined);

    const handleDownload = async (file: StoredFile) => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const downloadUrl = `${baseUrl}/files/${file.id}/download?token=${token}`;
            setDownloadProgress({ fileId: file.id, progress: 0 });

            if ('showSaveFilePicker' in window) {
                try {
                    const ext = file.originalName.split('.').pop() || '';
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: file.originalName,
                        types: [{ description: 'File', accept: { [file.mimeType || 'application/octet-stream']: [`.${ext}`] } }]
                    });
                    const writable = await handle.createWritable();
                    const response = await fetch(downloadUrl);
                    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
                    const reader = response.body?.getReader();
                    if (!reader) throw new Error('No response body');
                    const totalSize = Number(file.size);
                    let downloaded = 0;
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await writable.write(value);
                        downloaded += value.length;
                        setDownloadProgress({ fileId: file.id, progress: Math.round((downloaded / totalSize) * 100) });
                    }
                    await writable.close();
                    setDownloadProgress(null);
                    return;
                } catch (err: any) {
                    if (err.name === 'AbortError') { setDownloadProgress(null); return; }
                }
            }
            const response = await filesApi.downloadFile(file.id);
            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.originalName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setDownloadProgress(null);
        } catch (error) {
            console.error('Download failed:', error);
            setDownloadProgress(null);
        }
    };

    const handleStar = async (file: StoredFile) => { await filesApi.toggleStar(file.id); loadContent(); };
    const handleDelete = async (file: StoredFile) => { await filesApi.deleteFile(file.id); loadContent(); };
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await foldersApi.createFolder(newFolderName.trim(), currentFolderId || undefined);
        setNewFolderName('');
        setShowNewFolder(false);
        loadContent();
    };
    const handleRenameFolder = async (folderId: string) => {
        if (!editFolderName.trim()) return;
        await foldersApi.renameFolder(folderId, editFolderName.trim());
        setEditingFolderId(null);
        setEditFolderName('');
        loadContent();
    };
    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm('Delete this folder?')) return;
        await foldersApi.deleteFolder(folderId);
        loadContent();
    };
    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return;
        if (!confirm(`Delete ${selectedFiles.size} files?`)) return;
        await bulkApi.deleteFiles(Array.from(selectedFiles));
        clearSelection();
        loadContent();
    };
    const handleBulkStar = async () => {
        if (selectedFiles.size === 0) return;
        await bulkApi.starFiles(Array.from(selectedFiles), true);
        clearSelection();
        loadContent();
    };
    const handleBulkMove = async () => {
        if (selectedFiles.size === 0) return;
        await bulkApi.moveFiles(Array.from(selectedFiles), selectedMoveTarget);
        clearSelection();
        setShowMoveDialog(false);
        loadContent();
    };
    const handleSelectAll = () => {
        if (selectedFiles.size === files.length) clearSelection();
        else files.forEach(f => toggleFileSelection(f.id));
    };

    const filteredFiles = files.filter(f => (f.originalName || f.name).toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredFolders = folders.filter((f: FolderType) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <MidnightLayout>
            <MidnightHeader
                title="Files"
                subtitle={`${files.length} files, ${folders.length} folders`}
                actions={
                    <div className="flex items-center gap-3">
                        <MidnightButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-4 h-4 mr-2" /> New Folder</MidnightButton>
                        <MidnightButton variant="primary" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Upload</MidnightButton>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { const fl = Array.from(e.target.files || []); if (fl.length > 0) handleUpload(fl); e.target.value = ''; }} />
                    </div>
                }
            />

            {/* Breadcrumb & Search */}
            <MidnightCard className="mb-6 !p-4">
                <div className="flex items-center justify-between">
                    <nav className="flex items-center gap-1 text-sm">
                        {breadcrumb.map((item, index) => (
                            <div key={item.id || 'root'} className="flex items-center gap-1">
                                {index > 0 && <ChevronRight className="w-4 h-4 text-[var(--midnight-text-dim)]" />}
                                <button onClick={() => navigateToFolder(item.id)} className={cn("px-2 py-1 rounded-lg hover:bg-[var(--midnight-surface-hover)]", index === breadcrumb.length - 1 ? "text-[var(--midnight-gold)] font-medium" : "text-[var(--midnight-text-dim)]")}>
                                    {index === 0 && <Home className="w-4 h-4 inline mr-1" />}
                                    {item.name}
                                </button>
                            </div>
                        ))}
                    </nav>
                    <div className="flex items-center gap-3">
                        <MidnightInput value={searchQuery} onChange={setSearchQuery} placeholder="Search files..." icon={<Search className="w-4 h-4" />} className="w-64" />
                        <button onClick={loadContent} className="p-2 rounded-lg hover:bg-[var(--midnight-surface-hover)] text-[var(--midnight-text-dim)]">
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </MidnightCard>

            {/* Selection Bar */}
            {selectedFiles.size > 0 && (
                <MidnightCard gold className="mb-6 !p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={clearSelection} className="p-1 hover:text-[var(--midnight-gold)]"><X className="w-4 h-4" /></button>
                            <span><MidnightBadge variant="gold">{selectedFiles.size}</MidnightBadge> selected</span>
                            <button onClick={handleSelectAll} className="text-sm text-[var(--midnight-text-dim)] hover:text-[var(--midnight-gold)] underline">
                                {selectedFiles.size === files.length ? 'Deselect all' : 'Select all'}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <MidnightButton onClick={handleBulkStar}><Star className="w-4 h-4 mr-1" /> Star</MidnightButton>
                            <MidnightButton onClick={() => { loadFolderTree(); setShowMoveDialog(true); }}><FolderInput className="w-4 h-4 mr-1" /> Move</MidnightButton>
                            <MidnightButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-4 h-4 mr-1" /> Delete</MidnightButton>
                        </div>
                    </div>
                </MidnightCard>
            )}

            {/* New Folder */}
            {showNewFolder && (
                <MidnightCard className="mb-6 !p-4">
                    <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-[var(--midnight-gold)]" />
                        <input type="text" placeholder="Folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} className="midnight-input flex-1" autoFocus />
                        <MidnightButton variant="primary" onClick={handleCreateFolder}>Create</MidnightButton>
                        <MidnightButton onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Cancel</MidnightButton>
                    </div>
                </MidnightCard>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <MidnightEmpty icon={<Folder className="w-8 h-8" />} text="This folder is empty" action={<MidnightButton variant="primary" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Upload Files</MidnightButton>} />
            ) : (
                <MidnightCard className="!p-0 overflow-hidden">
                    {/* Folders */}
                    {filteredFolders.map((folder: FolderType) => (
                        <div key={folder.id} className="midnight-file-row">
                            {editingFolderId === folder.id ? (
                                <>
                                    <div className="midnight-file-icon"><Folder className="w-5 h-5 text-[var(--midnight-gold)]" /></div>
                                    <input type="text" value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.id)} className="midnight-input flex-1" autoFocus />
                                    <button onClick={() => handleRenameFolder(folder.id)} className="p-2 text-[var(--midnight-success)]"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingFolderId(null)} className="p-2 text-[var(--midnight-error)]"><X className="w-4 h-4" /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => navigateToFolder(folder.id)} className="midnight-file-icon"><Folder className="w-5 h-5 text-[var(--midnight-gold)]" /></button>
                                    <button onClick={() => navigateToFolder(folder.id)} className="midnight-file-info text-left">
                                        <div className="midnight-file-name">{folder.name}</div>
                                        <div className="midnight-file-meta">{folder._count?.files || 0} files</div>
                                    </button>
                                    <div className="midnight-file-actions">
                                        <button onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }} className="p-2 hover:text-[var(--midnight-gold)]"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteFolder(folder.id)} className="p-2 hover:text-[var(--midnight-error)]"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {/* Files */}
                    {filteredFiles.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        const isDownloading = downloadProgress?.fileId === file.id;
                        return (
                            <MidnightFileRow
                                key={file.id}
                                icon={<Icon className="w-5 h-5" />}
                                name={isDownloading ? `${file.originalName || file.name} [${downloadProgress.progress}%]` : (file.originalName || file.name)}
                                meta={formatFileSize(file.size)}
                                selected={selectedFiles.has(file.id)}
                                onClick={() => toggleFileSelection(file.id)}
                                actions={
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-2 hover:text-[var(--midnight-success)]" disabled={isDownloading}><Download className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleStar(file); }} className={cn("p-2", file.isStarred && "text-[var(--midnight-gold)]")}><Star className={cn("w-4 h-4", file.isStarred && "fill-current")} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }} className="p-2 hover:text-[var(--midnight-error)]"><Trash2 className="w-4 h-4" /></button>
                                    </>
                                }
                            />
                        );
                    })}
                </MidnightCard>
            )}

            {/* Move Dialog */}
            <MidnightModal open={showMoveDialog} onClose={() => setShowMoveDialog(false)} title="Move Files" footer={
                <>
                    <MidnightButton onClick={() => setShowMoveDialog(false)}>Cancel</MidnightButton>
                    <MidnightButton variant="primary" onClick={handleBulkMove}>Move</MidnightButton>
                </>
            }>
                <p className="text-sm text-[var(--midnight-text-dim)] mb-4">Select destination for {selectedFiles.size} files</p>
                <div className="max-h-60 overflow-y-auto border border-[var(--midnight-border)] rounded-lg">
                    <button onClick={() => setSelectedMoveTarget(null)} className={cn("w-full text-left p-3 border-b border-[var(--midnight-border)] flex items-center gap-3 hover:bg-[var(--midnight-surface-hover)]", !selectedMoveTarget && "bg-[rgba(212,175,55,0.1)] text-[var(--midnight-gold)]")}>
                        <Home className="w-4 h-4" /> Root
                    </button>
                    {folderTree.map((f: FolderType) => (
                        <button key={f.id} onClick={() => setSelectedMoveTarget(f.id)} className={cn("w-full text-left p-3 border-b border-[var(--midnight-border)] flex items-center gap-3 hover:bg-[var(--midnight-surface-hover)]", selectedMoveTarget === f.id && "bg-[rgba(212,175,55,0.1)] text-[var(--midnight-gold)]")}>
                            <Folder className="w-4 h-4" /> {f.name}
                        </button>
                    ))}
                </div>
            </MidnightModal>

            {uploads.length > 0 && <div className="fixed bottom-8 right-8 w-80 z-50"><DirectUploadQueue /></div>}
        </MidnightLayout>
    );
}
