import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelEmpty, PixelFileRow, PixelTitle } from '@/components/pixel/PixelComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function PixelTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await filesApi.getFiles({ trash: true }); setFiles(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (id: string) => { await filesApi.restoreFile(id); load(); };
    const deletePerm = async (id: string) => { if (!confirm('PERMANENTLY DELETE?')) return; await filesApi.deleteFile(id, true); load(); };
    const empty = async () => { if (!confirm('EMPTY TRASH BIN?')) return; await filesApi.emptyTrash(); load(); };

    return (
        <PixelLayout>
            <div className="flex items-center justify-between mb-6">
                <PixelTitle subtitle="> DELETED ITEMS">🗑 TRASH</PixelTitle>
                {files.length > 0 && <PixelButton onClick={empty}><Trash2 className="w-4 h-4" /> EMPTY</PixelButton>}
            </div>
            <PixelCard>
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--pixel-cyan)]" /></div> :
                    files.length === 0 ? <PixelEmpty text="TRASH IS EMPTY" /> :
                        files.map(f => <PixelFileRow key={f.id} icon={<FileText className="w-5 h-5" />} name={f.originalName || f.name} meta={`${formatFileSize(f.size)} • ${formatDate(f.updatedAt)}`} actions={<><PixelButton variant="primary" onClick={() => restore(f.id)}><RotateCcw className="w-4 h-4" /></PixelButton><PixelButton onClick={() => deletePerm(f.id)}><Trash2 className="w-4 h-4" /></PixelButton></>} />)}
            </PixelCard>
        </PixelLayout>
    );
}
