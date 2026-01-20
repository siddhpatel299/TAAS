import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamGauge, SteamButton, SteamTitle, SteamEmpty, SteamFileRow, SteamBadge, SteamDivider } from '@/components/steam/SteamComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function SteamDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(statsRes.data?.data); setRecentFiles(filesRes.data?.data || []); } catch (error) { console.error('Failed to load:', error); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    if (loading) { return <SteamLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--steam-brass)]" /></div></SteamLayout>; }

    return (
        <SteamLayout>
            <SteamTitle>Control Panel</SteamTitle>

            <div className="flex justify-center gap-8 mb-12">
                <SteamGauge value={stats?.totalFiles || 0} label="Files" />
                <SteamGauge value={stats?.totalFolders || 0} label="Folders" />
                <SteamGauge value={formatFileSize(stats?.totalSize || 0)} label="Storage" />
                <SteamGauge value={stats?.starredFiles || 0} label="Starred" />
            </div>

            <SteamDivider />

            <div className="steam-grid steam-grid-3 mb-8">
                <Link to="/files"><SteamPanel title="Upload Chamber"><div className="text-center py-4"><Upload className="w-10 h-10 mx-auto mb-3 text-[var(--steam-brass)]" /><p className="text-sm text-[var(--steam-text-muted)]">Transmit files to the archive</p></div></SteamPanel></Link>
                <Link to="/telegram"><SteamPanel title="Telegraph Import"><div className="text-center py-4"><Inbox className="w-10 h-10 mx-auto mb-3 text-[var(--steam-copper)]" /><p className="text-sm text-[var(--steam-text-muted)]">Import from Telegram channels</p></div></SteamPanel></Link>
                <Link to="/plugins/job-tracker"><SteamPanel title="Employment Engine"><div className="text-center py-4"><Briefcase className="w-10 h-10 mx-auto mb-3 text-[var(--steam-bronze)]" /><p className="text-sm text-[var(--steam-text-muted)]">Track your applications</p></div></SteamPanel></Link>
            </div>

            <SteamPanel title="Recent Transmissions">
                {recentFiles.length === 0 ? <SteamEmpty text="No files in the archive" /> : (
                    <>
                        {recentFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <SteamFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`} actions={file.isStarred && <SteamBadge color="brass">★</SteamBadge>} />; })}
                        <div className="mt-6 text-center"><Link to="/files"><SteamButton variant="primary">View Complete Archive →</SteamButton></Link></div>
                    </>
                )}
            </SteamPanel>
        </SteamLayout>
    );
}
