import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenEmpty, ZenFileRow, ZenTitle, ZenSection } from '@/components/zen/ZenComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getIcon(mt: string) { if (mt?.startsWith('image/')) return Image; if (mt?.startsWith('video/')) return Video; if (mt?.startsWith('audio/')) return Music; return FileText; }

export function ZenStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const unstar = async (id: string) => { await filesApi.toggleStar(id); load(); };

    return (
        <ZenLayout>
            <ZenTitle subtitle="Your favorites">Starred</ZenTitle>
            <ZenSection>
                <ZenCard>
                    {loading ? <div className="flex items-center justify-center" style={{ minHeight: '20vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div> :
                        files.length === 0 ? <ZenEmpty text="No starred files" /> :
                            files.map(f => { const I = getIcon(f.mimeType); return <ZenFileRow key={f.id} icon={<I className="w-4 h-4" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<ZenButton onClick={() => unstar(f.id)}><Star className="w-3 h-3" /> Remove</ZenButton>} />; })}
                </ZenCard>
            </ZenSection>
        </ZenLayout>
    );
}
