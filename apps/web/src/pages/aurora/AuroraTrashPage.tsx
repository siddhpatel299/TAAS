import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraEmpty, AuroraFileRow, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function AuroraTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <AuroraLayout>
            <div className="flex items-center justify-between mb-6">
                <AuroraTitle subtitle="Deleted files">Trash</AuroraTitle>
                {files.length > 0 && <AuroraButton onClick={empty}><Trash2 className="w-4 h-4" /> Empty Trash</AuroraButton>}
            </div>
            <AuroraCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--aurora-gradient-1)]" /></div> :
                    files.length === 0 ? <AuroraEmpty text="Trash is empty" /> :
                        files.map(f => <AuroraFileRow key={f.id} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><AuroraButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></AuroraButton><AuroraButton onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></AuroraButton></>} />)}
            </AuroraCard>
        </AuroraLayout>
    );
}
