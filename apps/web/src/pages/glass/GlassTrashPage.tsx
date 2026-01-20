import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassButton, GlassEmpty, GlassFileRow, GlassTitle } from '@/components/glass/GlassComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function GlassTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleRestore = async (id: string) => { await filesApi.restoreFile(id); loadFiles(); };
    const handlePermanentDelete = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); loadFiles(); };
    const handleEmptyTrash = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); loadFiles(); };

    return (
        <GlassLayout>
            <div className="flex items-center justify-between mb-6">
                <GlassTitle>Trash</GlassTitle>
                {files.length > 0 && <GlassButton variant="danger" onClick={handleEmptyTrash}><Trash2 className="w-5 h-5" /> Empty Trash</GlassButton>}
            </div>
            <GlassCard flat>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--glass-accent)]" /></div> :
                    files.length === 0 ? <GlassEmpty text="Trash is empty" icon={<Trash2 className="w-12 h-12" />} /> :
                        files.map((f) => <GlassFileRow key={f.id} icon={<FileText className="w-6 h-6" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><GlassButton variant="primary" onClick={() => handleRestore(f.id)}><RotateCcw className="w-4 h-4" /> Restore</GlassButton><GlassButton variant="danger" onClick={() => handlePermanentDelete(f.id)}><Trash2 className="w-4 h-4" /></GlassButton></>} />)}
            </GlassCard>
        </GlassLayout>
    );
}
