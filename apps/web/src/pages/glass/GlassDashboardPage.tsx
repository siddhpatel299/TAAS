import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassStat, GlassButton, GlassTitle, GlassEmpty, GlassFileRow, GlassBadge } from '@/components/glass/GlassComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function GlassDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' })]);
            setStats(statsRes.data?.data);
            setRecentFiles(filesRes.data?.data || []);
        } catch (error) { console.error('Failed to load:', error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return <GlassLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--glass-accent)]" /></div></GlassLayout>;
    }

    return (
        <GlassLayout>
            <GlassTitle>Dashboard</GlassTitle>

            <div className="glass-grid glass-grid-4 mb-8">
                <GlassStat value={stats?.totalFiles || 0} label="Total Files" />
                <GlassStat value={stats?.totalFolders || 0} label="Folders" />
                <GlassStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" />
                <GlassStat value={stats?.starredFiles || 0} label="Starred" />
            </div>

            <div className="glass-grid glass-grid-3 mb-8">
                <Link to="/files"><GlassCard className="flex items-center gap-4"><Upload className="w-8 h-8 text-[var(--glass-accent)]" /><div><p className="font-semibold text-lg">Upload Files</p><p className="text-sm text-[var(--glass-text-muted)]">Add new files</p></div></GlassCard></Link>
                <Link to="/telegram"><GlassCard className="flex items-center gap-4"><Inbox className="w-8 h-8 text-[var(--glass-accent-pink)]" /><div><p className="font-semibold text-lg">Telegram Import</p><p className="text-sm text-[var(--glass-text-muted)]">Import from chats</p></div></GlassCard></Link>
                <Link to="/plugins/job-tracker"><GlassCard className="flex items-center gap-4"><Briefcase className="w-8 h-8 text-[var(--glass-accent-purple)]" /><div><p className="font-semibold text-lg">Job Tracker</p><p className="text-sm text-[var(--glass-text-muted)]">Track applications</p></div></GlassCard></Link>
            </div>

            <GlassTitle>Recent Files</GlassTitle>
            <GlassCard flat>
                {recentFiles.length === 0 ? (
                    <GlassEmpty text="No files yet. Upload your first file!" />
                ) : (
                    <>
                        {recentFiles.map((file) => {
                            const Icon = getFileIcon(file.mimeType);
                            return (
                                <GlassFileRow
                                    key={file.id}
                                    icon={<Icon className="w-6 h-6" />}
                                    name={file.originalName || file.name}
                                    meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`}
                                    actions={file.isStarred && <GlassBadge color="pink">★</GlassBadge>}
                                />
                            );
                        })}
                        <div className="mt-4 pt-4 border-t border-white/10 text-right">
                            <Link to="/files"><GlassButton variant="primary">View All Files →</GlassButton></Link>
                        </div>
                    </>
                )}
            </GlassCard>
        </GlassLayout>
    );
}
