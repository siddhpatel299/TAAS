import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Video, Star, Upload, FolderOpen, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalStat, TerminalButton, TerminalFileRow, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { filesApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

export function TerminalDashboardPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, documents: 0, images: 0, videos: 0, starred: 0, size: 0 });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const res = await filesApi.getFiles({});
                const fileList = res.data?.data || [];
                setFiles(fileList);
                setStats({
                    total: fileList.length,
                    documents: fileList.filter((f: any) => f.mimeType?.includes('document') || f.mimeType?.includes('pdf') || f.mimeType?.startsWith('text/')).length,
                    images: fileList.filter((f: any) => f.mimeType?.startsWith('image/')).length,
                    videos: fileList.filter((f: any) => f.mimeType?.startsWith('video/')).length,
                    starred: fileList.filter((f: any) => f.isStarred).length,
                    size: fileList.reduce((acc: number, f: any) => acc + (f.size || 0), 0),
                });
            } catch (error) {
                console.error('Failed to load:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const recentFiles = files.slice(0, 10);

    return (
        <TerminalLayout>
            <TerminalHeader
                title="Dashboard"
                subtitle="System overview and recent activity"
                actions={
                    <Link to="/files">
                        <TerminalButton variant="primary">
                            <Upload className="w-3 h-3 mr-1" /> Upload
                        </TerminalButton>
                    </Link>
                }
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Stats Grid */}
                    <div className="lg:col-span-2">
                        <TerminalPanel title="Statistics">
                            <div className="terminal-grid-4">
                                <TerminalStat label="Total Files" value={stats.total} />
                                <TerminalStat label="Documents" value={stats.documents} />
                                <TerminalStat label="Images" value={stats.images} />
                                <TerminalStat label="Videos" value={stats.videos} />
                            </div>
                            <div className="mt-4 terminal-grid-2">
                                <TerminalStat label="Starred" value={stats.starred} />
                                <TerminalStat label="Total Size" value={formatFileSize(stats.size)} />
                            </div>
                        </TerminalPanel>
                    </div>

                    {/* Quick Actions */}
                    <TerminalPanel title="Quick Actions">
                        <div className="space-y-2">
                            <Link to="/files" className="block">
                                <TerminalButton className="w-full justify-start">
                                    <FolderOpen className="w-3 h-3 mr-2" /> Browse Files
                                </TerminalButton>
                            </Link>
                            <Link to="/starred" className="block">
                                <TerminalButton className="w-full justify-start">
                                    <Star className="w-3 h-3 mr-2" /> Starred Items
                                </TerminalButton>
                            </Link>
                            <Link to="/plugins/job-tracker" className="block">
                                <TerminalButton className="w-full justify-start">
                                    <FileText className="w-3 h-3 mr-2" /> Job Tracker
                                </TerminalButton>
                            </Link>
                        </div>
                    </TerminalPanel>

                    {/* Recent Files */}
                    <div className="lg:col-span-3">
                        <TerminalPanel title="Recent Files">
                            {recentFiles.length === 0 ? (
                                <TerminalEmpty
                                    icon={<FolderOpen className="w-full h-full" />}
                                    text="No files found"
                                />
                            ) : (
                                <div>
                                    {recentFiles.map((file) => {
                                        const Icon = file.mimeType?.startsWith('image/') ? Image
                                            : file.mimeType?.startsWith('video/') ? Video
                                                : FileText;
                                        return (
                                            <TerminalFileRow
                                                key={file.id}
                                                icon={<Icon className="w-4 h-4" />}
                                                name={file.originalName || file.name}
                                                meta={formatFileSize(file.size)}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </TerminalPanel>
                    </div>
                </div>
            )}
        </TerminalLayout>
    );
}
