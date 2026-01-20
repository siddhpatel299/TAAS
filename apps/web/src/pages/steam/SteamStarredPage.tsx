import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamButton, SteamEmpty, SteamFileRow, SteamTitle } from '@/components/steam/SteamComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getIcon(mt: string) { if (mt?.startsWith('image/')) return Image; if (mt?.startsWith('video/')) return Video; if (mt?.startsWith('audio/')) return Music; return FileText; }

export function SteamStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const unstar = async (id: string) => { await filesApi.toggleStar(id); load(); };

    return (
        <SteamLayout>
            <SteamTitle>Favorites Registry</SteamTitle>
            <SteamPanel title="Starred Items">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--steam-brass)]" /></div> :
                    files.length === 0 ? <SteamEmpty text="No starred files in the registry" /> :
                        files.map(f => { const I = getIcon(f.mimeType); return <SteamFileRow key={f.id} icon={<I className="w-5 h-5" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<SteamButton variant="danger" onClick={() => unstar(f.id)}><Star className="w-4 h-4" /> Remove</SteamButton>} />; })}
            </SteamPanel>
        </SteamLayout>
    );
}
