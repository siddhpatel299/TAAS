import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintButton, NewsprintEmpty, NewsprintFileItem } from '@/components/newsprint/NewsprintComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function NewsprintStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleUnstar = async (id: string) => { await filesApi.toggleStar(id); loadFiles(); };

    return (
        <NewsprintLayout>
            <h1 className="text-3xl mb-6" style={{ fontFamily: 'var(--font-headline)' }}>Starred Files</h1>
            <NewsprintSection title={`${files.length} Favorites`}>
                {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div> :
                    files.length === 0 ? <NewsprintEmpty text="No starred files yet. Star your important files to find them easily." /> :
                        <NewsprintCard className="!p-0">
                            {files.map((f) => { const Icon = getFileIcon(f.mimeType); return <NewsprintFileItem key={f.id} icon={<Icon className="w-4 h-4" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<NewsprintButton onClick={() => handleUnstar(f.id)}><Star className="w-4 h-4 fill-current text-[var(--newsprint-red)]" /> Unstar</NewsprintButton>} />; })}
                        </NewsprintCard>}
            </NewsprintSection>
        </NewsprintLayout>
    );
}
