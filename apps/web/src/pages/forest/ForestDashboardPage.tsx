import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Image, Video, Star, FolderOpen, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestStatCard, ForestPageHeader, ForestButton, ForestProgressRing } from '@/components/forest/ForestComponents';
import { useFilesStore } from '@/stores/files.store';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function ForestDashboardPage() {
    const { files, setFiles } = useFilesStore();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ documents: 0, images: 0, videos: 0, starred: 0, totalSize: 0 });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const res = await filesApi.getFiles({});
                const fileList = res.data?.data || [];
                setFiles(fileList);

                // Calculate stats
                const documents = fileList.filter((f: any) => f.mimeType?.startsWith('application/') || f.mimeType?.startsWith('text/')).length;
                const images = fileList.filter((f: any) => f.mimeType?.startsWith('image/')).length;
                const videos = fileList.filter((f: any) => f.mimeType?.startsWith('video/')).length;
                const starred = fileList.filter((f: any) => f.isStarred).length;
                const totalSize = fileList.reduce((acc: number, f: any) => acc + (f.size || 0), 0);
                setStats({ documents, images, videos, starred, totalSize });
            } catch (error) {
                console.error('Failed to load files:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [setFiles]);

    const recentFiles = files.slice(0, 6);
    const storageUsed = stats.totalSize;
    const storageLimit = 5 * 1024 * 1024 * 1024; // 5GB
    const storagePercent = Math.min((storageUsed / storageLimit) * 100, 100);

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Welcome to TAAS"
                subtitle="Your personal file sanctuary"
                icon={<FolderOpen className="w-6 h-6" />}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <ForestStatCard label="Documents" value={stats.documents} icon={<FileText className="w-5 h-5" />} />
                        <ForestStatCard label="Images" value={stats.images} icon={<Image className="w-5 h-5" />} />
                        <ForestStatCard label="Videos" value={stats.videos} icon={<Video className="w-5 h-5" />} />
                        <ForestStatCard label="Starred" value={stats.starred} icon={<Star className="w-5 h-5" />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Files */}
                        <div className="lg:col-span-2">
                            <ForestCard>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-[var(--forest-moss)]">Recent Files</h3>
                                    <Link to="/files">
                                        <ForestButton>View All <ArrowRight className="w-4 h-4 ml-1" /></ForestButton>
                                    </Link>
                                </div>
                                {recentFiles.length === 0 ? (
                                    <p className="text-center text-[var(--forest-wood)] py-8">No files yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentFiles.map((file, index) => (
                                            <motion.div
                                                key={file.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-[rgba(74,124,89,0.05)] transition-colors"
                                            >
                                                <div className="forest-file-icon">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[var(--forest-moss)] truncate">{file.originalName || file.name}</p>
                                                    <p className="text-xs text-[var(--forest-wood)]">
                                                        {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                                                    </p>
                                                </div>
                                                {file.isStarred && <Star className="w-4 h-4 text-[var(--forest-warning)] fill-current" />}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </ForestCard>
                        </div>

                        {/* Storage & Quick Actions */}
                        <div className="space-y-6">
                            <ForestCard>
                                <h3 className="text-lg font-semibold text-[var(--forest-moss)] mb-4">Storage</h3>
                                <div className="flex items-center justify-center mb-4">
                                    <ForestProgressRing value={storagePercent} size={120} strokeWidth={10} />
                                </div>
                                <p className="text-center text-sm text-[var(--forest-wood)]">
                                    {formatFileSize(storageUsed)} of {formatFileSize(storageLimit)}
                                </p>
                            </ForestCard>

                            <ForestCard>
                                <h3 className="text-lg font-semibold text-[var(--forest-moss)] mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <Link to="/files">
                                        <ForestButton variant="primary" className="w-full justify-center">
                                            <Upload className="w-4 h-4 mr-2" /> Upload Files
                                        </ForestButton>
                                    </Link>
                                    <Link to="/starred">
                                        <ForestButton className="w-full justify-center">
                                            <Star className="w-4 h-4 mr-2" /> View Starred
                                        </ForestButton>
                                    </Link>
                                </div>
                            </ForestCard>
                        </div>
                    </div>
                </>
            )}
        </ForestLayout>
    );
}
