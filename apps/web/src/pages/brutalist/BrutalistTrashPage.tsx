import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistButton, BrutalistEmpty, BrutalistFileRow, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function BrutalistTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleRestore = async (id: string) => { await filesApi.restoreFile(id); loadFiles(); };
    const handlePermanentDelete = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); loadFiles(); };
    const handleEmptyTrash = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); loadFiles(); };

    return (
        <BrutalistLayout>
            <div className="flex items-center justify-between mb-6">
                <BrutalistTitle>Trash</BrutalistTitle>
                {files.length > 0 && <BrutalistButton color="red" onClick={handleEmptyTrash}><Trash2 className="w-5 h-5" /> Empty Trash</BrutalistButton>}
            </div>
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin" /></div> :
                files.length === 0 ? <BrutalistEmpty text="Trash is empty" icon={<Trash2 />} /> :
                    <BrutalistCard className="!p-0">
                        {files.map((f) => <BrutalistFileRow key={f.id} icon={<FileText className="w-6 h-6" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><BrutalistButton color="green" onClick={() => handleRestore(f.id)}><RotateCcw className="w-4 h-4" /> Restore</BrutalistButton><BrutalistButton color="red" onClick={() => handlePermanentDelete(f.id)}><Trash2 className="w-4 h-4" /></BrutalistButton></>} />)}
                    </BrutalistCard>}
        </BrutalistLayout>
    );
}
