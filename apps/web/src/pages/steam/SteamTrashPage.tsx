import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamButton, SteamEmpty, SteamFileRow, SteamTitle } from '@/components/steam/SteamComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function SteamTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Permanent disposal?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Empty disposal unit?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <SteamLayout>
            <div className="flex items-center justify-between mb-6">
                <SteamTitle>Disposal Unit</SteamTitle>
                {files.length > 0 && <SteamButton variant="danger" onClick={empty}><Trash2 className="w-4 h-4" /> Purge All</SteamButton>}
            </div>
            <SteamPanel title="Discarded Items">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--steam-brass)]" /></div> :
                    files.length === 0 ? <SteamEmpty text="Disposal unit is empty" /> :
                        files.map(f => <SteamFileRow key={f.id} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><SteamButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></SteamButton><SteamButton variant="danger" onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></SteamButton></>} />)}
            </SteamPanel>
        </SteamLayout>
    );
}
