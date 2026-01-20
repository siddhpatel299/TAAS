import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuGauge, SkeuButton, SkeuTitle, SkeuEmpty, SkeuFileRow, SkeuBadge, SkeuBattery } from '@/components/skeu/SkeuComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function SkeuDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(statsRes.data?.data); setRecentFiles(filesRes.data?.data || []); } catch (error) { console.error('Failed to load:', error); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    if (loading) { return <SkeuLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--skeu-led-blue)]" /></div></SkeuLayout>; }

    // Calculate storage percentage (assuming 10GB limit for demo)
    const storagePercentage = Math.min(100, Math.round((stats?.totalSize || 0) / (10 * 1024 * 1024 * 1024) * 100));

    return (
        <SkeuLayout>
            <SkeuTitle subtitle="System status and metrics">Control Panel</SkeuTitle>

            <div className="skeu-grid skeu-grid-4 mb-8">
                <SkeuCard className="flex items-center justify-center py-6">
                    <SkeuGauge value={stats?.totalFiles || 0} label="Files" color="blue" />
                </SkeuCard>
                <SkeuCard className="flex items-center justify-center py-6">
                    <SkeuGauge value={stats?.totalFolders || 0} label="Folders" color="purple" />
                </SkeuCard>
                <SkeuCard className="flex items-center justify-center py-6">
                    <SkeuGauge value={stats?.starredFiles || 0} label="Starred" color="orange" />
                </SkeuCard>
                <SkeuCard>
                    <p className="text-sm text-[var(--skeu-text-muted)] mb-3">Storage Used</p>
                    <SkeuBattery value={storagePercentage} />
                    <p className="text-sm text-[var(--skeu-text-muted)] mt-3">{formatFileSize(stats?.totalSize || 0)} of 10 GB</p>
                </SkeuCard>
            </div>

            <div className="skeu-grid skeu-grid-3 mb-8">
                <Link to="/files"><SkeuCard><div className="flex items-center gap-4"><Upload className="w-8 h-8 text-[var(--skeu-led-blue)]" /><div><p className="font-semibold">Upload Files</p><p className="text-sm text-[var(--skeu-text-muted)]">Add to storage</p></div></div></SkeuCard></Link>
                <Link to="/telegram"><SkeuCard><div className="flex items-center gap-4"><Inbox className="w-8 h-8 text-[var(--skeu-led-green)]" /><div><p className="font-semibold">Telegram Import</p><p className="text-sm text-[var(--skeu-text-muted)]">From channels</p></div></div></SkeuCard></Link>
                <Link to="/plugins/job-tracker"><SkeuCard><div className="flex items-center gap-4"><Briefcase className="w-8 h-8 text-[var(--skeu-led-purple)]" /><div><p className="font-semibold">Job Tracker</p><p className="text-sm text-[var(--skeu-text-muted)]">Applications</p></div></div></SkeuCard></Link>
            </div>

            <SkeuCard>
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                {recentFiles.length === 0 ? <SkeuEmpty text="No files uploaded yet" /> : (
                    <>
                        {recentFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <SkeuFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`} actions={file.isStarred && <SkeuBadge color="orange">★</SkeuBadge>} />; })}
                        <div className="mt-6"><Link to="/files"><SkeuButton variant="primary">View All Files →</SkeuButton></Link></div>
                    </>
                )}
            </SkeuCard>
        </SkeuLayout>
    );
}
