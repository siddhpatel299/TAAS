import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, FileText, Upload, Image, Video, Music, Loader2, Star, ArrowRight, Briefcase, Send, Clock, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard } from '@/components/origami/OrigamiComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Video;
    if (mimeType?.startsWith('audio/')) return Music;
    return FileText;
}

// Bento card animations
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

export function OrigamiDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, filesRes] = await Promise.all([
                filesApi.getStats(),
                filesApi.getFiles({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
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

    if (loading) {
        return (
            <OrigamiLayout>
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-10 h-10 text-[var(--origami-terracotta)] animate-spin" />
                </div>
            </OrigamiLayout>
        );
    }

    return (
        <OrigamiLayout>
            {/* Bento Grid - Asymmetric Layout */}
            <div className="grid grid-cols-12 gap-4 auto-rows-[120px]">

                {/* Welcome Card - Large */}
                <motion.div
                    variants={cardVariants} initial="hidden" animate="visible" custom={0}
                    className="col-span-12 md:col-span-8 row-span-2"
                >
                    <OrigamiCard className="h-full flex flex-col justify-between" folded>
                        <div>
                            <p className="text-sm text-[var(--origami-text-dim)] uppercase tracking-wider mb-2">Welcome back</p>
                            <h1 className="text-4xl font-light text-[var(--origami-text)]">Your Workspace</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/files" className="flex items-center gap-2 px-5 py-3 bg-[var(--origami-terracotta)] text-white rounded-lg hover:bg-[#b5624a] transition-colors">
                                <Upload className="w-4 h-4" /> Upload Files
                            </Link>
                            <Link to="/telegram" className="flex items-center gap-2 px-5 py-3 border border-[var(--origami-crease)] text-[var(--origami-text)] rounded-lg hover:border-[var(--origami-terracotta)] transition-colors">
                                <Send className="w-4 h-4" /> Import from Telegram
                            </Link>
                        </div>
                    </OrigamiCard>
                </motion.div>

                {/* Total Files Stat */}
                <motion.div
                    variants={cardVariants} initial="hidden" animate="visible" custom={1}
                    className="col-span-6 md:col-span-2 row-span-1"
                >
                    <OrigamiCard className="h-full flex flex-col items-center justify-center text-center">
                        <FileText className="w-6 h-6 text-[var(--origami-terracotta)] mb-2" />
                        <p className="text-3xl font-light text-[var(--origami-text)]">{stats?.totalFiles || 0}</p>
                        <p className="text-xs text-[var(--origami-text-dim)] uppercase tracking-wide">Files</p>
                    </OrigamiCard>
                </motion.div>

                {/* Folders Stat */}
                <motion.div
                    variants={cardVariants} initial="hidden" animate="visible" custom={2}
                    className="col-span-6 md:col-span-2 row-span-1"
                >
                    <OrigamiCard className="h-full flex flex-col items-center justify-center text-center">
                        <FolderOpen className="w-6 h-6 text-[var(--origami-sage)] mb-2" />
                        <p className="text-3xl font-light text-[var(--origami-text)]">{stats?.totalFolders || 0}</p>
                        <p className="text-xs text-[var(--origami-text-dim)] uppercase tracking-wide">Folders</p>
                    </OrigamiCard>
                </motion.div>

                {/* Storage Stat */}
                <motion.div
                    variants={cardVariants} initial="hidden" animate="visible" custom={3}
                    className="col-span-6 md:col-span-2 row-span-1"
                >
                    <OrigamiCard className="h-full flex flex-col items-center justify-center text-center">
                        <HardDrive className="w-6 h-6 text-[var(--origami-slate)] mb-2" />
                        <p className="text-2xl font-light text-[var(--origami-text)]">{formatFileSize(stats?.totalSize || 0)}</p>
                        <p className="text-xs text-[var(--origami-text-dim)] uppercase tracking-wide">Storage</p>
                    </OrigamiCard>
                </motion.div>

                {/* Starred Stat */}
                <motion.div
                    variants={cardVariants} initial="hidden" animate="visible" custom={4}
                    className="col-span-6 md:col-span-2 row-span-1"
                >
                    <Link to="/starred" className="block h-full">
                        <OrigamiCard className="h-full flex flex-col items-center justify-center text-center hover:border-[var(--origami-terracotta)] transition-colors cursor-pointer">
                            <Star className="w-6 h-6 text-[var(--origami-warning)] mb-2" />
                            <p className="text-3xl font-light text-[var(--origami-text)]">{stats?.starredFiles || 0}</p>
                            <p className="text-xs text-[var(--origami-text-dim)] uppercase tracking-wide">Starred</p>
                        </OrigamiCard>
                    </Link>
                </motion.div>

                {/* Quick Actions - Tall */}
                <motion.div
                    variants={cardVariants} initial="hidden" animate="visible" custom={5}
                    className="col-span-12 md:col-span-4 row-span-3"
                >
                    <OrigamiCard className="h-full" folded>
                        <h2 className="text-sm text-[var(--origami-text-dim)] uppercase tracking-wider mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link to="/files" className="flex items-center gap-4 p-4 bg-[var(--origami-bg)] rounded-lg hover:bg-[var(--origami-crease)] transition-colors group">
                                <div className="w-10 h-10 bg-[var(--origami-paper)] border border-[var(--origami-crease)] rounded-lg flex items-center justify-center">
                                    <FolderOpen className="w-5 h-5 text-[var(--origami-terracotta)]" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-[var(--origami-text)]">Browse Files</p>
                                    <p className="text-sm text-[var(--origami-text-dim)]">View all files and folders</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[var(--origami-text-dim)] group-hover:text-[var(--origami-terracotta)] transition-colors" />
                            </Link>
                            <Link to="/plugins/job-tracker" className="flex items-center gap-4 p-4 bg-[var(--origami-bg)] rounded-lg hover:bg-[var(--origami-crease)] transition-colors group">
                                <div className="w-10 h-10 bg-[var(--origami-paper)] border border-[var(--origami-crease)] rounded-lg flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-[var(--origami-slate)]" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-[var(--origami-text)]">Job Tracker</p>
                                    <p className="text-sm text-[var(--origami-text-dim)]">Track applications</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[var(--origami-text-dim)] group-hover:text-[var(--origami-terracotta)] transition-colors" />
                            </Link>
                            <Link to="/starred" className="flex items-center gap-4 p-4 bg-[var(--origami-bg)] rounded-lg hover:bg-[var(--origami-crease)] transition-colors group">
                                <div className="w-10 h-10 bg-[var(--origami-paper)] border border-[var(--origami-crease)] rounded-lg flex items-center justify-center">
                                    <Star className="w-5 h-5 text-[var(--origami-warning)]" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-[var(--origami-text)]">Starred Files</p>
                                    <p className="text-sm text-[var(--origami-text-dim)]">Your favorites</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[var(--origami-text-dim)] group-hover:text-[var(--origami-terracotta)] transition-colors" />
                            </Link>
                        </div>
                    </OrigamiCard>
                </motion.div>

                {/* Recent Files - Wide */}
                <motion.div
                    variants={cardVariants} initial="hidden" animate="visible" custom={6}
                    className="col-span-12 md:col-span-8 row-span-3"
                >
                    <OrigamiCard className="h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm text-[var(--origami-text-dim)] uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Recent Files
                            </h2>
                            <Link to="/files" className="text-sm text-[var(--origami-terracotta)] hover:underline">View All</Link>
                        </div>
                        {recentFiles.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-[var(--origami-text-dim)]">
                                No files yet. Upload your first file!
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {recentFiles.slice(0, 6).map((file, i) => {
                                    const Icon = getFileIcon(file.mimeType);
                                    return (
                                        <motion.div
                                            key={file.id}
                                            variants={cardVariants} initial="hidden" animate="visible" custom={i + 7}
                                            className="p-4 bg-[var(--origami-bg)] rounded-lg hover:bg-[var(--origami-crease)] transition-colors cursor-pointer"
                                        >
                                            <div className="w-10 h-10 bg-[var(--origami-paper)] border border-[var(--origami-crease)] rounded-lg flex items-center justify-center mb-3">
                                                <Icon className="w-5 h-5 text-[var(--origami-slate)]" />
                                            </div>
                                            <p className="font-medium text-[var(--origami-text)] truncate text-sm">{file.originalName || file.name}</p>
                                            <p className="text-xs text-[var(--origami-text-dim)] mt-1">{formatFileSize(file.size)}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </OrigamiCard>
                </motion.div>

            </div>
        </OrigamiLayout>
    );
}
