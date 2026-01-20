import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicStat, ComicButton, ComicTitle, ComicEmpty, ComicFileRow, ComicBadge, ComicBurst } from '@/components/comic/ComicComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function ComicDashboardPage() {
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
        return <ComicLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--comic-blue)]" /></div></ComicLayout>;
    }

    return (
        <ComicLayout>
            <ComicTitle>Dashboard!</ComicTitle>

            <div className="comic-grid comic-grid-4 mb-8">
                <ComicStat value={stats?.totalFiles || 0} label="Files" />
                <ComicStat value={stats?.totalFolders || 0} label="Folders" />
                <ComicStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" />
                <ComicStat value={stats?.starredFiles || 0} label="Starred" />
            </div>

            <div className="comic-grid comic-grid-3 mb-8">
                <Link to="/files"><ComicPanel title="Upload!"><div className="text-center py-4"><Upload className="w-12 h-12 mx-auto mb-3 text-[var(--comic-blue)]" /><ComicBurst>Add Files!</ComicBurst></div></ComicPanel></Link>
                <Link to="/telegram"><ComicPanel title="Telegram!"><div className="text-center py-4"><Inbox className="w-12 h-12 mx-auto mb-3 text-[var(--comic-purple)]" /><ComicBurst>Import!</ComicBurst></div></ComicPanel></Link>
                <Link to="/plugins/job-tracker"><ComicPanel title="Jobs!"><div className="text-center py-4"><Briefcase className="w-12 h-12 mx-auto mb-3 text-[var(--comic-green)]" /><ComicBurst>Track!</ComicBurst></div></ComicPanel></Link>
            </div>

            <ComicPanel title="Recent Files!">
                {recentFiles.length === 0 ? (
                    <ComicEmpty text="No files yet!" />
                ) : (
                    <>
                        {recentFiles.map((file) => {
                            const Icon = getFileIcon(file.mimeType);
                            return (
                                <ComicFileRow
                                    key={file.id}
                                    icon={<Icon className="w-6 h-6" />}
                                    name={file.originalName || file.name}
                                    meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`}
                                    actions={file.isStarred && <ComicBadge>★ STAR</ComicBadge>}
                                />
                            );
                        })}
                        <div className="mt-4 pt-4 border-t-2 border-dashed border-black text-center">
                            <Link to="/files"><ComicButton variant="primary">View All Files! →</ComicButton></Link>
                        </div>
                    </>
                )}
            </ComicPanel>
        </ComicLayout>
    );
}
