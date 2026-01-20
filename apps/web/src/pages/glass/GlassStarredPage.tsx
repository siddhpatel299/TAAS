import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassButton, GlassEmpty, GlassFileRow, GlassTitle } from '@/components/glass/GlassComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function GlassStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleUnstar = async (id: string) => { await filesApi.toggleStar(id); loadFiles(); };

    return (
        <GlassLayout>
            <GlassTitle>Starred Files</GlassTitle>
            <GlassCard flat>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--glass-accent)]" /></div> :
                    files.length === 0 ? <GlassEmpty text="No starred files yet" icon={<Star className="w-12 h-12" />} /> :
                        files.map((f) => { const Icon = getFileIcon(f.mimeType); return <GlassFileRow key={f.id} icon={<Icon className="w-6 h-6" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<GlassButton variant="danger" onClick={() => handleUnstar(f.id)}><Star className="w-4 h-4 fill-current" /> Unstar</GlassButton>} />; })}
            </GlassCard>
        </GlassLayout>
    );
}
