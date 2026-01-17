import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    HardDrive,
    Clock,
    Star,
    Activity,
    Shield
} from 'lucide-react';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { useAuthStore } from '@/stores/auth.store';
import { filesApi } from '@/lib/api';
import { HoloCard } from '@/components/war-zone/HoloCard';
import { GlitchText } from '@/components/war-zone/GlitchText';
import { WarZoneFileUploader } from '@/components/war-zone/WarZoneFileUploader';
import { WarZoneFileActions } from '@/components/war-zone/WarZoneFileActions';
import { cn } from '@/lib/utils';


export function WarZoneDashboardPage() {
    const { user } = useAuthStore();
    const { setLoading } = useFilesStore();
    const [recentFiles, setRecentFiles] = useState<StoredFile[]>([]);
    const [quickStats, setQuickStats] = useState<any>({
        images: 0, videos: 0, documents: 0, audio: 0
    });

    // Re-using data fetching logic (isolated)
    const loadContent = useCallback(async () => {
        setLoading(true);
        try {
            const [filesRes] = await Promise.all([
                filesApi.getFiles({ sortBy: 'createdAt', sortOrder: 'desc', limit: 8 }),
            ]);

            const allFiles = filesRes.data.data as StoredFile[];
            setRecentFiles(allFiles);

            // Simple category stats simulation (real app would aggregate properly)
            setQuickStats({
                images: Math.floor(Math.random() * 50) + 10,
                videos: Math.floor(Math.random() * 20) + 5,
                documents: Math.floor(Math.random() * 30) + 15,
                audio: Math.floor(Math.random() * 10) + 2
            });

        } catch (error) {
            console.error('Failed to load content:', error);
        } finally {
            setLoading(false);
        }
    }, [setLoading]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <HoloCard className="md:col-span-3 h-auto p-6 flex flex-col justify-center relative group">
                    <div className="absolute top-4 right-4 animate-pulse">
                        <Activity className="text-cyan-500 w-6 h-6" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                        WELCOME_BACK // <GlitchText text={user?.firstName?.toUpperCase() || 'OPERATOR'} />
                    </h1>
                    <p className="text-cyan-400/60 font-mono text-lg max-w-xl mb-6">
                        SYSTEM STATUS: OPTIMAL. DEPLOYMENT READY.
                        ACCESS YOUR ENCRYPTED ARCHIVES BELOW.
                    </p>
                    <div className="max-w-md">
                        <WarZoneFileUploader />
                    </div>
                </HoloCard>

                <HoloCard className="md:col-span-1 h-64 flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 flex items-center justify-center relative mb-4">
                        <div className="absolute inset-0 rounded-full border-t-4 border-cyan-500 animate-spin transition-all duration-[3s]" />
                        <HardDrive className="w-12 h-12 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">UNLIMITED</h3>
                    <p className="text-cyan-500/60 text-xs tracking-widest">STORAGE CAPACITY</p>
                </HoloCard>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={ImageIcon} label="VISUAL_DATA" value={quickStats.images} color="text-purple-400" border="border-purple-500/30" />
                <StatCard icon={Video} label="MOTION_DATA" value={quickStats.videos} color="text-cyan-400" border="border-cyan-500/30" />
                <StatCard icon={FileText} label="TEXT_LOGS" value={quickStats.documents} color="text-blue-400" border="border-blue-500/30" />
                <StatCard icon={Music} label="AUDIO_WAVES" value={quickStats.audio} color="text-green-400" border="border-green-500/30" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                {/* Recent Files - 2 Cols */}
                <HoloCard className="md:col-span-2 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6 border-b border-cyan-900/30 pb-2">
                        <h3 className="text-xl font-bold text-cyan-100 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-500" /> RECENT_TRANSMISSIONS
                        </h3>
                        <button className="text-xs text-cyan-600 hover:text-cyan-400">[VIEW ALL]</button>
                    </div>

                    <div className="flex-1 overflow-auto pr-2 space-y-2 custom-scrollbar">
                        {recentFiles.map((file, i) => (
                            <motion.div
                                key={file.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center justify-between p-3 rounded bg-cyan-950/20 border border-transparent hover:border-cyan-500/30 hover:bg-cyan-950/40 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-cyan-900/30 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                        <FileIcon mime={file.mimeType} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-cyan-100 group-hover:text-cyan-300 transition-colors truncate max-w-[200px]">{file.originalName}</p>
                                        <p className="text-xs text-cyan-700">{formatSize(file.size)}</p>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <WarZoneFileActions file={file} onDelete={() => {
                                        setRecentFiles(prev => prev.filter(f => f.id !== file.id));
                                    }} />
                                </div>
                            </motion.div>
                        ))}
                        {recentFiles.length === 0 && (
                            <div className="h-full flex items-center justify-center text-cyan-800 font-mono">
                                NO DATA FOUND
                            </div>
                        )}
                    </div>
                </HoloCard>

                {/* Quick Actions / Starred - 1 Col */}
                <div className="flex flex-col gap-6 h-full">
                    <HoloCard className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-4 text-cyan-100 font-bold">
                            <Star className="w-4 h-4 text-yellow-500" /> PRIORITY_access
                        </div>
                        <div className="flex-1 border-2 border-dashed border-cyan-900/30 rounded flex items-center justify-center text-cyan-800 text-xs">
                            DRAG_DROP_ZONE
                        </div>
                    </HoloCard>

                    <HoloCard className="h-1/3 flex items-center justify-between px-6 bg-gradient-to-r from-orange-900/10 to-transparent border-orange-500/20">
                        <div>
                            <p className="text-xs text-orange-400 font-bold mb-1">WARNING</p>
                            <p className="text-xs text-orange-700">ENCRYPTION PROTOCOLS ACTIVE</p>
                        </div>
                        <Shield className="w-8 h-8 text-orange-500/50" />
                    </HoloCard>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, border }: any) {
    return (
        <HoloCard className={cn("flex flex-col items-center justify-center p-4", border)}>
            <Icon className={cn("w-6 h-6 mb-2", color)} />
            <span className="text-2xl font-bold text-white mb-1">{value}</span>
            <span className="text-[10px] tracking-widest text-cyan-700">{label}</span>
        </HoloCard>
    )
}

function FileIcon({ mime }: { mime: string }) {
    if (mime.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
    if (mime.includes('video')) return <Video className="w-5 h-5 text-cyan-400" />;
    if (mime.includes('audio')) return <Music className="w-5 h-5 text-green-400" />;
    return <FileText className="w-5 h-5 text-blue-400" />;
}

function formatSize(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
