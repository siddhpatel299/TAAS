import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoButton, DecoEmpty, DecoFileRow, DecoTitle } from '@/components/artdeco/ArtDecoComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function ArtDecoTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <ArtDecoLayout>
            <div className="flex items-center justify-between mb-6">
                <DecoTitle>Trash</DecoTitle>
                {files.length > 0 && <DecoButton variant="danger" onClick={empty}><Trash2 className="w-5 h-5" /> Empty Trash</DecoButton>}
            </div>
            <DecoCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--deco-gold)]" /></div> :
                    files.length === 0 ? <DecoEmpty text="Trash is empty" /> :
                        files.map(f => <DecoFileRow key={f.id} icon={<FileText className="w-6 h-6" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><DecoButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></DecoButton><DecoButton variant="danger" onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></DecoButton></>} />)}
            </DecoCard>
        </ArtDecoLayout>
    );
}
