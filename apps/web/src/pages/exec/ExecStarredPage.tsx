import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecEmpty, ExecFileRow, ExecTitle } from '@/components/exec/ExecComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getIcon(mt: string) { if (mt?.startsWith('image/')) return Image; if (mt?.startsWith('video/')) return Video; if (mt?.startsWith('audio/')) return Music; return FileText; }

export function ExecStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const unstar = async (id: string) => { await filesApi.toggleStar(id); load(); };

    return (
        <ExecLayout>
            <ExecTitle subtitle="Your priority documents">Priority Assets</ExecTitle>
            <ExecCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--exec-gold)]" /></div> :
                    files.length === 0 ? <ExecEmpty text="No priority assets designated" /> :
                        files.map(f => { const I = getIcon(f.mimeType); return <ExecFileRow key={f.id} icon={<I className="w-5 h-5" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<ExecButton onClick={() => unstar(f.id)}><Star className="w-4 h-4" /> Remove Priority</ExecButton>} />; })}
            </ExecCard>
        </ExecLayout>
    );
}
