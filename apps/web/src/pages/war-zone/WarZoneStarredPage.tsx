import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, FileText } from 'lucide-react';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi } from '@/lib/api';
import { HoloCard } from '@/components/war-zone/HoloCard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function WarZoneStarredPage() {
    const { setLoading } = useFilesStore();
    const [files, setFiles] = useState<StoredFile[]>([]);

    const loadContent = useCallback(async () => {
        setLoading(true);
        try {
            const res = await filesApi.getFiles({ starred: true });
            setFiles(res.data.data);
        } catch (error) {
            console.error('Failed to load starred files:', error);
        } finally {
            setLoading(false);
        }
    }, [setLoading]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <HoloCard className="p-4 flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-pulse" />
                <h1 className="text-xl font-bold text-yellow-100 tracking-widest">PRIORITY_ASSETS // FAVORITES</h1>
            </HoloCard>

            <HoloCard className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {files.map((file, i) => (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-yellow-950/10 border border-yellow-500/20 p-4 rounded hover:bg-yellow-900/20 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <FileText className="w-5 h-5 text-yellow-600" />
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </div>
                            <p className="text-cyan-100 font-medium truncate mb-1">{file.originalName}</p>
                            <p className="text-xs text-yellow-700/60 font-mono">
                                {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                            </p>
                        </motion.div>
                    ))}
                    {files.length === 0 && (
                        <div className="col-span-full text-center text-yellow-900/50 font-mono py-12">
                            NO PRIORITY ASSETS DESIGNATED
                        </div>
                    )}
                </div>
            </HoloCard>
        </div>
    );
}
