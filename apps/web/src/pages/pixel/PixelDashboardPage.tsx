import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelStat, PixelButton, PixelTitle, PixelEmpty, PixelFileRow, PixelBadge, PixelHealthBar } from '@/components/pixel/PixelComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function PixelDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(statsRes.data?.data); setRecentFiles(filesRes.data?.data || []); } catch (error) { console.error('Failed to load:', error); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    if (loading) { return <PixelLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--pixel-cyan)]" /></div></PixelLayout>; }

    const storageUsed = stats?.totalSize || 0;
    const storageMax = 1024 * 1024 * 1024 * 5; // 5GB

    return (
        <PixelLayout>
            <PixelTitle subtitle="LEVEL 1 - DASHBOARD">PLAYER STATS</PixelTitle>

            <div className="pixel-grid pixel-grid-4 mb-8">
                <PixelCard><PixelStat value={stats?.totalFiles || 0} label="Items" /></PixelCard>
                <PixelCard><PixelStat value={stats?.totalFolders || 0} label="Folders" /></PixelCard>
                <PixelCard><PixelStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" /></PixelCard>
                <PixelCard><PixelStat value={stats?.starredFiles || 0} label="Starred" /></PixelCard>
            </div>

            <PixelCard className="mb-8">
                <p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.5rem', marginBottom: '12px' }}>STORAGE HP</p>
                <PixelHealthBar value={storageUsed} max={storageMax} />
                <p className="text-sm mt-2 text-[var(--pixel-text-dim)]">{formatFileSize(storageUsed)} / {formatFileSize(storageMax)}</p>
            </PixelCard>

            <div className="pixel-grid pixel-grid-3 mb-8">
                <Link to="/files"><PixelCard><div className="flex items-center gap-4"><Upload className="w-8 h-8 text-[var(--pixel-green)]" /><div><p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.5rem' }}>UPLOAD</p><p className="text-sm text-[var(--pixel-text-dim)]">Add items</p></div></div></PixelCard></Link>
                <Link to="/telegram"><PixelCard><div className="flex items-center gap-4"><Inbox className="w-8 h-8 text-[var(--pixel-blue)]" /><div><p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.5rem' }}>TELEGRAM</p><p className="text-sm text-[var(--pixel-text-dim)]">Import</p></div></div></PixelCard></Link>
                <Link to="/plugins/job-tracker"><PixelCard><div className="flex items-center gap-4"><Briefcase className="w-8 h-8 text-[var(--pixel-yellow)]" /><div><p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.5rem' }}>JOB HUNT</p><p className="text-sm text-[var(--pixel-text-dim)]">Track apps</p></div></div></PixelCard></Link>
            </div>

            <PixelCard>
                <h3 style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.5rem', marginBottom: '16px', color: 'var(--pixel-cyan)' }}>RECENT LOOT</h3>
                {recentFiles.length === 0 ? <PixelEmpty text="No items in inventory" /> : (
                    <>
                        {recentFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <PixelFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`} actions={file.isStarred && <PixelBadge color="yellow">★</PixelBadge>} />; })}
                        <div className="mt-6"><Link to="/files"><PixelButton variant="primary">VIEW INVENTORY →</PixelButton></Link></div>
                    </>
                )}
            </PixelCard>
        </PixelLayout>
    );
}
