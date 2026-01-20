import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintButton, NewsprintEmpty, NewsprintFileItem } from '@/components/newsprint/NewsprintComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function NewsprintTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleRestore = async (id: string) => { await filesApi.restoreFile(id); loadFiles(); };
    const handlePermanentDelete = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); loadFiles(); };
    const handleEmptyTrash = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); loadFiles(); };

    return (
        <NewsprintLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Trash</h1>
                {files.length > 0 && <NewsprintButton variant="danger" onClick={handleEmptyTrash}><Trash2 className="w-4 h-4 mr-2" /> Empty Trash</NewsprintButton>}
            </div>
            <NewsprintSection title={`${files.length} Items`}>
                {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div> :
                    files.length === 0 ? <NewsprintEmpty text="Trash is empty. Deleted files will appear here." /> :
                        <NewsprintCard className="!p-0">
                            {files.map((f) => <NewsprintFileItem key={f.id} icon={<FileText className="w-4 h-4" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><NewsprintButton onClick={() => handleRestore(f.id)}><RotateCcw className="w-4 h-4" /> Restore</NewsprintButton><NewsprintButton variant="danger" onClick={() => handlePermanentDelete(f.id)}><Trash2 className="w-4 h-4" /></NewsprintButton></>} />)}
                        </NewsprintCard>}
            </NewsprintSection>
        </NewsprintLayout>
    );
}
