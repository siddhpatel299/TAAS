import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveButton, ArchiveEmpty, ArchiveFileRow, ArchiveTitle } from '@/components/archive/ArchiveComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function ArchiveTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('Permanently delete?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('Empty trash?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <ArchiveLayout>
            <div className="flex items-center justify-between mb-8">
                <ArchiveTitle>Deleted Entries</ArchiveTitle>
                {files.length > 0 && <ArchiveButton onClick={empty}><Trash2 className="w-4 h-4" /> Empty Archive</ArchiveButton>}
            </div>
            <ArchiveSection title="Trash" count={files.length}>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--archive-accent)]" /></div> :
                    files.length === 0 ? <ArchiveEmpty title="Trash is empty" text="Deleted files will appear here." /> :
                        files.map((f, i) => <ArchiveFileRow key={f.id} index={i} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} · ${formatDate(f.updatedAt)}`} actions={<><ArchiveButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></ArchiveButton><ArchiveButton onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></ArchiveButton></>} />)}
            </ArchiveSection>
        </ArchiveLayout>
    );
}
