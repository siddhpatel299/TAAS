import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicButton, ComicEmpty, ComicFileRow, ComicTitle } from '@/components/comic/ComicComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function ComicTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('PERMANENTLY DELETE?!')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('EMPTY EVERYTHING?!')) return; await filesApi.emptyTrash(); load(); };

    return (
        <ComicLayout>
            <div className="flex items-center justify-between mb-6">
                <ComicTitle>Trash!</ComicTitle>
                {files.length > 0 && <ComicButton variant="danger" onClick={empty}><Trash2 className="w-5 h-5" /> KABOOM! Empty All!</ComicButton>}
            </div>
            <ComicPanel title="Deleted Files!">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--comic-blue)]" /></div> :
                    files.length === 0 ? <ComicEmpty text="Trash is empty!" /> :
                        files.map(f => <ComicFileRow key={f.id} icon={<FileText className="w-6 h-6" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><ComicButton variant="success" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></ComicButton><ComicButton variant="danger" onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></ComicButton></>} />)}
            </ComicPanel>
        </ComicLayout>
    );
}
