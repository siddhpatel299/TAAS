import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, FolderOpen, Inbox } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistStat, BrutalistButton, BrutalistTitle, BrutalistEmpty, BrutalistBadge } from '@/components/brutalist/BrutalistComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function BrutalistDashboardPage() {
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
        return <BrutalistLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin" /></div></BrutalistLayout>;
    }

    return (
        <BrutalistLayout>
            <BrutalistTitle>Dashboard</BrutalistTitle>

            {/* Stats Grid */}
            <div className="brutalist-grid brutalist-grid-4 mb-8">
                <BrutalistStat value={stats?.totalFiles || 0} label="Total Files" inverted />
                <BrutalistStat value={stats?.totalFolders || 0} label="Folders" />
                <BrutalistStat value={formatFileSize(stats?.totalSize || 0)} label="Storage Used" />
                <BrutalistStat value={stats?.starredFiles || 0} label="Starred" />
            </div>

            {/* Quick Actions */}
            <div className="brutalist-grid brutalist-grid-3 mb-8">
                <Link to="/files"><BrutalistCard color="inverted" className="flex items-center gap-4"><Upload className="w-8 h-8" /><div><p className="font-bold text-lg uppercase">Upload Files</p><p className="text-sm opacity-70">Add new files to your storage</p></div></BrutalistCard></Link>
                <Link to="/telegram"><BrutalistCard color="gray" className="flex items-center gap-4"><Inbox className="w-8 h-8" /><div><p className="font-bold text-lg uppercase">Telegram Import</p><p className="text-sm opacity-70">Import from chats</p></div></BrutalistCard></Link>
                <Link to="/plugins/job-tracker"><BrutalistCard color="gray" className="flex items-center gap-4"><Briefcase className="w-8 h-8" /><div><p className="font-bold text-lg uppercase">Job Tracker</p><p className="text-sm opacity-70">Track applications</p></div></BrutalistCard></Link>
            </div>

            {/* Recent Files */}
            <BrutalistTitle>Recent Files</BrutalistTitle>
            {recentFiles.length === 0 ? (
                <BrutalistEmpty text="No files yet. Upload your first file!" icon={<FolderOpen />} />
            ) : (
                <BrutalistCard className="!p-0">
                    {recentFiles.map((file) => {
                        const Icon = getFileIcon(file.mimeType);
                        return (
                            <div key={file.id} className="brutalist-file-row">
                                <Icon className="w-6 h-6" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{file.originalName || file.name}</p>
                                    <p className="text-sm opacity-70">{formatFileSize(file.size)} • {formatDate(file.createdAt)}</p>
                                </div>
                                {file.isStarred && <BrutalistBadge variant="inverted">★</BrutalistBadge>}
                            </div>
                        );
                    })}
                </BrutalistCard>
            )}
            <div className="mt-4 text-right">
                <Link to="/files"><BrutalistButton variant="primary">View All Files →</BrutalistButton></Link>
            </div>
        </BrutalistLayout>
    );
}
