import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton, MidnightFileRow, MidnightEmpty } from '@/components/midnight/MidnightComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function MidnightStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await filesApi.getFiles({ starred: true });
            setFiles(res.data?.data || []);
        } catch (error) {
            console.error('Failed to load starred files:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    const handleUnstar = async (fileId: string) => {
        await filesApi.toggleStar(fileId);
        loadFiles();
    };

    return (
        <MidnightLayout>
            <MidnightHeader title="Starred" subtitle={`${files.length} starred files`} />

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div>
            ) : files.length === 0 ? (
                <MidnightEmpty icon={<Star className="w-8 h-8" />} text="No starred files yet" />
            ) : (
                <MidnightCard className="!p-0 overflow-hidden">
                    {files.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        return (
                            <MidnightFileRow
                                key={file.id}
                                icon={<Icon className="w-5 h-5" />}
                                name={file.originalName || file.name}
                                meta={formatFileSize(file.size)}
                                actions={
                                    <MidnightButton variant="ghost" onClick={() => handleUnstar(file.id)}>
                                        <Star className="w-4 h-4 fill-current text-[var(--midnight-gold)]" />
                                    </MidnightButton>
                                }
                            />
                        );
                    })}
                </MidnightCard>
            )}
        </MidnightLayout>
    );
}
