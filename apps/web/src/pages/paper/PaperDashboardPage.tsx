import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Upload, Briefcase, Inbox } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperSticky, PaperStat, PaperButton, PaperTitle, PaperEmpty, PaperFileRow, PaperBadge } from '@/components/paper/PaperComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) { if (mimeType?.startsWith('image/')) return Image; if (mimeType?.startsWith('video/')) return Video; if (mimeType?.startsWith('audio/')) return Music; return FileText; }

export function PaperDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [statsRes, filesRes] = await Promise.all([filesApi.getStats(), filesApi.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(statsRes.data?.data); setRecentFiles(filesRes.data?.data || []); } catch (error) { console.error('Failed to load:', error); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    if (loading) { return <PaperLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--ink-blue)]" /></div></PaperLayout>; }

    return (
        <PaperLayout>
            <PaperTitle subtitle="your personal notebook">My Notes</PaperTitle>

            <div className="paper-grid paper-grid-4 mb-8">
                <PaperSticky color="yellow"><PaperStat value={stats?.totalFiles || 0} label="Files" /></PaperSticky>
                <PaperSticky color="pink"><PaperStat value={stats?.totalFolders || 0} label="Folders" /></PaperSticky>
                <PaperSticky color="blue"><PaperStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" /></PaperSticky>
                <PaperSticky color="green"><PaperStat value={stats?.starredFiles || 0} label="Starred" /></PaperSticky>
            </div>

            <div className="paper-grid paper-grid-3 mb-8">
                <Link to="/files"><PaperCard><div className="flex items-center gap-3"><Upload className="w-6 h-6 text-[var(--ink-blue)]" /><div><p className="font-semibold">Upload Files</p><p className="text-sm text-[var(--ink-blue)]">add to your notebook</p></div></div></PaperCard></Link>
                <Link to="/telegram"><PaperCard><div className="flex items-center gap-3"><Inbox className="w-6 h-6 text-[var(--ink-green)]" /><div><p className="font-semibold">Telegram</p><p className="text-sm text-[var(--ink-blue)]">import from channels</p></div></div></PaperCard></Link>
                <Link to="/plugins/job-tracker"><PaperCard><div className="flex items-center gap-3"><Briefcase className="w-6 h-6 text-[var(--ink-red)]" /><div><p className="font-semibold">Job Tracker</p><p className="text-sm text-[var(--ink-blue)]">track applications</p></div></div></PaperCard></Link>
            </div>

            <PaperCard>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginBottom: '16px' }}>Recent Notes 📝</h3>
                {recentFiles.length === 0 ? <PaperEmpty text="No files yet... start adding some!" /> : (
                    <>
                        {recentFiles.map((file) => { const Icon = getFileIcon(file.mimeType); return <PaperFileRow key={file.id} icon={<Icon className="w-5 h-5" />} name={file.originalName || file.name} meta={`${formatFileSize(file.size)} • ${formatDate(file.createdAt)}`} actions={file.isStarred && <PaperBadge>★ starred</PaperBadge>} />; })}
                        <div className="mt-6"><Link to="/files"><PaperButton variant="primary">View All Files →</PaperButton></Link></div>
                    </>
                )}
            </PaperCard>
        </PaperLayout>
    );
}
