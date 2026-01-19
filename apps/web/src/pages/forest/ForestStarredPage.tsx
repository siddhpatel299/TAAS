import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestEmpty, ForestButton } from '@/components/forest/ForestComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

interface StoredFile {
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    isStarred: boolean;
}

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function ForestStarredPage() {
    const [starredFiles, setStarredFiles] = useState<StoredFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadStarred = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await filesApi.getFiles({ starred: true });
            setStarredFiles(response.data?.data || []);
        } catch (error) {
            console.error('Failed to load starred files:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStarred();
    }, [loadStarred]);

    const handleUnstar = async (fileId: string) => {
        try {
            await filesApi.toggleStar(fileId);
            loadStarred();
        } catch (error) {
            console.error('Failed to unstar:', error);
        }
    };

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Starred Files"
                subtitle="Your favorite files in one place"
                icon={<Star className="w-6 h-6" />}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            ) : starredFiles.length === 0 ? (
                <ForestCard>
                    <ForestEmpty
                        icon={<Star className="w-full h-full" />}
                        title="No starred files"
                        description="Star your important files to access them quickly"
                    />
                </ForestCard>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {starredFiles.map((file, index) => {
                        const FileIcon = getFileIcon(file.mimeType);
                        return (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ForestCard className="text-center relative">
                                    <motion.div
                                        className="absolute top-2 right-2"
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Star className="w-5 h-5 text-[var(--forest-warning)] fill-current" />
                                    </motion.div>

                                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl forest-file-icon">
                                        <FileIcon className="w-8 h-8" />
                                    </div>
                                    <p className="font-medium text-[var(--forest-moss)] truncate">{file.originalName || file.name}</p>
                                    <p className="text-xs text-[var(--forest-wood)] mt-1">
                                        {formatFileSize(file.size)}
                                    </p>
                                    <div className="mt-3">
                                        <ForestButton onClick={() => handleUnstar(file.id)} className="text-xs py-1 px-3">
                                            Unstar
                                        </ForestButton>
                                    </div>
                                </ForestCard>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </ForestLayout>
    );
}
