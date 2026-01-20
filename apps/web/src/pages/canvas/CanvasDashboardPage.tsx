import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox, LayoutGrid, HardDrive, Star } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasStat, CanvasButton, CanvasEmpty, CanvasFileRow, CanvasBadge, CanvasCard } from '@/components/canvas/CanvasComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function CanvasDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]);
            setStats(statsRes.data?.data);
            setRecentFiles(filesRes.data?.data || []);
        } catch (error) { console.error('Failed to load:', error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return <CanvasLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--canvas-accent)]" /></div></CanvasLayout>;
    }

    return (
        <CanvasLayout>
            {/* Stats Windows - floating at different depths */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <CanvasWindow title="Files" icon={<FileText className="w-4 h-4" />} zLevel="mid">
                    <CanvasStat value={stats?.totalFiles || 0} label="Total" />
                </CanvasWindow>
                <CanvasWindow title="Folders" icon={<LayoutGrid className="w-4 h-4" />} zLevel="far">
                    <CanvasStat value={stats?.totalFolders || 0} label="Total" />
                </CanvasWindow>
                <CanvasWindow title="Storage" icon={<HardDrive className="w-4 h-4" />} zLevel="mid">
                    <CanvasStat value={formatFileSize(stats?.totalSize || 0)} label="Used" />
                </CanvasWindow>
                <CanvasWindow title="Starred" icon={<Star className="w-4 h-4" />} zLevel="close">
                    <CanvasStat value={stats?.starredFiles || 0} label="Items" />
                </CanvasWindow>
            </div>

            {/* Quick Actions - floating cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <Link to="/files">
                    <CanvasCard className="flex items-center gap-4 hover:scale-105 transition-transform">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--canvas-accent)] to-[var(--canvas-accent-2)] flex items-center justify-center">
                            <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold">Upload Files</p>
                            <p className="text-sm text-[var(--canvas-text-muted)]">Add new files to storage</p>
                        </div>
                    </CanvasCard>
                </Link>
                <Link to="/telegram">
                    <CanvasCard className="flex items-center gap-4 hover:scale-105 transition-transform">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--canvas-accent-2)] to-[var(--canvas-accent-3)] flex items-center justify-center">
                            <Inbox className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold">Telegram Import</p>
                            <p className="text-sm text-[var(--canvas-text-muted)]">Import from chats</p>
                        </div>
                    </CanvasCard>
                </Link>
                <Link to="/plugins/job-tracker">
                    <CanvasCard className="flex items-center gap-4 hover:scale-105 transition-transform">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--canvas-accent-3)] to-[var(--canvas-accent)] flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold">Job Tracker</p>
                            <p className="text-sm text-[var(--canvas-text-muted)]">Track applications</p>
                        </div>
                    </CanvasCard>
                </Link>
            </div>

            {/* Recent Files Window */}
            <CanvasWindow title="Recent Files" icon={<FileText className="w-4 h-4" />} zLevel="mid" className="max-w-3xl">
                {recentFiles.length === 0 ? (
                    <CanvasEmpty text="No files yet. Upload your first file!" />
                ) : (
                    <>
                        {recentFiles.map((file) => {
                            const Icon = getFileIcon(file.mimeType);
                            return (
                                <CanvasFileRow
                                    key={file.id}
                                    icon={<Icon className="w-5 h-5" />}
                                    name={file.originalName || file.name}
                                    meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`}
                                    actions={file.isStarred && <CanvasBadge color="pink">★</CanvasBadge>}
                                />
                            );
                        })}
                        <div className="mt-4 pt-4 border-t border-[var(--canvas-border)]">
                            <Link to="/files"><CanvasButton variant="primary" className="w-full">View All Files →</CanvasButton></Link>
                        </div>
                    </>
                )}
            </CanvasWindow>
        </CanvasLayout>
    );
}
