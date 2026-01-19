import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton, MidnightFileRow, MidnightEmpty } from '@/components/midnight/MidnightComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function MidnightTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await filesApi.getFiles({ trash: true });
            setFiles(res.data?.data || []);
        } catch (error) {
            console.error('Failed to load trash:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    const handleRestore = async (fileId: string) => {
        await filesApi.restoreFile(fileId);
        loadFiles();
    };

    const handlePermanentDelete = async (fileId: string) => {
        if (!confirm('Permanently delete this file?')) return;
        await filesApi.deleteFile(fileId);
        loadFiles();
    };

    const handleEmptyTrash = async () => {
        if (!confirm('Permanently delete all files in trash?')) return;
        await filesApi.emptyTrash();
        loadFiles();
    };

    return (
        <MidnightLayout>
            <MidnightHeader
                title="Trash"
                subtitle={`${files.length} files in trash`}
                actions={files.length > 0 && <MidnightButton variant="danger" onClick={handleEmptyTrash}><Trash2 className="w-4 h-4 mr-2" /> Empty Trash</MidnightButton>}
            />

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div>
            ) : files.length === 0 ? (
                <MidnightEmpty icon={<Trash2 className="w-8 h-8" />} text="Trash is empty" />
            ) : (
                <MidnightCard className="!p-0 overflow-hidden">
                    {files.map((file) => (
                        <MidnightFileRow
                            key={file.id}
                            icon={<FileText className="w-5 h-5" />}
                            name={file.originalName || file.name}
                            meta={`${formatFileSize(file.size)} • Deleted ${formatDate(file.updatedAt)}`}
                            actions={
                                <>
                                    <MidnightButton variant="ghost" onClick={() => handleRestore(file.id)}><RotateCcw className="w-4 h-4" /></MidnightButton>
                                    <MidnightButton variant="danger" onClick={() => handlePermanentDelete(file.id)}><Trash2 className="w-4 h-4" /></MidnightButton>
                                </>
                            }
                        />
                    ))}
                </MidnightCard>
            )}
        </MidnightLayout>
    );
}
