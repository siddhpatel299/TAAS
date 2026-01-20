import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraStat, AuroraButton, AuroraTitle, AuroraEmpty, AuroraFileRow, AuroraBadge } from '@/components/aurora/AuroraComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function AuroraDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(statsRes.data?.data); setRecentFiles(filesRes.data?.data || []); } catch (error) { console.error('Failed to load:', error); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    if (loading) { return <AuroraLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--aurora-gradient-1)]" /></div></AuroraLayout>; }

    return (
        <AuroraLayout>
            <AuroraTitle subtitle="Welcome to your personal cloud">Dashboard</AuroraTitle>

            <div className="aurora-grid aurora-grid-4 mb-8">
                <AuroraStat value={stats?.totalFiles || 0} label="Files" />
                <AuroraStat value={stats?.totalFolders || 0} label="Folders" />
                <AuroraStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" />
                <AuroraStat value={stats?.starredFiles || 0} label="Starred" />
            </div>

            <div className="aurora-grid aurora-grid-3 mb-8">
                <Link to="/files"><AuroraCard glow><div className="text-center py-4"><Upload className="w-10 h-10 mx-auto mb-3 text-[var(--aurora-gradient-1)]" /><p className="font-medium">Upload Files</p><p className="text-sm text-[var(--aurora-text-muted)]">Add to your cloud</p></div></AuroraCard></Link>
                <Link to="/telegram"><AuroraCard glow><div className="text-center py-4"><Inbox className="w-10 h-10 mx-auto mb-3 text-[var(--aurora-teal)]" /><p className="font-medium">Telegram Import</p><p className="text-sm text-[var(--aurora-text-muted)]">From channels</p></div></AuroraCard></Link>
                <Link to="/plugins/job-tracker"><AuroraCard glow><div className="text-center py-4"><Briefcase className="w-10 h-10 mx-auto mb-3 text-[var(--aurora-purple)]" /><p className="font-medium">Job Tracker</p><p className="text-sm text-[var(--aurora-text-muted)]">Track applications</p></div></AuroraCard></Link>
            </div>

            <AuroraCard>
                <h3 className="font-semibold mb-4">Recent Files</h3>
                {recentFiles.length === 0 ? <AuroraEmpty text="No files yet" /> : (
                    <>
                        {recentFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <AuroraFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`} actions={file.isStarred && <AuroraBadge color="purple">★</AuroraBadge>} />; })}
                        <div className="mt-6 text-center"><Link to="/files"><AuroraButton variant="primary">View All Files →</AuroraButton></Link></div>
                    </>
                )}
            </AuroraCard>
        </AuroraLayout>
    );
}
