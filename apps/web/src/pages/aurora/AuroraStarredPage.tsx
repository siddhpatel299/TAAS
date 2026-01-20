import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraEmpty, AuroraFileRow, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getIcon(mt: string) { if (mt?.startsWith('image/')) return Image; if (mt?.startsWith('video/')) return Video; if (mt?.startsWith('audio/')) return Music; return FileText; }

export function AuroraStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const unstar = async (id: string) => { await filesApi.toggleStar(id); load(); };

    return (
        <AuroraLayout>
            <AuroraTitle subtitle="Your favorite files">Starred</AuroraTitle>
            <AuroraCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--aurora-gradient-1)]" /></div> :
                    files.length === 0 ? <AuroraEmpty text="No starred files" /> :
                        files.map(f => { const I = getIcon(f.mimeType); return <AuroraFileRow key={f.id} icon={<I className="w-5 h-5" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<AuroraButton onClick={() => unstar(f.id)}><Star className="w-4 h-4" /> Remove</AuroraButton>} />; })}
            </AuroraCard>
        </AuroraLayout>
    );
}
