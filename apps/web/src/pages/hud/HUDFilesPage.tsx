import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Upload,
    FolderPlus,
    ChevronRight,
    Home,
    Grid,
    List,
    RefreshCw,
    Folder,
    Trash2,
    Star,
    X,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton } from '@/components/hud/HUDComponents';
import { HUDFileCard, HUDFolderCard, HUDEmptyState } from '@/components/hud/HUDFileCards';
import { useFilesStore, StoredFile, Folder as FolderType } from '@/stores/files.store';
import { useDirectUpload } from '@/contexts/DirectUploadContext';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FilePreview } from '@/components/FilePreview';
import { DirectUploadQueue } from '@/components/DirectUploadQueue';

interface BreadcrumbItem {
    id: string | null;
    name: string;
}

export function HUDFilesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFolderId = searchParams.get('folder');

    const {
        files,
        folders,
        setFiles,
        setFolders,
        selectedFiles,
        toggleFileSelection,
        clearSelection,
        selectAll,
        viewMode,
        setViewMode,
        searchQuery,
        setSearchQuery,
    } = useFilesStore();

    const { uploadFiles, uploads } = useDirectUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: 'Home' }]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Load files and folders
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

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    // Build breadcrumb from folder hierarchy
    useEffect(() => {
        const buildBreadcrumb = async () => {
            if (!currentFolderId) {
                setBreadcrumb([{ id: null, name: 'Home' }]);
                return;
            }
            try {
                // Get folder info for breadcrumb
                const response = await foldersApi.getFolder(currentFolderId);
                const folder = response.data?.data;
                if (folder) {
                    setBreadcrumb([
                        { id: null, name: 'Home' },
                        { id: folder.id, name: folder.name },
                    ]);
                }
            } catch (error) {
                console.error('Failed to build breadcrumb:', error);
            }
        };
        buildBreadcrumb();
    }, [currentFolderId]);

    // Navigate to folder
    const navigateToFolder = (folderId: string | null) => {
        clearSelection();
        if (folderId) {
            setSearchParams({ folder: folderId });
        } else {
            setSearchParams({});
        }
    };

    // File operations
    const handleUpload = (uploadFilesList: File[]) => {
        uploadFiles(uploadFilesList, currentFolderId || undefined);
    };

    const handleDownload = async (file: StoredFile) => {
        try {
            const response = await filesApi.downloadFile(file.id);
            const url = response.data?.data?.url;
            if (url) {
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Download failed:', error);
        }
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

    // Bulk actions
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

    const handleBulkStar = async (starred: boolean) => {
        if (selectedFiles.size === 0) return;
        try {
            await bulkApi.starFiles(Array.from(selectedFiles), starred);
            clearSelection();
            loadContent();
        } catch (error) {
            console.error('Bulk star failed:', error);
        }
    };

    // Filter files by search
    const filteredFiles = files.filter(f =>
        (f.originalName || f.name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFolders = folders.filter((f: FolderType) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <HUDLayout>
            {/* Header */}
            <div className="mb-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                            FILE SYSTEM
                        </h1>
                        <p className="text-cyan-600/70 mt-1">Secure cloud storage</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <HUDButton onClick={() => setShowNewFolderInput(true)}>
                            <FolderPlus className="w-4 h-4 mr-2" />
                            New Folder
                        </HUDButton>
                        <HUDButton variant="primary" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                        </HUDButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                const fileList = Array.from(e.target.files || []);
                                if (fileList.length > 0) handleUpload(fileList);
                                e.target.value = '';
                            }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Toolbar */}
            <HUDPanel className="p-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-sm overflow-x-auto">
                        {breadcrumb.map((item, index) => (
                            <div key={item.id || 'home'} className="flex items-center">
                                {index > 0 && <ChevronRight className="w-4 h-4 text-cyan-600 mx-1" />}
                                <button
                                    onClick={() => navigateToFolder(item.id)}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-lg transition-colors",
                                        index === breadcrumb.length - 1
                                            ? "text-cyan-400 bg-cyan-500/10"
                                            : "text-cyan-600 hover:text-cyan-400 hover:bg-cyan-500/10"
                                    )}
                                >
                                    {index === 0 && <Home className="w-4 h-4" />}
                                    <span className="truncate max-w-[100px]">{item.name}</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="hud-input pl-10 pr-4 py-2 w-48"
                            />
                        </div>

                        {/* View toggle */}
                        <div className="flex border border-cyan-500/30 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'grid' ? "bg-cyan-500/20 text-cyan-400" : "text-cyan-600 hover:bg-cyan-500/10"
                                )}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'list' ? "bg-cyan-500/20 text-cyan-400" : "text-cyan-600 hover:bg-cyan-500/10"
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={loadContent}
                            className="p-2 text-cyan-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        >
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </HUDPanel>

            {/* Bulk actions bar */}
            <AnimatePresence>
                {selectedFiles.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4"
                    >
                        <HUDPanel className="p-3" glow>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-cyan-400 font-medium">
                                        {selectedFiles.size} selected
                                    </span>
                                    <button
                                        onClick={() => selectAll()}
                                        className="text-sm text-cyan-500 hover:text-cyan-400"
                                    >
                                        Select all
                                    </button>
                                    <button
                                        onClick={clearSelection}
                                        className="text-sm text-cyan-500 hover:text-cyan-400"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <HUDButton onClick={() => handleBulkStar(true)}>
                                        <Star className="w-4 h-4 mr-1" /> Star
                                    </HUDButton>
                                    <HUDButton onClick={handleBulkDelete}>
                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                    </HUDButton>
                                </div>
                            </div>
                        </HUDPanel>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New folder input */}
            <AnimatePresence>
                {showNewFolderInput && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4"
                    >
                        <HUDPanel className="p-4">
                            <div className="flex items-center gap-3">
                                <Folder className="w-5 h-5 text-cyan-400" />
                                <input
                                    type="text"
                                    placeholder="Folder name..."
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                    className="hud-input flex-1"
                                    autoFocus
                                />
                                <HUDButton variant="primary" onClick={handleCreateFolder}>
                                    Create
                                </HUDButton>
                                <button
                                    onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }}
                                    className="p-2 text-cyan-600 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </HUDPanel>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <HUDPanel className="p-8">
                    <HUDEmptyState
                        icon={<Folder className="w-10 h-10 text-cyan-400" />}
                        title="No files or folders"
                        description="Upload files or create folders to get started"
                        action={
                            <HUDButton variant="primary" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" /> Upload Files
                            </HUDButton>
                        }
                    />
                </HUDPanel>
            ) : (
                <>
                    {/* Folders */}
                    {filteredFolders.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-cyan-500 uppercase tracking-wider mb-3">
                                Folders ({filteredFolders.length})
                            </h3>
                            <div className={cn(
                                viewMode === 'grid'
                                    ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                                    : "space-y-2"
                            )}>
                                {filteredFolders.map((folder: FolderType) => (
                                    <HUDFolderCard
                                        key={folder.id}
                                        id={folder.id}
                                        name={folder.name}
                                        fileCount={folder._count?.files || 0}
                                        onClick={() => navigateToFolder(folder.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    {filteredFiles.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-cyan-500 uppercase tracking-wider mb-3">
                                Files ({filteredFiles.length})
                            </h3>
                            <div className={cn(
                                viewMode === 'grid'
                                    ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                                    : "space-y-2"
                            )}>
                                {filteredFiles.map((file) => (
                                    <HUDFileCard
                                        key={file.id}
                                        id={file.id}
                                        name={file.originalName || file.name}
                                        mimeType={file.mimeType}
                                        size={file.size}
                                        isStarred={file.isStarred}
                                        isSelected={selectedFiles.has(file.id)}
                                        onClick={() => toggleFileSelection(file.id)}
                                        onDownload={() => handleDownload(file)}
                                        onStar={() => handleStar(file)}
                                        onDelete={() => handleDelete(file)}
                                        onPreview={() => setPreviewFile(file)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Upload queue */}
            {uploads.length > 0 && (
                <div className="fixed bottom-6 right-6 w-80 z-50">
                    <DirectUploadQueue />
                </div>
            )}

            {/* File preview */}
            {previewFile && (
                <FilePreview
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </HUDLayout>
    );
}
