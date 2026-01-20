import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenEmpty, ZenFileRow, ZenTitle, ZenSection } from '@/components/zen/ZenComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function ZenTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Delete permanently?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <ZenLayout>
            <div className="flex items-center justify-between" style={{ marginBottom: '64px' }}>
                <ZenTitle subtitle="Deleted items">Trash</ZenTitle>
                {files.length > 0 && <ZenButton onClick={empty}><Trash2 className="w-3 h-3" /> Empty</ZenButton>}
            </div>
            <ZenSection>
                <ZenCard>
                    {loading ? <div className="flex items-center justify-center" style={{ minHeight: '20vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div> :
                        files.length === 0 ? <ZenEmpty text="Trash is empty" /> :
                            files.map(f => <ZenFileRow key={f.id} icon={<FileText className="w-4 h-4" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} · ${formatDate(f.updatedAt)}`} actions={<><ZenButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-3 h-3" /></ZenButton><ZenButton onClick={() => deletePerm(f.id)}><Trash2 className="w-3 h-3" /></ZenButton></>} />)}
                </ZenCard>
            </ZenSection>
        </ZenLayout>
    );
}
