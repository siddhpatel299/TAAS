import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecEmpty, ExecFileRow, ExecTitle } from '@/components/exec/ExecComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function ExecTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Purge all archived assets?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <ExecLayout>
            <div className="flex items-center justify-between mb-8">
                <ExecTitle subtitle="Assets pending permanent deletion">Archive</ExecTitle>
                {files.length > 0 && <ExecButton onClick={empty}><Trash2 className="w-4 h-4" /> Purge Archive</ExecButton>}
            </div>
            <ExecCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--exec-gold)]" /></div> :
                    files.length === 0 ? <ExecEmpty text="Archive is empty" /> :
                        files.map(f => <ExecFileRow key={f.id} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><ExecButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></ExecButton><ExecButton onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></ExecButton></>} />)}
            </ExecCard>
        </ExecLayout>
    );
}
