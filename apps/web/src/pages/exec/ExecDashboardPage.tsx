import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecStat, ExecButton, ExecTitle, ExecEmpty, ExecFileRow, ExecBadge, ExecDivider } from '@/components/exec/ExecComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function ExecDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(statsRes.data?.data); setRecentFiles(filesRes.data?.data || []); } catch (error) { console.error('Failed to load:', error); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    if (loading) { return <ExecLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--exec-gold)]" /></div></ExecLayout>; }

    return (
        <ExecLayout>
            <ExecTitle subtitle="Your personal command center">Executive Summary</ExecTitle>

            <div className="exec-grid exec-grid-4 mb-10">
                <ExecCard><ExecStat value={stats?.totalFiles || 0} label="Total Assets" /></ExecCard>
                <ExecCard><ExecStat value={stats?.totalFolders || 0} label="Portfolios" /></ExecCard>
                <ExecCard><ExecStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" /></ExecCard>
                <ExecCard><ExecStat value={stats?.starredFiles || 0} label="Priority Items" /></ExecCard>
            </div>

            <div className="exec-grid exec-grid-3 mb-10">
                <Link to="/files"><ExecCard><div className="flex items-center gap-4"><Upload className="w-8 h-8 text-[var(--exec-gold)]" /><div><p className="text-lg">Upload Assets</p><p className="text-sm text-[var(--exec-text-muted)]">Add to your portfolio</p></div></div></ExecCard></Link>
                <Link to="/telegram"><ExecCard><div className="flex items-center gap-4"><Inbox className="w-8 h-8 text-[var(--exec-gold)]" /><div><p className="text-lg">Telegram Import</p><p className="text-sm text-[var(--exec-text-muted)]">Channel acquisitions</p></div></div></ExecCard></Link>
                <Link to="/plugins/job-tracker"><ExecCard><div className="flex items-center gap-4"><Briefcase className="w-8 h-8 text-[var(--exec-gold)]" /><div><p className="text-lg">Career Tracker</p><p className="text-sm text-[var(--exec-text-muted)]">Application portfolio</p></div></div></ExecCard></Link>
            </div>

            <ExecCard>
                <h3 className="text-[var(--exec-gold)] uppercase tracking-wider text-sm font-semibold mb-6" style={{ fontFamily: 'var(--font-exec-heading)' }}>Recent Activity</h3>
                {recentFiles.length === 0 ? <ExecEmpty text="No assets in your portfolio yet" /> : (
                    <>
                        {recentFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <ExecFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`} actions={file.isStarred && <ExecBadge>Priority</ExecBadge>} />; })}
                        <ExecDivider />
                        <div className="text-center"><Link to="/files"><ExecButton variant="primary">View All Assets</ExecButton></Link></div>
                    </>
                )}
            </ExecCard>
        </ExecLayout>
    );
}
