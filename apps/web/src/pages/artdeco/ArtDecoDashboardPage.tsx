import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoStat, DecoButton, DecoTitle, DecoEmpty, DecoFileRow, DecoBadge, DecoDivider } from '@/components/artdeco/ArtDecoComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function ArtDecoDashboardPage() {
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
        return <ArtDecoLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--deco-gold)]" /></div></ArtDecoLayout>;
    }

    return (
        <ArtDecoLayout>
            <DecoTitle>Dashboard</DecoTitle>

            <div className="deco-grid deco-grid-4 mb-8">
                <DecoStat value={stats?.totalFiles || 0} label="Files" />
                <DecoStat value={stats?.totalFolders || 0} label="Folders" />
                <DecoStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" />
                <DecoStat value={stats?.starredFiles || 0} label="Starred" />
            </div>

            <DecoDivider text="Quick Actions" />

            <div className="deco-grid deco-grid-3 mb-8">
                <Link to="/files"><DecoCard className="text-center"><Upload className="w-10 h-10 mx-auto mb-4 text-[var(--deco-gold)]" /><p className="text-lg">Upload Files</p></DecoCard></Link>
                <Link to="/telegram"><DecoCard className="text-center"><Inbox className="w-10 h-10 mx-auto mb-4 text-[var(--deco-sage)]" /><p className="text-lg">Telegram Import</p></DecoCard></Link>
                <Link to="/plugins/job-tracker"><DecoCard className="text-center"><Briefcase className="w-10 h-10 mx-auto mb-4 text-[var(--deco-rose)]" /><p className="text-lg">Job Tracker</p></DecoCard></Link>
            </div>

            <DecoDivider text="Recent Files" />

            <DecoCard>
                {recentFiles.length === 0 ? (
                    <DecoEmpty text="No files uploaded yet" />
                ) : (
                    <>
                        {recentFiles.map((file) => {
                            const Icon = getFileIcon(file.mimeType);
                            return (
                                <DecoFileRow
                                    key={file.id}
                                    icon={<Icon className="w-6 h-6" />}
                                    name={file.originalName || file.name}
                                    meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`}
                                    actions={file.isStarred && <DecoBadge>★</DecoBadge>}
                                />
                            );
                        })}
                        <div className="mt-6 pt-6 border-t border-[var(--deco-gold-dark)] text-center">
                            <Link to="/files"><DecoButton variant="primary">View All Files</DecoButton></Link>
                        </div>
                    </>
                )}
            </DecoCard>
        </ArtDecoLayout>
    );
}
