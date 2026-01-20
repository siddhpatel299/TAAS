import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperButton, PaperEmpty, PaperFileRow, PaperTitle } from '@/components/paper/PaperComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function PaperTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Delete forever?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <PaperLayout>
            <div className="flex items-center justify-between mb-6">
                <PaperTitle subtitle="stuff you threw away">🗑️ Trash</PaperTitle>
                {files.length > 0 && <PaperButton onClick={empty}><Trash2 className="w-4 h-4" /> Empty Trash</PaperButton>}
            </div>
            <PaperCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--ink-blue)]" /></div> :
                    files.length === 0 ? <PaperEmpty text="trash is empty! ✨" /> :
                        files.map(f => <PaperFileRow key={f.id} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><PaperButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></PaperButton><PaperButton onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></PaperButton></>} />)}
            </PaperCard>
        </PaperLayout>
    );
}
