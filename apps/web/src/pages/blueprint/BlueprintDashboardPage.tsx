import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, FileText, Upload, Image, Video, Music, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintStat, BlueprintFileRow, BlueprintBadge } from '@/components/blueprint/BlueprintComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function BlueprintDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]);
            setStats(statsRes.data?.data);
            setRecentFiles(filesRes.data?.data || []);
        } catch (error) { console.error('Failed to load:', error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return <BlueprintLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div></BlueprintLayout>;
    }

    return (
        <BlueprintLayout>
            <BlueprintHeader title="System Dashboard" subtitle="Overview & Analytics" />

            <div className="blueprint-grid blueprint-grid-4 mb-6">
                <BlueprintCard corners><BlueprintStat value={stats?.totalFiles || 0} label="Total Files" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={stats?.totalFolders || 0} label="Folders" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={stats?.starredFiles || 0} label="Starred" /></BlueprintCard>
            </div>

            <div className="blueprint-grid blueprint-grid-3 gap-6">
                <div>
                    <h2 className="text-xs uppercase tracking-widest text-[var(--blueprint-cyan)] mb-4">Quick Access</h2>
                    <div className="space-y-3">
                        <Link to="/files"><BlueprintCard className="flex items-center gap-4 !p-4 cursor-pointer"><Upload className="w-5 h-5 text-[var(--blueprint-cyan)]" /><span>Upload Files</span></BlueprintCard></Link>
                        <Link to="/files"><BlueprintCard className="flex items-center gap-4 !p-4 cursor-pointer"><FolderOpen className="w-5 h-5 text-[var(--blueprint-cyan)]" /><span>Browse Files</span></BlueprintCard></Link>
                    </div>
                </div>

                <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs uppercase tracking-widest text-[var(--blueprint-cyan)]">Recent Files</h2>
                        <Link to="/files" className="text-xs text-[var(--blueprint-text-dim)] hover:text-[var(--blueprint-cyan)]">VIEW ALL →</Link>
                    </div>
                    <BlueprintCard className="!p-0 overflow-hidden">
                        {recentFiles.length === 0 ? (
                            <div className="p-8 text-center text-[var(--blueprint-text-dim)]">No files</div>
                        ) : (
                            recentFiles.map((file) => {
                                const Icon = getFileIcon(file.mimeType);
                                return <BlueprintFileRow key={file.id} icon={<Icon className="w-4 h-4" />} name={file.originalName || file.name} meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`} actions={file.isStarred && <BlueprintBadge variant="cyan">★</BlueprintBadge>} />;
                            })
                        )}
                    </BlueprintCard>
                </div>
            </div>
        </BlueprintLayout>
    );
}
