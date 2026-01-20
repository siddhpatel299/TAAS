import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasButton, CanvasEmpty, CanvasFileRow, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function CanvasTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <CanvasLayout>
            <div className="flex items-center justify-between mb-6">
                <CanvasTitle>Trash</CanvasTitle>
                {files.length > 0 && <CanvasButton variant="danger" onClick={empty}><Trash2 className="w-4 h-4" /> Empty Trash</CanvasButton>}
            </div>
            <CanvasWindow title="Deleted Files" icon={<Trash2 className="w-4 h-4" />} zLevel="mid">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--canvas-accent)]" /></div> :
                    files.length === 0 ? <CanvasEmpty text="Trash is empty" icon={<Trash2 className="w-10 h-10" />} /> :
                        files.map(f => <CanvasFileRow key={f.id} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><CanvasButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></CanvasButton><CanvasButton variant="danger" onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></CanvasButton></>} />)}
            </CanvasWindow>
        </CanvasLayout>
    );
}
