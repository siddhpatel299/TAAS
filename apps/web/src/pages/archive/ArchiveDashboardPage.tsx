import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveStat, ArchiveButton, ArchiveCard, ArchiveFileRow, ArchiveBadge, ArchiveBigNumber, ArchiveHeadline, ArchiveSubhead } from '@/components/archive/ArchiveComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function ArchiveDashboardPage() {
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
        return <ArchiveLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[var(--archive-accent)]" /></div></ArchiveLayout>;
    }

    return (
        <ArchiveLayout>
            {/* Big background number */}
            <ArchiveBigNumber value={stats?.totalFiles || 0} />

            {/* Hero Section */}
            <ArchiveSection className="mb-16">
                <ArchiveHeadline>Your Digital Archive</ArchiveHeadline>
                <ArchiveSubhead>A curated collection of {stats?.totalFiles || 0} files across {stats?.totalFolders || 0} folders, totaling {formatFileSize(stats?.totalSize || 0)} of storage.</ArchiveSubhead>
            </ArchiveSection>

            {/* Stats in 3 columns */}
            <ArchiveSection title="Overview" className="mb-16">
                <div className="archive-columns archive-columns-4">
                    <ArchiveStat value={stats?.totalFiles || 0} label="Total Files" />
                    <ArchiveStat value={stats?.totalFolders || 0} label="Folders" />
                    <ArchiveStat value={formatFileSize(stats?.totalSize || 0)} label="Storage Used" />
                    <ArchiveStat value={stats?.starredFiles || 0} label="Starred" />
                </div>
            </ArchiveSection>

            {/* Quick Actions */}
            <ArchiveSection title="Quick Actions" className="mb-16">
                <div className="archive-columns archive-columns-3">
                    <Link to="/files"><ArchiveCard><p className="font-medium mb-2">Upload Files</p><p className="text-[var(--archive-text-muted)] text-sm">Add new files to your archive</p></ArchiveCard></Link>
                    <Link to="/telegram"><ArchiveCard><p className="font-medium mb-2">Telegram Import</p><p className="text-[var(--archive-text-muted)] text-sm">Import media from channels</p></ArchiveCard></Link>
                    <Link to="/plugins/job-tracker"><ArchiveCard><p className="font-medium mb-2">Job Tracker</p><p className="text-[var(--archive-text-muted)] text-sm">Track your applications</p></ArchiveCard></Link>
                </div>
            </ArchiveSection>

            {/* Recent Files Index */}
            <ArchiveSection title="Recent Entries" count={recentFiles.length}>
                {recentFiles.length === 0 ? (
                    <p className="text-[var(--archive-text-muted)]">No files in the archive yet.</p>
                ) : (
                    <>
                        {recentFiles.map((file, i) => {
                            const Icon = getFileIcon(file.mimeType);
                            return (
                                <ArchiveFileRow
                                    key={file.id}
                                    index={i}
                                    icon={<Icon className="w-5 h-5" />}
                                    name={file.originalName || file.name}
                                    meta={`${formatFileSize(file.size)} · ${formatDate(file.createdAt)}`}
                                    actions={file.isStarred && <ArchiveBadge variant="accent">★</ArchiveBadge>}
                                />
                            );
                        })}
                        <div className="mt-8 text-center">
                            <Link to="/files"><ArchiveButton variant="primary">View Complete Index →</ArchiveButton></Link>
                        </div>
                    </>
                )}
            </ArchiveSection>
        </ArchiveLayout>
    );
}
