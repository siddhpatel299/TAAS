import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, ArrowRight } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenStat, ZenButton, ZenTitle, ZenEmpty, ZenFileRow, ZenSection, ZenDivider } from '@/components/zen/ZenComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function ZenDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(statsRes.data?.data); setRecentFiles(filesRes.data?.data || []); } catch (error) { console.error('Failed to load:', error); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    if (loading) { return <ZenLayout><div className="flex items-center justify-center" style={{ minHeight: '50vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div></ZenLayout>; }

    return (
        <ZenLayout>
            <ZenTitle subtitle="Your personal space">Welcome</ZenTitle>

            <ZenSection>
                <div className="zen-grid zen-grid-4">
                    <ZenStat value={stats?.totalFiles || 0} label="Files" />
                    <ZenStat value={stats?.totalFolders || 0} label="Folders" />
                    <ZenStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" />
                    <ZenStat value={stats?.starredFiles || 0} label="Starred" />
                </div>
            </ZenSection>

            <ZenDivider />

            <ZenSection title="Quick Actions">
                <div className="zen-grid zen-grid-3">
                    <Link to="/files"><ZenCard><p style={{ marginBottom: '8px' }}>Upload Files</p><p className="text-sm text-[var(--zen-text-light)]">Add to your collection</p></ZenCard></Link>
                    <Link to="/telegram"><ZenCard><p style={{ marginBottom: '8px' }}>Telegram</p><p className="text-sm text-[var(--zen-text-light)]">Import from channels</p></ZenCard></Link>
                    <Link to="/plugins/job-tracker"><ZenCard><p style={{ marginBottom: '8px' }}>Job Tracker</p><p className="text-sm text-[var(--zen-text-light)]">Manage applications</p></ZenCard></Link>
                </div>
            </ZenSection>

            <ZenDivider />

            <ZenSection title="Recent">
                <ZenCard>
                    {recentFiles.length === 0 ? <ZenEmpty text="No files yet" /> : (
                        <>
                            {recentFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <ZenFileRow key={file.id} icon={<Icon className="w-4 h-4" />} name={file.originalName || file.name} meta={`${formatFileSize(file.size)} · ${formatDate(file.createdAt)}`} />; })}
                            <div style={{ marginTop: '32px' }}><Link to="/files"><ZenButton>View All Files <ArrowRight className="w-3 h-3" /></ZenButton></Link></div>
                        </>
                    )}
                </ZenCard>
            </ZenSection>
        </ZenLayout>
    );
}
