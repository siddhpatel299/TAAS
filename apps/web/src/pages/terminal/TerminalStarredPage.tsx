import { useEffect, useState, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalFileRow, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function TerminalStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadStarred = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await filesApi.getFiles({ starred: true });
            setFiles(response.data?.data || []);
        } catch (error) {
            console.error('Failed to load:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadStarred(); }, [loadStarred]);

    const handleUnstar = async (fileId: string) => {
        await filesApi.toggleStar(fileId);
        loadStarred();
    };

    return (
        <TerminalLayout>
            <TerminalHeader title="Starred Files" subtitle={`${files.length} items`} />

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : files.length === 0 ? (
                <TerminalEmpty icon={<Star className="w-full h-full" />} text="No starred files" />
            ) : (
                <TerminalPanel>
                    {files.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        return (
                            <TerminalFileRow
                                key={file.id}
                                icon={<Icon className="w-4 h-4" />}
                                name={file.originalName || file.name}
                                meta={formatFileSize(file.size)}
                                actions={
                                    <TerminalButton onClick={() => handleUnstar(file.id)}>
                                        <Star className="w-3 h-3 mr-1 fill-current text-[var(--terminal-amber)]" /> Unstar
                                    </TerminalButton>
                                }
                            />
                        );
                    })}
                </TerminalPanel>
            )}
        </TerminalLayout>
    );
}
