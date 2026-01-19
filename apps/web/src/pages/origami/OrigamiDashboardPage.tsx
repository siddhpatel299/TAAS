import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, FileText, Upload, Image, Video, Music, Loader2 } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiStat, OrigamiFileRow, OrigamiActionCard, OrigamiBadge } from '@/components/origami/OrigamiComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function OrigamiDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, filesRes] = await Promise.all([
                filesApi.getStats(),
                filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
            ]);
            setStats(statsRes.data?.data);
            setRecentFiles(filesRes.data?.data || []);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const quickActions = [
        { icon: Upload, title: 'Upload Files', description: 'Add new files', path: '/files' },
        { icon: FolderOpen, title: 'Browse Files', description: 'View all files', path: '/files' },
    ];

    if (loading) {
        return (
            <OrigamiLayout>
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--origami-terracotta)] animate-spin" /></div>
            </OrigamiLayout>
        );
    }

    return (
        <OrigamiLayout>
            <OrigamiHeader title="Dashboard" subtitle="Welcome back" />

            {/* Stats */}
            <div className="origami-grid origami-grid-4 mb-8">
                <OrigamiCard folded>
                    <OrigamiStat value={stats?.totalFiles || 0} label="Total Files" />
                </OrigamiCard>
                <OrigamiCard>
                    <OrigamiStat value={stats?.totalFolders || 0} label="Folders" />
                </OrigamiCard>
                <OrigamiCard>
                    <OrigamiStat value={formatFileSize(stats?.totalSize || 0)} label="Storage Used" />
                </OrigamiCard>
                <OrigamiCard>
                    <OrigamiStat value={stats?.starredFiles || 0} label="Starred" />
                </OrigamiCard>
            </div>

            <div className="origami-grid origami-grid-3 gap-8">
                {/* Quick Actions */}
                <div>
                    <h2 className="text-lg font-medium mb-4 text-[var(--origami-text)]">Quick Actions</h2>
                    <div className="space-y-3">
                        {quickActions.map((action) => (
                            <Link key={action.path} to={action.path}>
                                <OrigamiActionCard icon={<action.icon className="w-5 h-5" />} title={action.title} description={action.description} />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Files */}
                <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-[var(--origami-text)]">Recent Files</h2>
                        <Link to="/files" className="text-sm text-[var(--origami-terracotta)] hover:underline">View All</Link>
                    </div>
                    <OrigamiCard className="!p-0 overflow-hidden">
                        {recentFiles.length === 0 ? (
                            <div className="p-8 text-center text-[var(--origami-text-dim)]">No files yet</div>
                        ) : (
                            recentFiles.map((file) => {
                                const Icon = getFileIcon(file.mimeType);
                                return (
                                    <OrigamiFileRow
                                        key={file.id}
                                        icon={<Icon className="w-5 h-5" />}
                                        name={file.originalName || file.name}
                                        meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`}
                                        actions={file.isStarred && <OrigamiBadge variant="terracotta">Starred</OrigamiBadge>}
                                    />
                                );
                            })
                        )}
                    </OrigamiCard>
                </div>
            </div>
        </OrigamiLayout>
    );
}
