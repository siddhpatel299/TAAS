import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Music, Loader2, Star, Upload, Briefcase, FolderOpen } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintArticle, NewsprintCard, NewsprintSection, NewsprintStat, NewsprintButton, NewsprintPullQuote, NewsprintBadge } from '@/components/newsprint/NewsprintComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

export function NewsprintDashboardPage() {
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
        return <NewsprintLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin" /></div></NewsprintLayout>;
    }

    return (
        <NewsprintLayout>
            {/* Lead Story Section */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Main Lead */}
                <div className="col-span-2">
                    <NewsprintArticle headline="Welcome to Your Digital Filing Cabinet" headlineSize="large" byline="Your Storage Dashboard">
                        <div className="newsprint-article-body">
                            <p>
                                Your personal file storage system stands ready to serve all your document management needs.
                                With robust organization tools, seamless Telegram integration, and powerful search capabilities,
                                managing your digital life has never been more elegant. Browse your files, track job applications,
                                and stay organized with our comprehensive suite of tools.
                            </p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Link to="/files"><NewsprintButton variant="primary"><Upload className="w-4 h-4" /> Upload Files</NewsprintButton></Link>
                            <Link to="/telegram"><NewsprintButton>Import from Telegram</NewsprintButton></Link>
                        </div>
                    </NewsprintArticle>
                </div>

                {/* Side Stats */}
                <div className="space-y-4">
                    <NewsprintSection title="By The Numbers">
                        <div className="grid grid-cols-2 gap-3">
                            <NewsprintStat value={stats?.totalFiles || 0} label="Files" />
                            <NewsprintStat value={stats?.totalFolders || 0} label="Folders" />
                            <NewsprintStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" />
                            <NewsprintStat value={stats?.starredFiles || 0} label="Starred" />
                        </div>
                    </NewsprintSection>

                    <NewsprintPullQuote>
                        All the files that's fit to store
                    </NewsprintPullQuote>
                </div>
            </div>

            {/* Two Column Section */}
            <div className="grid grid-cols-3 gap-6">
                {/* Recent Files - 2 columns wide */}
                <div className="col-span-2">
                    <NewsprintSection title="Latest Uploads">
                        {recentFiles.length === 0 ? (
                            <NewsprintCard className="!p-8 text-center">
                                <p className="text-[var(--newsprint-ink-muted)] italic">No files uploaded yet. Your story begins here.</p>
                            </NewsprintCard>
                        ) : (
                            <div className="newsprint-columns-2">
                                {recentFiles.map((file) => {
                                    const Icon = getFileIcon(file.mimeType);
                                    return (
                                        <NewsprintCard key={file.id} className="newsprint-column-break">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 border border-[var(--newsprint-rule-light)] flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-5 h-5 text-[var(--newsprint-ink-muted)]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-headline)' }}>
                                                        {file.originalName || file.name}
                                                    </h4>
                                                    <p className="text-xs text-[var(--newsprint-ink-muted)] mt-1">
                                                        {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                                                    </p>
                                                    {file.isStarred && <NewsprintBadge variant="red">★ Starred</NewsprintBadge>}
                                                </div>
                                            </div>
                                        </NewsprintCard>
                                    );
                                })}
                            </div>
                        )}
                        <div className="text-center mt-4">
                            <Link to="/files" className="text-sm text-[var(--newsprint-red)] hover:underline" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                View All Files →
                            </Link>
                        </div>
                    </NewsprintSection>
                </div>

                {/* Sidebar */}
                <div>
                    <NewsprintSection title="Quick Access">
                        <div className="space-y-3">
                            <Link to="/files" className="block">
                                <NewsprintCard className="flex items-center gap-3 hover:bg-[var(--newsprint-bg)] transition-colors cursor-pointer">
                                    <FolderOpen className="w-5 h-5 text-[var(--newsprint-ink-muted)]" />
                                    <div>
                                        <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-headline)' }}>Browse Files</p>
                                        <p className="text-xs text-[var(--newsprint-ink-muted)]">All your documents</p>
                                    </div>
                                </NewsprintCard>
                            </Link>
                            <Link to="/plugins/job-tracker" className="block">
                                <NewsprintCard className="flex items-center gap-3 hover:bg-[var(--newsprint-bg)] transition-colors cursor-pointer">
                                    <Briefcase className="w-5 h-5 text-[var(--newsprint-ink-muted)]" />
                                    <div>
                                        <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-headline)' }}>Job Tracker</p>
                                        <p className="text-xs text-[var(--newsprint-ink-muted)]">Track applications</p>
                                    </div>
                                </NewsprintCard>
                            </Link>
                            <Link to="/starred" className="block">
                                <NewsprintCard className="flex items-center gap-3 hover:bg-[var(--newsprint-bg)] transition-colors cursor-pointer">
                                    <Star className="w-5 h-5 text-[var(--newsprint-ink-muted)]" />
                                    <div>
                                        <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-headline)' }}>Starred Files</p>
                                        <p className="text-xs text-[var(--newsprint-ink-muted)]">Your favorites</p>
                                    </div>
                                </NewsprintCard>
                            </Link>
                        </div>
                    </NewsprintSection>
                </div>
            </div>
        </NewsprintLayout>
    );
}
