import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    Search,
    Grid,
    List,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel } from '@/components/hud/HUDComponents';
import { HUDFileCard, HUDEmptyState } from '@/components/hud/HUDFileCards';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FilePreview } from '@/components/FilePreview';

export function HUDStarredPage() {
    const { files, setFiles, viewMode, setViewMode, searchQuery, setSearchQuery } = useFilesStore();
    const [isLoading, setIsLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);

    const loadStarredFiles = async () => {
        setIsLoading(true);
        try {
            const response = await filesApi.getFiles({ starred: true });
            setFiles(response.data?.data || []);
        } catch (error) {
            console.error('Failed to load starred files:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStarredFiles();
    }, []);

    const handleDownload = async (file: StoredFile) => {
        try {
            const response = await filesApi.downloadFile(file.id);
            const url = response.data?.data?.url;
            if (url) window.open(url, '_blank');
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleUnstar = async (file: StoredFile) => {
        try {
            await filesApi.toggleStar(file.id);
            loadStarredFiles();
        } catch (error) {
            console.error('Unstar failed:', error);
        }
    };

    const handleDelete = async (file: StoredFile) => {
        try {
            await filesApi.deleteFile(file.id);
            loadStarredFiles();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const filteredFiles = files.filter(f =>
        (f.originalName || f.name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <HUDLayout>
            {/* Header with animation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" style={{ filter: 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))' }} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                                FAVORITES
                            </h1>
                            <p className="text-cyan-600/70 mt-1">
                                {filteredFiles.length} starred {filteredFiles.length === 1 ? 'file' : 'files'}
                            </p>
                        </div>
                    </div>

                    {/* Sparkle animation */}
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                }}
                            >
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Animated divider */}
                <motion.div
                    className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
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
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                            <input
                                type="text"
                                placeholder="Search favorites..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="hud-input pl-10 pr-4 py-2 w-full"
                            />
                        </div>

                        <div className="flex items-center gap-2">
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
                                onClick={loadStarredFiles}
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
                        className="w-12 h-12 border-2 border-yellow-500 border-t-transparent rounded-full"
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
                            icon={<Star className="w-10 h-10 text-yellow-400" />}
                            title="No favorites yet"
                            description="Star files to add them here for quick access"
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
                            >
                                <HUDFileCard
                                    id={file.id}
                                    name={file.originalName || file.name}
                                    mimeType={file.mimeType}
                                    size={file.size}
                                    isStarred={true}
                                    onClick={() => setPreviewFile(file)}
                                    onDownload={() => handleDownload(file)}
                                    onStar={() => handleUnstar(file)}
                                    onDelete={() => handleDelete(file)}
                                    onPreview={() => setPreviewFile(file)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
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
