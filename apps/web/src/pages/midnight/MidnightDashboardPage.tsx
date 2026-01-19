import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Upload, Star, Trash2, FileText, Image, Video, Music, ArrowRight, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightStat, MidnightButton, MidnightFileRow, MidnightBadge } from '@/components/midnight/MidnightComponents';
import { filesApi, api } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

interface StorageStats {
    totalFiles: number;
    totalSize: number;
    starredCount: number;
    trashedCount: number;
    categories: { category: string; count: number; size: number }[];
}

export function MidnightDashboardPage() {
    const [stats, setStats] = useState<StorageStats | null>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, filesRes] = await Promise.all([
                api.get('/storage/stats'),
                filesApi.getFiles({ sortBy: 'createdAt', sortOrder: 'desc' }),
            ]);
            setStats(statsRes.data?.data);
            setRecentFiles((filesRes.data?.data || []).slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const quickActions = [
        { icon: Upload, label: 'Upload Files', path: '/files', color: 'var(--midnight-gold)' },
        { icon: Star, label: 'Starred', path: '/starred', color: 'var(--midnight-gold)' },
        { icon: FolderOpen, label: 'Browse Files', path: '/files', color: 'var(--midnight-purple)' },
        { icon: Trash2, label: 'Trash', path: '/trash', color: 'var(--midnight-error)' },
    ];

    if (loading) {
        return (
            <MidnightLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" />
                </div>
            </MidnightLayout>
        );
    }

    return (
        <MidnightLayout>
            <MidnightHeader
                title="Dashboard"
                subtitle="Welcome back. Here's your storage overview."
            />

            {/* Stats */}
            <div className="midnight-grid midnight-grid-4 mb-8">
                <MidnightCard gold className="midnight-glow-pulse">
                    <MidnightStat value={stats?.totalFiles || 0} label="Total Files" />
                </MidnightCard>
                <MidnightCard>
                    <MidnightStat value={formatFileSize(stats?.totalSize || 0)} label="Storage Used" />
                </MidnightCard>
                <MidnightCard>
                    <MidnightStat value={stats?.starredCount || 0} label="Starred" />
                </MidnightCard>
                <MidnightCard>
                    <MidnightStat value={stats?.trashedCount || 0} label="In Trash" />
                </MidnightCard>
            </div>

            <div className="midnight-grid midnight-grid-3 gap-8">
                {/* Quick Actions */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 text-[var(--midnight-text)]">Quick Actions</h2>
                    <div className="space-y-3">
                        {quickActions.map((action) => (
                            <Link key={action.path + action.label} to={action.path}>
                                <MidnightCard className="flex items-center gap-4 !p-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${action.color}20`, color: action.color }}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{action.label}</span>
                                    <ArrowRight className="w-4 h-4 ml-auto text-[var(--midnight-text-dim)]" />
                                </MidnightCard>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Files */}
                <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[var(--midnight-text)]">Recent Files</h2>
                        <Link to="/files">
                            <MidnightButton variant="ghost">View All <ArrowRight className="w-4 h-4 ml-1" /></MidnightButton>
                        </Link>
                    </div>
                    <MidnightCard className="!p-0 overflow-hidden">
                        {recentFiles.length === 0 ? (
                            <div className="p-8 text-center text-[var(--midnight-text-dim)]">No files yet</div>
                        ) : (
                            recentFiles.map((file) => {
                                const Icon = getFileIcon(file.mimeType);
                                return (
                                    <MidnightFileRow
                                        key={file.id}
                                        icon={<Icon className="w-5 h-5" />}
                                        name={file.originalName || file.name}
                                        meta={formatFileSize(file.size)}
                                        actions={file.isStarred && <MidnightBadge variant="gold">★</MidnightBadge>}
                                    />
                                );
                            })
                        )}
                    </MidnightCard>
                </div>
            </div>

            {/* Categories */}
            {stats?.categories && stats.categories.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4 text-[var(--midnight-text)]">By Category</h2>
                    <div className="midnight-grid midnight-grid-4">
                        {stats.categories.map((cat) => (
                            <MidnightCard key={cat.category}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium capitalize">{cat.category}</span>
                                    <MidnightBadge variant="gold">{cat.count}</MidnightBadge>
                                </div>
                                <p className="text-xs text-[var(--midnight-text-dim)]">{formatFileSize(cat.size)}</p>
                            </MidnightCard>
                        ))}
                    </div>
                </div>
            )}
        </MidnightLayout>
    );
}
