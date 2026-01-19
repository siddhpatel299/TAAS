import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FolderOpen,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    Upload,
    Download,
    Clock,
    TrendingUp,
    HardDrive,
    Activity,
    Zap,
    Star,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDStatCard, HUDProgressRing, HUDButton } from '@/components/hud/HUDComponents';
import { useFilesStore } from '@/stores/files.store';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// File type icons mapping
const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    document: FileText,
    image: Image,
    video: Video,
    audio: Music,
    archive: Archive,
    other: FolderOpen,
};

const fileTypeColors: Record<string, string> = {
    document: 'text-blue-400',
    image: 'text-purple-400',
    video: 'text-pink-400',
    audio: 'text-green-400',
    archive: 'text-yellow-400',
    other: 'text-cyan-400',
};

interface RecentFile {
    id: string;
    name: string;
    type: string;
    size: string;
    date: string;
}

export function HUDDashboardPage() {
    const { files, setFiles } = useFilesStore();
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [totalSize, setTotalSize] = useState(0);

    useEffect(() => {
        // Fetch files from API
        const fetchFiles = async () => {
            try {
                const response = await api.get('/files');
                if (response.data?.data) {
                    setFiles(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch files:', error);
            }
        };
        fetchFiles();
    }, [setFiles]);

    useEffect(() => {
        // Calculate stats from files
        const size = files.reduce((acc, f) => acc + (f.size || 0), 0);
        setTotalSize(size);

        // Get recent files from store
        const recent = files.slice(0, 5).map(f => ({
            id: f.id,
            name: f.originalName || f.name || 'Unknown',
            type: getFileType(f.mimeType || ''),
            size: formatBytes(f.size || 0),
            date: formatDate(f.createdAt),
        }));
        setRecentFiles(recent);
    }, [files]);

    const getFileType = (mimeType: string): string => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
        return 'other';
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    // Calculate stats
    const totalFiles = files.length;

    return (
        <HUDLayout>
            {/* Header */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                            SYSTEM DASHBOARD
                        </h1>
                        <p className="text-cyan-600/70 mt-1">Welcome back, Commander</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <HUDButton variant="primary">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Files
                        </HUDButton>
                    </div>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <HUDStatCard
                        label="Total Files"
                        value={totalFiles}
                        icon={<FolderOpen className="w-5 h-5 text-cyan-400" />}
                        trend={{ value: 'All systems operational', positive: true }}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <HUDStatCard
                        label="Storage Used"
                        value={formatBytes(totalSize)}
                        icon={<HardDrive className="w-5 h-5 text-cyan-400" />}
                        trend={{ value: 'Unlimited capacity' }}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <HUDStatCard
                        label="Downloads"
                        value="∞"
                        icon={<Download className="w-5 h-5 text-cyan-400" />}
                        trend={{ value: 'No limits' }}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <HUDStatCard
                        label="System Status"
                        value="ONLINE"
                        icon={<Activity className="w-5 h-5 text-green-400" />}
                        trend={{ value: 'All services running', positive: true }}
                    />
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Storage Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <HUDPanel className="p-6 h-full" glow>
                        <div className="flex items-center gap-2 mb-6">
                            <Zap className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-semibold text-cyan-300">Storage Analysis</h2>
                        </div>

                        <div className="flex justify-center mb-6">
                            <HUDProgressRing
                                value={100}
                                size={160}
                                strokeWidth={12}
                                label="∞"
                                sublabel="UNLIMITED"
                            />
                        </div>

                        <div className="space-y-3">
                            {Object.entries(fileTypeIcons).map(([type, Icon]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center", fileTypeColors[type])}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-cyan-200 capitalize">{type}</span>
                                    </div>
                                    <span className="text-sm text-cyan-400">∞</span>
                                </div>
                            ))}
                        </div>
                    </HUDPanel>
                </motion.div>

                {/* Recent Files */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2"
                >
                    <HUDPanel className="p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cyan-400" />
                                <h2 className="text-lg font-semibold text-cyan-300">Recent Activity</h2>
                            </div>
                            <Link to="/files" className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors">
                                View All →
                            </Link>
                        </div>

                        {recentFiles.length > 0 ? (
                            <div className="space-y-3">
                                {recentFiles.map((file, index) => {
                                    const Icon = fileTypeIcons[file.type] || FolderOpen;
                                    return (
                                        <motion.div
                                            key={file.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="flex items-center gap-4 p-3 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all cursor-pointer"
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center",
                                                fileTypeColors[file.type]
                                            )}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-cyan-200 font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-cyan-600">{file.size} • {file.date}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FolderOpen className="w-12 h-12 mx-auto mb-4 text-cyan-600/50" />
                                <p className="text-cyan-600">No files uploaded yet</p>
                                <p className="text-sm text-cyan-700 mt-1">Upload files to get started</p>
                            </div>
                        )}
                    </HUDPanel>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6"
            >
                <HUDPanel className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-semibold text-cyan-300">Quick Access</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link to="/files">
                            <HUDPanel hover className="p-4 text-center cursor-pointer">
                                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                                <p className="text-sm text-cyan-300">All Files</p>
                            </HUDPanel>
                        </Link>

                        <Link to="/starred">
                            <HUDPanel hover className="p-4 text-center cursor-pointer">
                                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                                <p className="text-sm text-cyan-300">Favorites</p>
                            </HUDPanel>
                        </Link>

                        <Link to="/telegram">
                            <HUDPanel hover className="p-4 text-center cursor-pointer">
                                <Download className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                                <p className="text-sm text-cyan-300">Import</p>
                            </HUDPanel>
                        </Link>

                        <Link to="/plugins">
                            <HUDPanel hover className="p-4 text-center cursor-pointer">
                                <Zap className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                                <p className="text-sm text-cyan-300">Plugins</p>
                            </HUDPanel>
                        </Link>
                    </div>
                </HUDPanel>
            </motion.div>
        </HUDLayout>
    );
}
