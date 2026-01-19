import { useState, useEffect, useCallback } from 'react';
import { Star, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton, BlueprintFileRow, BlueprintEmpty } from '@/components/blueprint/BlueprintComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function BlueprintStarredPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try { const r = await filesApi.getFiles({ starred: true }); setFiles(r.data?.data || []); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleUnstar = async (id: string) => { await filesApi.toggleStar(id); loadFiles(); };

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Starred Files" subtitle={`${files.length} files`} />
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div> :
                files.length === 0 ? <BlueprintEmpty icon={<Star className="w-8 h-8" />} text="No starred files" /> :
                    <BlueprintCard className="!p-0 overflow-hidden">
                        {files.map((f) => { const Icon = getFileIcon(f.mimeType); return <BlueprintFileRow key={f.id} icon={<Icon className="w-4 h-4" />} name={f.originalName || f.name} meta={formatFileSize(f.size)} actions={<BlueprintButton variant="ghost" onClick={() => handleUnstar(f.id)}><Star className="w-4 h-4 fill-current text-[var(--blueprint-cyan)]" /></BlueprintButton>} />; })}
                    </BlueprintCard>}
        </BlueprintLayout>
    );
}
