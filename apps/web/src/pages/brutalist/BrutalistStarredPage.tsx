import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistButton, BrutalistEmpty, BrutalistFileRow, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function BrutalistStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleUnstar = async (id: string) => { await filesApi.toggleStar(id); loadFiles(); };

    return (
        <BrutalistLayout>
            <BrutalistTitle>Starred Files</BrutalistTitle>
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin" /></div> :
                files.length === 0 ? <BrutalistEmpty text="No starred files yet" icon={<Star />} /> :
                    <BrutalistCard className="!p-0">
                        {files.map((f) => { const Icon = getFileIcon(f.mimeType); return <BrutalistFileRow key={f.id} icon={<Icon className="w-6 h-6" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<BrutalistButton variant="primary" onClick={() => handleUnstar(f.id)}><Star className="w-4 h-4 fill-current" /> Unstar</BrutalistButton>} />; })}
                    </BrutalistCard>}
        </BrutalistLayout>
    );
}
