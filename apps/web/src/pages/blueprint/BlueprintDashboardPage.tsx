import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, FileText, Image, Video, Music, Loader2, ArrowRight, Briefcase, Star, Clock, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintStat, BlueprintBadge } from '@/components/blueprint/BlueprintComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }),
};

export function BlueprintDashboardPage() {
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
        return <BlueprintLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div></BlueprintLayout>;
    }

    return (
        <BlueprintLayout>
            {/* Hero Section - Command-First */}
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0} className="mb-8">
                <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--blueprint-line-dim)] text-[var(--blueprint-cyan)] text-xs font-mono uppercase tracking-wider mb-4">
                        <Command className="w-3 h-3" /> Command-Driven Interface
                    </div>
                    <h1 className="text-3xl font-light text-[var(--blueprint-text)] font-mono mb-2">SYSTEM DASHBOARD</h1>
                    <p className="text-[var(--blueprint-text-dim)] text-sm font-mono">Press <kbd className="px-1.5 py-0.5 bg-[var(--blueprint-line-dim)] text-[var(--blueprint-cyan)] mx-1">⌘K</kbd> to open command palette</p>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
                    <BlueprintCard corners><BlueprintStat value={stats?.totalFiles || 0} label="Total Files" /></BlueprintCard>
                </motion.div>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}>
                    <BlueprintCard><BlueprintStat value={stats?.totalFolders || 0} label="Folders" /></BlueprintCard>
                </motion.div>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3}>
                    <BlueprintCard><BlueprintStat value={formatFileSize(stats?.totalSize || 0)} label="Storage" /></BlueprintCard>
                </motion.div>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4}>
                    <BlueprintCard><BlueprintStat value={stats?.starredFiles || 0} label="Starred" /></BlueprintCard>
                </motion.div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-3 gap-6">
                {/* Quick Commands */}
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={5}>
                    <BlueprintCard className="h-full">
                        <h2 className="text-xs uppercase tracking-widest text-[var(--blueprint-cyan)] font-mono mb-4 flex items-center gap-2">
                            <Command className="w-3 h-3" /> Quick Commands
                        </h2>
                        <div className="space-y-2">
                            {[
                                { label: 'Browse Files', shortcut: 'G F', path: '/files', icon: FolderOpen },
                                { label: 'Job Tracker', shortcut: 'G J', path: '/plugins/job-tracker', icon: Briefcase },
                                { label: 'Starred Files', shortcut: 'G S', path: '/starred', icon: Star },
                            ].map((cmd, i) => (
                                <Link key={i} to={cmd.path} className="flex items-center gap-3 p-3 border border-[var(--blueprint-line-dim)] hover:border-[var(--blueprint-cyan)] hover:bg-[var(--blueprint-line-dim)]/20 transition-all group">
                                    <cmd.icon className="w-4 h-4 text-[var(--blueprint-cyan)]" />
                                    <span className="flex-1 text-sm font-mono text-[var(--blueprint-text)]">{cmd.label}</span>
                                    <kbd className="text-[0.65rem] px-1.5 py-0.5 bg-[var(--blueprint-bg)] border border-[var(--blueprint-line-dim)] text-[var(--blueprint-text-muted)] group-hover:border-[var(--blueprint-cyan)] group-hover:text-[var(--blueprint-cyan)]">{cmd.shortcut}</kbd>
                                    <ArrowRight className="w-4 h-4 text-[var(--blueprint-text-dim)] group-hover:text-[var(--blueprint-cyan)]" />
                                </Link>
                            ))}
                        </div>
                    </BlueprintCard>
                </motion.div>

                {/* Recent Files */}
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={6} className="col-span-2">
                    <BlueprintCard>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs uppercase tracking-widest text-[var(--blueprint-cyan)] font-mono flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Recent Activity
                            </h2>
                            <Link to="/files" className="text-xs text-[var(--blueprint-text-dim)] hover:text-[var(--blueprint-cyan)] font-mono">VIEW ALL →</Link>
                        </div>
                        {recentFiles.length === 0 ? (
                            <div className="py-8 text-center text-[var(--blueprint-text-dim)] font-mono text-sm">No files yet</div>
                        ) : (
                            <div className="space-y-1">
                                {recentFiles.slice(0, 6).map((file) => {
                                    const Icon = getFileIcon(file.mimeType);
                                    return (
                                        <div key={file.id} className="flex items-center gap-4 p-3 border border-[var(--blueprint-line-dim)] hover:bg-[var(--blueprint-line-dim)]/20">
                                            <div className="w-8 h-8 border border-[var(--blueprint-line-dim)] flex items-center justify-center">
                                                <Icon className="w-4 h-4 text-[var(--blueprint-cyan)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-mono text-[var(--blueprint-text)] truncate">{file.originalName || file.name}</p>
                                                <p className="text-xs text-[var(--blueprint-text-muted)] font-mono">{formatFileSize(file.size)}</p>
                                            </div>
                                            <span className="text-xs text-[var(--blueprint-text-muted)] font-mono">{formatDate(file.createdAt)}</span>
                                            {file.isStarred && <BlueprintBadge variant="cyan">★</BlueprintBadge>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </BlueprintCard>
                </motion.div>
            </div>
        </BlueprintLayout>
    );
}
