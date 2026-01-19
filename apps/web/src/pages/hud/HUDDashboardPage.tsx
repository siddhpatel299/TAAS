import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderOpen,
    Upload,
    Download,

    TrendingUp,
    HardDrive,
    Activity,
    Zap,
    Star,
    Shield,
    Wifi,
    Cpu,
    Database,
    Globe,
    Lock,
    AlertTriangle,
    CheckCircle,
    Radio,
    Target,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton, HUDProgressRing } from '@/components/hud/HUDComponents';
import { useFilesStore } from '@/stores/files.store';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Animated scan line effect
function ScanLine() {
    return (
        <motion.div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
            initial={{ top: 0 }}
            animate={{ top: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
    );
}

// Animated typing text
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
    const [displayText, setDisplayText] = useState('');
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    setDisplayText(text.slice(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => setShowCursor(false), 1000);
                }
            }, 50);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timeout);
    }, [text, delay]);

    return (
        <span className="font-mono">
            {displayText}
            {showCursor && <span className="animate-pulse">_</span>}
        </span>
    );
}

// Radar pulse effect
function RadarPulse() {
    return (
        <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full" />
            <div className="absolute inset-4 border border-cyan-500/20 rounded-full" />
            <div className="absolute inset-8 border border-cyan-500/10 rounded-full" />
            <motion.div
                className="absolute inset-0 border-2 border-cyan-400 rounded-full"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
                className="absolute inset-0"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
                <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent origin-left -translate-y-1/2" />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Radio className="w-6 h-6 text-cyan-400" />
            </div>
            {/* Blips */}
            <motion.div
                className="absolute w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                style={{ top: '20%', left: '60%' }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
                className="absolute w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_rgba(0,255,0,0.8)]"
                style={{ top: '70%', left: '30%' }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
            />
        </div>
    );
}

// Hexagonal stat display
function HexStat({ value, label, icon: Icon, color = 'cyan' }: { value: string | number; label: string; icon: React.ElementType; color?: string }) {
    const colors = {
        cyan: 'border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.3)]',
        green: 'border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(0,255,0,0.3)]',
        purple: 'border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(128,0,255,0.3)]',
        orange: 'border-orange-500/50 text-orange-400 shadow-[0_0_20px_rgba(255,128,0,0.3)]',
    };

    return (
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={cn(
                "relative w-28 h-28 flex flex-col items-center justify-center",
                "bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm",
                "border-2 rounded-xl transform rotate-0",
                colors[color as keyof typeof colors]
            )}
        >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xl font-bold font-mono">{value}</span>
            <span className="text-xs opacity-70 uppercase tracking-wider">{label}</span>
        </motion.div>
    );
}

// Animated bar chart
function AnimatedBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-cyan-400">{item.label}</span>
                        <span className="text-cyan-200 font-mono">{item.value}</span>
                    </div>
                    <div className="h-2 bg-cyan-900/30 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / maxValue) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
                            className={cn("h-full rounded-full", item.color)}
                            style={{ boxShadow: '0 0 10px currentColor' }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// System status indicator
function SystemStatus({ label, status, icon: Icon }: { label: string; status: 'online' | 'warning' | 'offline'; icon: React.ElementType }) {
    const statusColors = {
        online: 'text-green-400 bg-green-500/20 border-green-500/50',
        warning: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50',
        offline: 'text-red-400 bg-red-500/20 border-red-500/50',
    };

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm",
                statusColors[status]
            )}
        >
            <Icon className="w-5 h-5" />
            <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
            </div>
            <motion.div
                className={cn("w-2 h-2 rounded-full", status === 'online' ? 'bg-green-400' : status === 'warning' ? 'bg-yellow-400' : 'bg-red-400')}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs uppercase font-mono">{status}</span>
        </motion.div>
    );
}

// Activity feed with animations
function ActivityFeed({ items }: { items: { id: string; text: string; time: string; type: 'upload' | 'download' | 'system' }[] }) {
    return (
        <div className="space-y-2 max-h-48 overflow-hidden">
            <AnimatePresence>
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            item.type === 'upload' ? 'bg-green-500/20 text-green-400' :
                                item.type === 'download' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-cyan-500/20 text-cyan-400'
                        )}>
                            {item.type === 'upload' ? <Upload className="w-4 h-4" /> :
                                item.type === 'download' ? <Download className="w-4 h-4" /> :
                                    <Activity className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-cyan-200 truncate">{item.text}</p>
                            <p className="text-xs text-cyan-600">{item.time}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export function HUDDashboardPage() {
    const { files, setFiles } = useFilesStore();
    const [totalSize, setTotalSize] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [systemLoad, setSystemLoad] = useState(42);

    useEffect(() => {
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
        const size = files.reduce((acc, f) => acc + (f.size || 0), 0);
        setTotalSize(size);
    }, [files]);

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Simulate varying system load
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemLoad(prev => Math.min(100, Math.max(20, prev + (Math.random() - 0.5) * 10)));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const totalFiles = files.length;

    // Mock activity data
    const activityItems = [
        { id: '1', text: 'System initialized', time: '2 min ago', type: 'system' as const },
        { id: '2', text: 'Connection secured', time: '5 min ago', type: 'system' as const },
        { id: '3', text: 'Storage online', time: '10 min ago', type: 'upload' as const },
    ];

    const storageData = [
        { label: 'Documents', value: 45, color: 'bg-blue-500' },
        { label: 'Images', value: 32, color: 'bg-purple-500' },
        { label: 'Videos', value: 68, color: 'bg-pink-500' },
        { label: 'Audio', value: 21, color: 'bg-green-500' },
        { label: 'Archives', value: 15, color: 'bg-yellow-500' },
    ];

    return (
        <HUDLayout>
            {/* Animated Header */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 tracking-widest">
                                <TypewriterText text="COMMAND CENTER" delay={300} />
                            </h1>
                            <p className="text-cyan-600/70 mt-1 font-mono text-sm">
                                SYSTEM STATUS: <span className="text-green-400">OPERATIONAL</span>
                            </p>
                        </motion.div>
                    </div>

                    {/* Live Clock */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="text-right"
                    >
                        <div className="text-3xl font-mono text-cyan-400" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                        </div>
                        <div className="text-sm text-cyan-600 font-mono">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    </motion.div>
                </div>

                {/* Animated divider */}
                <motion.div
                    className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />
            </motion.div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column - Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Hex Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <HUDPanel className="p-6 relative overflow-hidden" glow>
                            <ScanLine />
                            <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Core Metrics
                            </h3>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <HexStat value={totalFiles} label="Files" icon={FolderOpen} color="cyan" />
                                <HexStat value={formatBytes(totalSize)} label="Storage" icon={Database} color="purple" />
                            </div>
                        </HUDPanel>
                    </motion.div>

                    {/* System Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <HUDPanel className="p-6">
                            <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                System Status
                            </h3>
                            <div className="space-y-3">
                                <SystemStatus label="Network" status="online" icon={Wifi} />
                                <SystemStatus label="Storage" status="online" icon={HardDrive} />
                                <SystemStatus label="Security" status="online" icon={Lock} />
                                <SystemStatus label="API" status="online" icon={Globe} />
                            </div>
                        </HUDPanel>
                    </motion.div>
                </div>

                {/* Center Column - Main Display */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Central Radar/Monitor */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                    >
                        <HUDPanel className="p-8 relative overflow-hidden" glow>
                            <ScanLine />
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider flex items-center gap-2">
                                    <Cpu className="w-4 h-4" />
                                    Network Monitor
                                </h3>
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-green-400"
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                    <span className="text-xs text-green-400 font-mono">SYNCED</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-8">
                                <RadarPulse />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <HUDProgressRing
                                            value={systemLoad}
                                            size={80}
                                            strokeWidth={6}
                                            label={`${Math.round(systemLoad)}%`}
                                            sublabel="CPU"
                                        />
                                        <HUDProgressRing
                                            value={65}
                                            size={80}
                                            strokeWidth={6}
                                            label="65%"
                                            sublabel="RAM"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-cyan-600 font-mono">UPTIME: 99.9%</p>
                                        <p className="text-xs text-cyan-700 font-mono mt-1">LATENCY: 12ms</p>
                                    </div>
                                </div>
                            </div>
                        </HUDPanel>
                    </motion.div>

                    {/* Storage Analysis */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <HUDPanel className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Storage Analysis
                                </h3>
                                <Link to="/files" className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors font-mono">
                                    VIEW ALL →
                                </Link>
                            </div>
                            <AnimatedBarChart data={storageData} />
                        </HUDPanel>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { icon: FolderOpen, label: 'Files', to: '/files', color: 'cyan' },
                                { icon: Star, label: 'Starred', to: '/starred', color: 'yellow' },
                                { icon: Download, label: 'Import', to: '/telegram', color: 'blue' },
                                { icon: Zap, label: 'Plugins', to: '/plugins', color: 'purple' },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.7 + index * 0.1, type: 'spring' }}
                                >
                                    <Link to={item.to}>
                                        <HUDPanel hover className="p-4 text-center group cursor-pointer">
                                            <motion.div
                                                whileHover={{ scale: 1.2, rotate: 5 }}
                                                transition={{ type: 'spring', stiffness: 400 }}
                                            >
                                                <item.icon className={cn("w-8 h-8 mx-auto mb-2", `text-${item.color}-400`)} />
                                            </motion.div>
                                            <p className="text-sm text-cyan-300 group-hover:text-cyan-200 transition-colors">{item.label}</p>
                                        </HUDPanel>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column - Activity */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <HUDPanel className="p-6 relative overflow-hidden">
                            <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Activity Log
                            </h3>
                            <ActivityFeed items={activityItems} />
                        </HUDPanel>
                    </motion.div>

                    {/* Alerts */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <HUDPanel className="p-6">
                            <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Alerts
                            </h3>
                            <div className="space-y-3">
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                                >
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <div>
                                        <p className="text-sm text-green-300">All systems nominal</p>
                                        <p className="text-xs text-green-600">No issues detected</p>
                                    </div>
                                </motion.div>
                            </div>
                        </HUDPanel>
                    </motion.div>

                    {/* Upload Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <HUDButton variant="primary" className="w-full py-4 text-lg">
                                <Upload className="w-5 h-5 mr-2" />
                                UPLOAD FILES
                            </HUDButton>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </HUDLayout>
    );
}
