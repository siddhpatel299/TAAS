import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2, FileText, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestEmpty, ForestButton } from '@/components/forest/ForestComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

interface TrashedFile {
    id: string;
    name: string;
    originalName: string;
    size: number;
    updatedAt: string;
}

export function ForestTrashPage() {
    const [trashedFiles, setTrashedFiles] = useState<TrashedFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTrashed = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await filesApi.getFiles({ trash: true });
            setTrashedFiles(response.data?.data || []);
        } catch (error) {
            console.error('Failed to load trashed files:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTrashed();
    }, [loadTrashed]);

    const handleRestore = async (fileId: string) => {
        try {
            await filesApi.restoreFile(fileId);
            loadTrashed();
        } catch (error) {
            console.error('Failed to restore:', error);
        }
    };

    const handlePermanentDelete = async (fileId: string) => {
        if (!confirm('Permanently delete this file?')) return;
        try {
            await filesApi.deleteFile(fileId);
            loadTrashed();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm('Permanently delete all files in trash? This cannot be undone.')) return;
        try {
            for (const file of trashedFiles) {
                await filesApi.deleteFile(file.id);
            }
            loadTrashed();
        } catch (error) {
            console.error('Failed to empty trash:', error);
        }
    };

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Trash"
                subtitle="Deleted files are kept here for 30 days"
                icon={<Trash2 className="w-6 h-6" />}
                actions={
                    trashedFiles.length > 0 && (
                        <ForestButton onClick={handleEmptyTrash} className="text-[var(--forest-danger)] border-[var(--forest-danger)]">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Empty Trash
                        </ForestButton>
                    )
                }
            />

            {/* Warning Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-[rgba(212,169,67,0.1)] border border-[var(--forest-warning)] flex items-center gap-3"
            >
                <AlertTriangle className="w-5 h-5 text-[var(--forest-warning)]" />
                <p className="text-sm text-[var(--forest-wood)]">
                    Files in trash will be permanently deleted after 30 days
                </p>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            ) : trashedFiles.length === 0 ? (
                <ForestCard>
                    <ForestEmpty
                        icon={<Trash2 className="w-full h-full" />}
                        title="Trash is empty"
                        description="Deleted files will appear here"
                    />
                </ForestCard>
            ) : (
                <div className="space-y-3">
                    {trashedFiles.map((file: TrashedFile, index: number) => (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <ForestCard className="!p-4 flex items-center gap-4">
                                <div className="forest-file-icon opacity-50">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[var(--forest-moss)] truncate line-through opacity-70">
                                        {file.originalName || file.name}
                                    </p>
                                    <p className="text-xs text-[var(--forest-wood)]">
                                        {formatFileSize(file.size)} • Deleted {formatDate(file.updatedAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ForestButton onClick={() => handleRestore(file.id)}>
                                        <RotateCcw className="w-4 h-4 mr-1" />
                                        Restore
                                    </ForestButton>
                                    <ForestButton
                                        onClick={() => handlePermanentDelete(file.id)}
                                        className="text-[var(--forest-danger)] border-[var(--forest-danger)]"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </ForestButton>
                                </div>
                            </ForestCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </ForestLayout>
    );
}
