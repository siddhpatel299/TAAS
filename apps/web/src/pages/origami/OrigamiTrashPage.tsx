import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiButton, OrigamiFileRow, OrigamiEmpty } from '@/components/origami/OrigamiComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function OrigamiTrashPage() {
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
        <OrigamiLayout>
            <OrigamiHeader
                title="Trash"
                subtitle={`${files.length} files in trash`}
                actions={files.length > 0 && <OrigamiButton variant="danger" onClick={handleEmptyTrash}><Trash2 className="w-4 h-4 mr-2" /> Empty Trash</OrigamiButton>}
            />

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--origami-terracotta)] animate-spin" /></div>
            ) : files.length === 0 ? (
                <OrigamiEmpty icon={<Trash2 className="w-8 h-8" />} text="Trash is empty" />
            ) : (
                <OrigamiCard className="!p-0 overflow-hidden">
                    {files.map((file) => (
                        <OrigamiFileRow
                            key={file.id}
                            icon={<FileText className="w-5 h-5" />}
                            name={file.originalName || file.name}
                            meta={`${formatFileSize(file.size)} • Deleted ${formatDate(file.updatedAt)}`}
                            actions={
                                <>
                                    <OrigamiButton variant="ghost" onClick={() => handleRestore(file.id)}><RotateCcw className="w-4 h-4" /></OrigamiButton>
                                    <OrigamiButton variant="danger" onClick={() => handlePermanentDelete(file.id)}><Trash2 className="w-4 h-4" /></OrigamiButton>
                                </>
                            }
                        />
                    ))}
                </OrigamiCard>
            )}
        </OrigamiLayout>
    );
}
