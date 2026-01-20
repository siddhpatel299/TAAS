import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoButton, DecoEmpty, DecoFileRow, DecoTitle } from '@/components/artdeco/ArtDecoComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getIcon(mt: string) { if (mt?.startsWith('image/')) return Image; if (mt?.startsWith('video/')) return Video; if (mt?.startsWith('audio/')) return Music; return FileText; }

export function ArtDecoStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const unstar = async (id: string) => { await filesApi.toggleStar(id); load(); };

    return (
        <ArtDecoLayout>
            <DecoTitle>Starred Files</DecoTitle>
            <DecoCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--deco-gold)]" /></div> :
                    files.length === 0 ? <DecoEmpty text="No starred files yet" /> :
                        files.map(f => { const I = getIcon(f.mimeType); return <DecoFileRow key={f.id} icon={<I className="w-6 h-6" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<DecoButton variant="danger" onClick={() => unstar(f.id)}><Star className="w-4 h-4" /> Unstar</DecoButton>} />; })}
            </DecoCard>
        </ArtDecoLayout>
    );
}
