import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Upload, FolderPlus, ChevronRight, Home, Grid, List, RefreshCw, Folder, Trash2, Star, X, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestButton, ForestEmpty } from '@/components/forest/ForestComponents';
import { useFilesStore, StoredFile, Folder as FolderType } from '@/stores/files.store';
import { useDirectUpload } from '@/contexts/DirectUploadContext';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { cn, formatFileSize } from '@/lib/utils';
import { DirectUploadQueue } from '@/components/DirectUploadQueue';

interface BreadcrumbItem {
    id: string | null;
    name: string;
}

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function ForestFilesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFolderId = searchParams.get('folder');

    const { files, folders, setFiles, setFolders, selectedFiles, toggleFileSelection, clearSelection, selectAll, viewMode, setViewMode, searchQuery, setSearchQuery } = useFilesStore();
    const { uploadFiles, uploads } = useDirectUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: 'Home' }]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

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
            console.error('Failed to load content:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentFolderId, setFiles, setFolders]);

    useEffect(() => { loadContent(); }, [loadContent]);

    useEffect(() => {
        const buildBreadcrumb = async () => {
            if (!currentFolderId) {
                setBreadcrumb([{ id: null, name: 'Home' }]);
                return;
            }
            try {
                const response = await foldersApi.getFolder(currentFolderId);
                const folder = response.data?.data;
                if (folder) {
                    setBreadcrumb([{ id: null, name: 'Home' }, { id: folder.id, name: folder.name }]);
                }
            } catch (error) {
                console.error('Failed to build breadcrumb:', error);
            }
        };
        buildBreadcrumb();
    }, [currentFolderId]);

    const navigateToFolder = (folderId: string | null) => {
        clearSelection();
        if (folderId) setSearchParams({ folder: folderId });
        else setSearchParams({});
    };

    const handleUpload = (uploadFilesList: File[]) => {
        uploadFiles(uploadFilesList, currentFolderId || undefined);
    };

    const handleStar = async (file: StoredFile) => {
        try {
            await filesApi.toggleStar(file.id);
            loadContent();
        } catch (error) {
            console.error('Star failed:', error);
        }
    };

    const handleDelete = async (file: StoredFile) => {
        try {
            await filesApi.deleteFile(file.id);
            loadContent();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await foldersApi.createFolder(newFolderName.trim(), currentFolderId || undefined);
            setNewFolderName('');
            setShowNewFolderInput(false);
            loadContent();
        } catch (error) {
            console.error('Create folder failed:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return;
        try {
            await bulkApi.deleteFiles(Array.from(selectedFiles));
            clearSelection();
            loadContent();
        } catch (error) {
            console.error('Bulk delete failed:', error);
        }
    };

    const filteredFiles = files.filter(f => (f.originalName || f.name).toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredFolders = folders.filter((f: FolderType) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Files"
                subtitle="Manage your files and folders"
                icon={<Folder className="w-6 h-6" />}
                actions={
                    <div className="flex items-center gap-2">
                        <ForestButton onClick={() => setShowNewFolderInput(true)}><FolderPlus className="w-4 h-4 mr-2" /> New Folder</ForestButton>
                        <ForestButton variant="primary" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Upload</ForestButton>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { const fileList = Array.from(e.target.files || []); if (fileList.length > 0) handleUpload(fileList); e.target.value = ''; }} />
                    </div>
                }
            />

            {/* Toolbar */}
            <ForestCard className="!p-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-sm overflow-x-auto">
                        {breadcrumb.map((item, index) => (
                            <div key={item.id || 'home'} className="flex items-center">
                                {index > 0 && <ChevronRight className="w-4 h-4 text-[var(--forest-wood)] mx-1" />}
                                <button onClick={() => navigateToFolder(item.id)} className={cn("flex items-center gap-1 px-2 py-1 rounded-lg transition-colors", index === breadcrumb.length - 1 ? "text-[var(--forest-moss)] bg-[rgba(74,124,89,0.1)]" : "text-[var(--forest-wood)] hover:text-[var(--forest-moss)]")}>
                                    {index === 0 && <Home className="w-4 h-4" />}
                                    <span className="truncate max-w-[100px]">{item.name}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--forest-wood)]" />
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="forest-input pl-10 pr-4 py-2 w-40" />
                        </div>
                        <div className="flex border border-[rgba(74,124,89,0.2)] rounded-lg overflow-hidden">
                            <button onClick={() => setViewMode('grid')} className={cn("p-2", viewMode === 'grid' ? "bg-[rgba(74,124,89,0.1)] text-[var(--forest-leaf)]" : "text-[var(--forest-wood)]")}><Grid className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('list')} className={cn("p-2", viewMode === 'list' ? "bg-[rgba(74,124,89,0.1)] text-[var(--forest-leaf)]" : "text-[var(--forest-wood)]")}><List className="w-4 h-4" /></button>
                        </div>
                        <button onClick={loadContent} className="p-2 text-[var(--forest-wood)] hover:text-[var(--forest-leaf)] rounded-lg transition-colors"><RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /></button>
                    </div>
                </div>
            </ForestCard>

            {/* Bulk actions */}
            <AnimatePresence>
                {selectedFiles.size > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
                        <ForestCard className="!p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[var(--forest-moss)] font-medium">{selectedFiles.size} selected</span>
                                    <button onClick={() => selectAll()} className="text-sm text-[var(--forest-leaf)] hover:underline">Select all</button>
                                    <button onClick={clearSelection} className="text-sm text-[var(--forest-leaf)] hover:underline">Clear</button>
                                </div>
                                <ForestButton onClick={handleBulkDelete} className="!text-[var(--forest-danger)] !border-[var(--forest-danger)]"><Trash2 className="w-4 h-4 mr-1" /> Delete</ForestButton>
                            </div>
                        </ForestCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New folder input */}
            <AnimatePresence>
                {showNewFolderInput && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
                        <ForestCard className="!p-4">
                            <div className="flex items-center gap-3">
                                <Folder className="w-5 h-5 text-[var(--forest-leaf)]" />
                                <input type="text" placeholder="Folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} className="forest-input flex-1" autoFocus />
                                <ForestButton variant="primary" onClick={handleCreateFolder}>Create</ForestButton>
                                <button onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }} className="p-2 text-[var(--forest-wood)] hover:text-[var(--forest-danger)]"><X className="w-4 h-4" /></button>
                            </div>
                        </ForestCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" /></div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <ForestCard><ForestEmpty icon={<Folder className="w-full h-full" />} title="No files or folders" description="Upload files or create folders to get started" action={<ForestButton variant="primary" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Upload</ForestButton>} /></ForestCard>
            ) : (
                <>
                    {filteredFolders.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-[var(--forest-wood)] uppercase tracking-wider mb-3">Folders ({filteredFolders.length})</h3>
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" : "space-y-2"}>
                                {filteredFolders.map((folder: FolderType) => (
                                    <ForestCard key={folder.id} className="cursor-pointer !p-4" onClick={() => navigateToFolder(folder.id)}>
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-8 h-8 text-[var(--forest-leaf)]" />
                                            <div><p className="font-medium text-[var(--forest-moss)] truncate">{folder.name}</p><p className="text-xs text-[var(--forest-wood)]">{folder._count?.files || 0} files</p></div>
                                        </div>
                                    </ForestCard>
                                ))}
                            </div>
                        </div>
                    )}
                    {filteredFiles.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-[var(--forest-wood)] uppercase tracking-wider mb-3">Files ({filteredFiles.length})</h3>
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" : "space-y-2"}>
                                {filteredFiles.map((file) => {
                                    const FileIcon = getFileIcon(file.mimeType);
                                    return (
                                        <ForestCard key={file.id} className={cn("!p-4", selectedFiles.has(file.id) && "ring-2 ring-[var(--forest-leaf)]")}>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => toggleFileSelection(file.id)} className="forest-file-icon"><FileIcon className="w-5 h-5" /></button>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[var(--forest-moss)] truncate">{file.originalName || file.name}</p>
                                                    <p className="text-xs text-[var(--forest-wood)]">{formatFileSize(file.size)}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleStar(file)} className={cn("p-1 rounded hover:bg-[rgba(74,124,89,0.1)]", file.isStarred && "text-[var(--forest-warning)]")}><Star className={cn("w-4 h-4", file.isStarred && "fill-current")} /></button>
                                                    <button onClick={() => handleDelete(file)} className="p-1 rounded hover:bg-[rgba(196,92,92,0.1)] text-[var(--forest-danger)]"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </ForestCard>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {uploads.length > 0 && (<div className="fixed bottom-6 right-6 w-80 z-50"><DirectUploadQueue /></div>)}
        </ForestLayout>
    );
}
