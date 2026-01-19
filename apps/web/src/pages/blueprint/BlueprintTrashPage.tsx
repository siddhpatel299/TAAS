import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton, BlueprintFileRow, BlueprintEmpty } from '@/components/blueprint/BlueprintComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function BlueprintTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleRestore = async (id: string) => { await filesApi.restoreFile(id); loadFiles(); };
    const handlePermanentDelete = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); loadFiles(); };
    const handleEmptyTrash = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); loadFiles(); };

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Trash" subtitle={`${files.length} files`} actions={files.length > 0 && <BlueprintButton variant="danger" onClick={handleEmptyTrash}><Trash2 className="w-4 h-4 mr-2" /> Empty</BlueprintButton>} />
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div> :
                files.length === 0 ? <BlueprintEmpty icon={<Trash2 className="w-8 h-8" />} text="Trash is empty" /> :
                    <BlueprintCard className="!p-0 overflow-hidden">
                        {files.map((f) => <BlueprintFileRow key={f.id} icon={<FileText className="w-4 h-4" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><BlueprintButton variant="ghost" onClick={() => handleRestore(f.id)}><RotateCcw className="w-4 h-4" /></BlueprintButton><BlueprintButton variant="danger" onClick={() => handlePermanentDelete(f.id)}><Trash2 className="w-4 h-4" /></BlueprintButton></>} />)}
                    </BlueprintCard>}
        </BlueprintLayout>
    );
}
