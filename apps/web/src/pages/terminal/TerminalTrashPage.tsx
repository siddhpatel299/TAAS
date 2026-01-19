import { useEffect, useState, useCallback } from 'react';
import { Trash2, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalFileRow, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function TerminalTrashPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTrashed = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await filesApi.getFiles({ trash: true });
            setFiles(response.data?.data || []);
        } catch (error) {
            console.error('Failed to load:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadTrashed(); }, [loadTrashed]);

    const handleRestore = async (fileId: string) => { await filesApi.restoreFile(fileId); loadTrashed(); };
    const handleDelete = async (fileId: string) => {
        if (!confirm('Permanently delete?')) return;
        await filesApi.deleteFile(fileId);
        loadTrashed();
    };
    const handleEmptyTrash = async () => {
        if (!confirm('Empty trash? This cannot be undone.')) return;
        for (const file of files) await filesApi.deleteFile(file.id);
        loadTrashed();
    };

    return (
        <TerminalLayout>
            <TerminalHeader
                title="Trash"
                subtitle={`${files.length} items`}
                actions={files.length > 0 && <TerminalButton variant="danger" onClick={handleEmptyTrash}><Trash2 className="w-3 h-3 mr-1" /> Empty</TerminalButton>}
            />

            {files.length > 0 && (
                <div className="mb-4 p-2 border border-[var(--terminal-amber)] bg-[rgba(255,176,0,0.05)] text-xs text-[var(--terminal-amber)]">
                    ⚠ Files will be permanently deleted after 30 days
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : files.length === 0 ? (
                <TerminalEmpty icon={<Trash2 className="w-full h-full" />} text="Trash is empty" />
            ) : (
                <TerminalPanel>
                    {files.map((file) => (
                        <TerminalFileRow
                            key={file.id}
                            icon={<FileText className="w-4 h-4 opacity-50" />}
                            name={<span className="line-through opacity-60">{file.originalName || file.name}</span> as any}
                            meta={`${formatFileSize(file.size)} • ${formatDate(file.updatedAt)}`}
                            actions={
                                <>
                                    <TerminalButton onClick={() => handleRestore(file.id)}><RotateCcw className="w-3 h-3 mr-1" /> Restore</TerminalButton>
                                    <TerminalButton variant="danger" onClick={() => handleDelete(file.id)}><Trash2 className="w-3 h-3" /></TerminalButton>
                                </>
                            }
                        />
                    ))}
                </TerminalPanel>
            )}
        </TerminalLayout>
    );
}
