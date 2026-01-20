import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasButton, CanvasEmpty, CanvasFileRow, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getIcon(mt: string) { if (mt?.startsWith('image/')) return Image; if (mt?.startsWith('video/')) return Video; if (mt?.startsWith('audio/')) return Music; return FileText; }

export function CanvasStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const unstar = async (id: string) => { await filesApi.toggleStar(id); load(); };

    return (
        <CanvasLayout>
            <CanvasTitle>Starred Files</CanvasTitle>
            <CanvasWindow title="Starred" icon={<Star className="w-4 h-4" />} zLevel="mid">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--canvas-accent)]" /></div> :
                    files.length === 0 ? <CanvasEmpty text="No starred files yet" icon={<Star className="w-10 h-10" />} /> :
                        files.map(f => { const I = getIcon(f.mimeType); return <CanvasFileRow key={f.id} icon={<I className="w-5 h-5" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<CanvasButton variant="danger" onClick={() => unstar(f.id)}><Star className="w-4 h-4" /> Unstar</CanvasButton>} />; })}
            </CanvasWindow>
        </CanvasLayout>
    );
}
