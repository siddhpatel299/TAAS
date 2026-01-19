import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2,
    Search,
    Grid,
    List,
    RefreshCw,
    RotateCcw,
    AlertTriangle,
    Skull,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton } from '@/components/hud/HUDComponents';
import { HUDFileCard, HUDEmptyState } from '@/components/hud/HUDFileCards';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FilePreview } from '@/components/FilePreview';

export function HUDTrashPage() {
    const { files, setFiles, viewMode, setViewMode, searchQuery, setSearchQuery } = useFilesStore();
    const [isLoading, setIsLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);

    const loadTrashFiles = async () => {
        setIsLoading(true);
        try {
            const response = await filesApi.getFiles({ trash: true });
            setFiles(response.data?.data || []);
        } catch (error) {
            console.error('Failed to load trash:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTrashFiles();
    }, []);

    const handleRestore = async (file: StoredFile) => {
        try {
            await filesApi.restoreFile(file.id);
            loadTrashFiles();
        } catch (error) {
            console.error('Restore failed:', error);
        }
    };

    const handlePermanentDelete = async (file: StoredFile) => {
        try {
            await filesApi.deleteFile(file.id, true);
            loadTrashFiles();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm('Permanently delete all files in trash? This cannot be undone.')) return;
        try {
            await filesApi.emptyTrash();
            loadTrashFiles();
        } catch (error) {
            console.error('Empty trash failed:', error);
        }
    };

    const filteredFiles = files.filter(f =>
        (f.originalName || f.name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <HUDLayout>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Trash2 className="w-10 h-10 text-red-400" style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                                RECYCLING BIN
                            </h1>
                            <p className="text-cyan-600/70 mt-1">
                                {filteredFiles.length} deleted {filteredFiles.length === 1 ? 'file' : 'files'}
                            </p>
                        </div>
                    </div>

                    {filteredFiles.length > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.3 }}
                        >
                            <HUDButton onClick={handleEmptyTrash}>
                                <Skull className="w-4 h-4 mr-2" />
                                Empty Trash
                            </HUDButton>
                        </motion.div>
                    )}
                </div>

                {/* Warning banner */}
                {filteredFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                    >
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-sm text-red-300">Files in trash will be permanently deleted after 30 days</span>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1 }}
                />
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <HUDPanel className="p-4 mb-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                            <input
                                type="text"
                                placeholder="Search trash..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="hud-input pl-10 pr-4 py-2 w-full"
                            />
                        </div>

                        <div className="flex items-center gap-2">
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

                            <button
                                onClick={loadTrashFiles}
                                className="p-2 text-cyan-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            >
                                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                            </button>
                        </div>
                    </div>
                </HUDPanel>
            </motion.div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <motion.div
                        className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            ) : filteredFiles.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <HUDPanel className="p-8">
                        <HUDEmptyState
                            icon={<Trash2 className="w-10 h-10 text-cyan-400" />}
                            title="Trash is empty"
                            description="Deleted files will appear here"
                        />
                    </HUDPanel>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                            : "space-y-2"
                    )}
                >
                    <AnimatePresence>
                        {filteredFiles.map((file, index) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative group"
                            >
                                <HUDFileCard
                                    id={file.id}
                                    name={file.originalName || file.name}
                                    mimeType={file.mimeType}
                                    size={file.size}
                                    onClick={() => setPreviewFile(file)}
                                    onPreview={() => setPreviewFile(file)}
                                />
                                {/* Restore/Delete overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleRestore(file)}
                                        className="p-2 bg-green-500/20 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors"
                                        title="Restore"
                                    >
                                        <RotateCcw className="w-5 h-5 text-green-400" />
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(file)}
                                        className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
                                        title="Delete permanently"
                                    >
                                        <Skull className="w-5 h-5 text-red-400" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {previewFile && (
                <FilePreview
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </HUDLayout>
    );
}
