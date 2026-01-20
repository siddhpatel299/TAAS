import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveButton, ArchiveEmpty, ArchiveFileRow, ArchiveTitle } from '@/components/archive/ArchiveComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getIcon(mt: string) { if (mt?.startsWith('image/')) return Image; if (mt?.startsWith('video/')) return Video; if (mt?.startsWith('audio/')) return Music; return FileText; }

export function ArchiveStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const unstar = async (id: string) => { await filesApi.toggleStar(id); load(); };

    return (
        <ArchiveLayout>
            <ArchiveTitle>Starred Entries</ArchiveTitle>
            <ArchiveSection title="Favorites" count={files.length}>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--archive-accent)]" /></div> :
                    files.length === 0 ? <ArchiveEmpty title="No starred entries" text="Star files to add them to this collection." /> :
                        files.map((f, i) => { const I = getIcon(f.mimeType); return <ArchiveFileRow key={f.id} index={i} icon={<I className="w-5 h-5" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<ArchiveButton onClick={() => unstar(f.id)}><Star className="w-4 h-4" /> Remove</ArchiveButton>} />; })}
            </ArchiveSection>
        </ArchiveLayout>
    );
}
