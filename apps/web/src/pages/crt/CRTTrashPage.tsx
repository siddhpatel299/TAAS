import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTButton, CRTEmpty, CRTFileRow, CRTTitle } from '@/components/crt/CRTComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function CRTTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    const handleRestore = async (id: string) => { await filesApi.restoreFile(id); loadFiles(); };
    const handlePermanentDelete = async (id: string) => { if (!confirm('PERMANENT DELETE?')) return; await filesApi.deleteFile(id, true); loadFiles(); };
    const handleEmptyTrash = async () => { if (!confirm('PURGE ALL?')) return; await filesApi.emptyTrash(); loadFiles(); };

    return (
        <CRTLayout>
            <div className="flex items-center justify-between mb-4">
                <CRTTitle>Recycle Bin</CRTTitle>
                {files.length > 0 && <CRTButton variant="danger" onClick={handleEmptyTrash}><Trash2 className="w-4 h-4" /> [PURGE ALL]</CRTButton>}
            </div>
            <CRTPanel header="Deleted Items">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--crt-green)]" /></div> :
                    files.length === 0 ? <CRTEmpty text="RECYCLE BIN EMPTY" /> :
                        files.map((f) => <CRTFileRow key={f.id} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} | ${formatDate(f.updatedAt)}`} actions={<><CRTButton variant="primary" onClick={() => handleRestore(f.id)}><RotateCcw className="w-4 h-4" /></CRTButton><CRTButton variant="danger" onClick={() => handlePermanentDelete(f.id)}><Trash2 className="w-4 h-4" /></CRTButton></>} />)}
            </CRTPanel>
        </CRTLayout>
    );
}
