import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuButton, SkeuEmpty, SkeuFileRow, SkeuTitle } from '@/components/skeu/SkeuComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function SkeuTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <SkeuLayout>
            <div className="flex items-center justify-between mb-6">
                <SkeuTitle subtitle="Deleted items awaiting purge">Recycle Bin</SkeuTitle>
                {files.length > 0 && <SkeuButton onClick={empty}><Trash2 className="w-4 h-4" /> Empty Trash</SkeuButton>}
            </div>
            <SkeuCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--skeu-led-blue)]" /></div> :
                    files.length === 0 ? <SkeuEmpty text="Trash is empty" /> :
                        files.map(f => <SkeuFileRow key={f.id} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><SkeuButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></SkeuButton><SkeuButton onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></SkeuButton></>} />)}
            </SkeuCard>
        </SkeuLayout>
    );
}
