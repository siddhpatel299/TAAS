import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, FileText, Image, Video, Music, Upload, FolderPlus, Search, Trash2, Star, Home, ChevronRight, RefreshCw, Loader2, Download, Pencil, FolderInput, X, Check } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalFileRow, TerminalEmpty, TerminalBadge } from '@/components/terminal/TerminalComponents';
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

export function TerminalFilesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFolderId = searchParams.get('folder');
    const { files, folders, setFiles, setFolders, selectedFiles, toggleFileSelection, clearSelection, searchQuery, setSearchQuery } = useFilesStore();
    const { uploadFiles, uploads } = useDirectUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'ROOT' }]);
    const [isLoading, setIsLoading] = useState(true);

    // Folder operations
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState('');

    // Move dialog
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [folderTree, setFolderTree] = useState<FolderType[]>([]);
    const [selectedMoveTarget, setSelectedMoveTarget] = useState<string | null>(null);

    // Download progress
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
                setBreadcrumb([{ id: null, name: 'ROOT' }]);
                return;
            }
            try {
                const response = await foldersApi.getFolder(currentFolderId);
                const folder = response.data?.data;
                if (folder) {
                    setBreadcrumb([{ id: null, name: 'ROOT' }, { id: folder.id, name: folder.name.toUpperCase() }]);
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

    // File operations
    const handleUpload = (filesList: File[]) => uploadFiles(filesList, currentFolderId || undefined);

    const handleDownload = async (file: StoredFile) => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const downloadUrl = `${baseUrl}/files/${file.id}/download?token=${token}`;

            setDownloadProgress({ fileId: file.id, progress: 0 });

            // Check if File System Access API is supported
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
                    if (err.name === 'AbortError') {
                        setDownloadProgress(null);
                        return;
                    }
                    console.warn('File System Access failed, falling back');
                }
            }

            // Fallback
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

    // Folder operations
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

    // Bulk operations
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
        if (selectedFiles.size === files.length) {
            clearSelection();
        } else {
            files.forEach(f => toggleFileSelection(f.id));
        }
    };

    const filteredFiles = files.filter(f => (f.originalName || f.name).toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredFolders = folders.filter((f: FolderType) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <TerminalLayout>
            <TerminalHeader
                title="File System"
                subtitle={`${files.length} files, ${folders.length} folders`}
                actions={
                    <div className="flex items-center gap-2">
                        <TerminalButton onClick={() => setShowNewFolder(true)}><FolderPlus className="w-3 h-3 mr-1" /> New Dir</TerminalButton>
                        <TerminalButton variant="primary" onClick={() => fileInputRef.current?.click()}><Upload className="w-3 h-3 mr-1" /> Upload</TerminalButton>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { const fl = Array.from(e.target.files || []); if (fl.length > 0) handleUpload(fl); e.target.value = ''; }} />
                    </div>
                }
            />

            {/* Toolbar */}
            <TerminalPanel className="mb-4 !p-2">
                <div className="flex items-center justify-between gap-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-xs">
                        {breadcrumb.map((item, index) => (
                            <div key={item.id || 'root'} className="flex items-center">
                                {index > 0 && <ChevronRight className="w-3 h-3 text-[var(--terminal-text-dim)] mx-1" />}
                                <button onClick={() => navigateToFolder(item.id)} className={cn("px-2 py-0.5", index === breadcrumb.length - 1 ? "text-[var(--terminal-amber)]" : "text-[var(--terminal-text-dim)] hover:text-[var(--terminal-text)]")}>
                                    {index === 0 && <Home className="w-3 h-3 inline mr-1" />}
                                    {item.name}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--terminal-text-dim)]" />
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="terminal-input pl-7 !py-1 !text-xs w-32" />
                        </div>
                        <button onClick={loadContent} className="p-1 text-[var(--terminal-text-dim)] hover:text-[var(--terminal-amber)]"><RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} /></button>
                    </div>
                </div>
            </TerminalPanel>

            {/* Selection Bar */}
            {selectedFiles.size > 0 && (
                <TerminalPanel className="mb-4 !p-2 !border-[var(--terminal-amber)]">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <button onClick={clearSelection} className="p-1 hover:text-[var(--terminal-amber)]"><X className="w-3 h-3" /></button>
                            <span><TerminalBadge variant="warning">{selectedFiles.size}</TerminalBadge> selected</span>
                            <button onClick={handleSelectAll} className="text-[var(--terminal-text-dim)] hover:text-[var(--terminal-amber)] underline">
                                {selectedFiles.size === files.length ? 'Deselect all' : 'Select all'}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <TerminalButton onClick={handleBulkStar}><Star className="w-3 h-3 mr-1" /> Star</TerminalButton>
                            <TerminalButton onClick={() => { loadFolderTree(); setShowMoveDialog(true); }}><FolderInput className="w-3 h-3 mr-1" /> Move</TerminalButton>
                            <TerminalButton variant="danger" onClick={handleBulkDelete}><Trash2 className="w-3 h-3 mr-1" /> Delete</TerminalButton>
                        </div>
                    </div>
                </TerminalPanel>
            )}

            {/* New Folder */}
            {showNewFolder && (
                <TerminalPanel className="mb-4 !p-2">
                    <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-[var(--terminal-amber)]" />
                        <input type="text" placeholder="Directory name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} className="terminal-input !py-1 flex-1" autoFocus />
                        <TerminalButton variant="primary" onClick={handleCreateFolder}>Create</TerminalButton>
                        <TerminalButton onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Cancel</TerminalButton>
                    </div>
                </TerminalPanel>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <TerminalEmpty icon={<Folder className="w-full h-full" />} text="Directory empty" action={<TerminalButton variant="primary" onClick={() => fileInputRef.current?.click()}><Upload className="w-3 h-3 mr-1" /> Upload</TerminalButton>} />
            ) : (
                <TerminalPanel>
                    {/* Folders */}
                    {filteredFolders.map((folder: FolderType) => (
                        <div key={folder.id} className="flex items-center gap-2 p-2 border-b border-[var(--terminal-border)] hover:bg-[var(--terminal-dark)]">
                            {editingFolderId === folder.id ? (
                                <>
                                    <Folder className="w-4 h-4 text-[var(--terminal-amber)]" />
                                    <input type="text" value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.id)} className="terminal-input !py-0.5 flex-1" autoFocus />
                                    <button onClick={() => handleRenameFolder(folder.id)} className="p-1 text-[var(--terminal-green)]"><Check className="w-3 h-3" /></button>
                                    <button onClick={() => setEditingFolderId(null)} className="p-1 text-[var(--terminal-red)]"><X className="w-3 h-3" /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => navigateToFolder(folder.id)} className="flex items-center gap-2 flex-1">
                                        <Folder className="w-4 h-4 text-[var(--terminal-amber)]" />
                                        <span className="text-xs">{folder.name}</span>
                                        <span className="text-xs text-[var(--terminal-text-dim)] ml-auto">{folder._count?.files || 0} files</span>
                                    </button>
                                    <button onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }} className="p-1 text-[var(--terminal-text-dim)] hover:text-[var(--terminal-amber)]"><Pencil className="w-3 h-3" /></button>
                                    <button onClick={() => handleDeleteFolder(folder.id)} className="p-1 text-[var(--terminal-text-dim)] hover:text-[var(--terminal-red)]"><Trash2 className="w-3 h-3" /></button>
                                </>
                            )}
                        </div>
                    ))}

                    {/* Files */}
                    {filteredFiles.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        const isDownloading = downloadProgress?.fileId === file.id;
                        return (
                            <TerminalFileRow
                                key={file.id}
                                icon={<Icon className="w-4 h-4" />}
                                name={isDownloading ? `${file.originalName || file.name} [${downloadProgress.progress}%]` : (file.originalName || file.name)}
                                meta={formatFileSize(file.size)}
                                selected={selectedFiles.has(file.id)}
                                onClick={() => toggleFileSelection(file.id)}
                                actions={
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1 text-[var(--terminal-text-dim)] hover:text-[var(--terminal-green)]" disabled={isDownloading}><Download className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleStar(file); }} className={cn("p-1", file.isStarred && "text-[var(--terminal-amber)]")}><Star className={cn("w-3 h-3", file.isStarred && "fill-current")} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }} className="p-1 text-[var(--terminal-text-dim)] hover:text-[var(--terminal-red)]"><Trash2 className="w-3 h-3" /></button>
                                    </>
                                }
                            />
                        );
                    })}
                </TerminalPanel>
            )}

            {/* Move Dialog */}
            {showMoveDialog && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <TerminalPanel title="Move Files" className="w-full max-w-md">
                        <p className="text-xs mb-4">Select destination folder for <span className="text-[var(--terminal-amber)]">{selectedFiles.size} files</span></p>
                        <div className="max-h-60 overflow-y-auto border border-[var(--terminal-border)] mb-4">
                            <button onClick={() => setSelectedMoveTarget(null)} className={cn("w-full text-left p-2 text-xs border-b border-[var(--terminal-border)] flex items-center gap-2", !selectedMoveTarget ? "bg-[rgba(255,176,0,0.1)] text-[var(--terminal-amber)]" : "hover:bg-[var(--terminal-dark)]")}>
                                <Home className="w-3 h-3" /> Root
                            </button>
                            {folderTree.map((f: FolderType) => (
                                <button key={f.id} onClick={() => setSelectedMoveTarget(f.id)} className={cn("w-full text-left p-2 text-xs border-b border-[var(--terminal-border)] flex items-center gap-2", selectedMoveTarget === f.id ? "bg-[rgba(255,176,0,0.1)] text-[var(--terminal-amber)]" : "hover:bg-[var(--terminal-dark)]")}>
                                    <Folder className="w-3 h-3" /> {f.name}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <TerminalButton onClick={() => setShowMoveDialog(false)}>Cancel</TerminalButton>
                            <TerminalButton variant="primary" onClick={handleBulkMove}><FolderInput className="w-3 h-3 mr-1" /> Move</TerminalButton>
                        </div>
                    </TerminalPanel>
                </div>
            )}

            {uploads.length > 0 && <div className="fixed bottom-8 right-4 w-72 z-50"><DirectUploadQueue /></div>}
        </TerminalLayout>
    );
}
