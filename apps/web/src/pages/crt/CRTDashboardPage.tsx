import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Briefcase, Upload, Inbox } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTBox, CRTStat, CRTButton, CRTTitle, CRTEmpty, CRTFileRow, CRTBadge } from '@/components/crt/CRTComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function CRTDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' })]);
            setStats(statsRes.data?.data);
            setRecentFiles(filesRes.data?.data || []);
        } catch (error) { console.error('Failed to load:', error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return <CRTLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--crt-green)]" /></div></CRTLayout>;
    }

    return (
        <CRTLayout>
            <CRTTitle>System Status</CRTTitle>

            <div className="crt-panels crt-panels-2">
                {/* Left Panel - Stats */}
                <CRTPanel header="Storage Analysis">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <CRTStat value={stats?.totalFiles || 0} label="Files" />
                        <CRTStat value={stats?.totalFolders || 0} label="Dirs" />
                        <CRTStat value={formatFileSize(stats?.totalSize || 0)} label="Used" />
                        <CRTStat value={stats?.starredFiles || 0} label="Starred" />
                    </div>

                    <div className="crt-subtitle">Quick Actions</div>
                    <div className="space-y-2">
                        <Link to="/files" className="block"><CRTBox className="flex items-center gap-3"><Upload className="w-5 h-5" /> Upload Files</CRTBox></Link>
                        <Link to="/telegram" className="block"><CRTBox className="flex items-center gap-3"><Inbox className="w-5 h-5" /> Telegram Import</CRTBox></Link>
                        <Link to="/plugins/job-tracker" className="block"><CRTBox className="flex items-center gap-3"><Briefcase className="w-5 h-5" /> Job Tracker</CRTBox></Link>
                    </div>
                </CRTPanel>

                {/* Right Panel - Recent Files */}
                <CRTPanel header="Recent Files">
                    {recentFiles.length === 0 ? (
                        <CRTEmpty text="No files in storage" />
                    ) : (
                        <div>
                            {recentFiles.map((file) => {
                                const Icon = getFileIcon(file.mimeType);
                                return (
                                    <CRTFileRow
                                        key={file.id}
                                        icon={<Icon className="w-5 h-5" />}
                                        name={file.originalName || file.name}
                                        meta={`${formatFileSize(file.size)} | ${formatDate(file.createdAt)}`}
                                        actions={file.isStarred && <CRTBadge color="amber">★</CRTBadge>}
                                    />
                                );
                            })}
                            <div className="mt-4 pt-4 border-t border-dashed border-[var(--crt-green-dim)]">
                                <Link to="/files"><CRTButton variant="primary">[VIEW ALL]</CRTButton></Link>
                            </div>
                        </div>
                    )}
                </CRTPanel>
            </div>
        </CRTLayout>
    );
}
