import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FolderOpen, Download, HardDrive, Activity,
    Zap, Shield, Wifi, Cpu, Database, Lock, Server, Box, Map as MapIcon, Terminal, Crosshair
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton, HUDDivider } from '@/components/hud/HUDComponents';
import { useFilesStore } from '@/stores/files.store';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Animated scan line effect
function ScanLine() {
    return (
        <motion.div
            className="absolute left-0 right-0 h-[10px] bg-gradient-to-b from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 opacity-50 z-50 pointer-events-none"
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        />
    );
}

// Tactical Map Background Component
function TacticalMap() {
    return (
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden flex items-center justify-center">
            {/* Abstract World Map Dotted Representation */}
            <svg viewBox="0 0 1000 500" className="w-full h-full text-cyan-500 fill-current">
                <path d="M200,150 Q250,120 300,180 T400,200 T500,150 T600,220 T700,180 T800,250 T850,200" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
                <path d="M220,170 Q270,140 320,200 T420,220 T520,170 T620,240 T720,200 T820,270 T870,220" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <circle cx="300" cy="180" r="10" className="animate-pulse origin-center" />
                <circle cx="700" cy="180" r="6" className="animate-pulse origin-center delay-75" />
                <circle cx="500" cy="150" r="8" className="animate-pulse origin-center delay-150" />
                <circle cx="200" cy="250" r="4" opacity="0.5" />
                <circle cx="800" cy="300" r="5" opacity="0.5" />
            </svg>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,19,28,0.8)_100%)]"></div>
        </div>
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
            }, 30);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timeout);
    }, [text, delay]);

    return (
        <span className="font-mono">
            {displayText}
            {showCursor && <span className="animate-pulse text-cyan-300">_</span>}
        </span>
    );
}

// Advanced Radar pulse effect
function AdvancedRadar() {
    return (
        <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Grid Circles */}
            <div className="absolute inset-0 border border-cyan-500/30 rounded-full" />
            <div className="absolute inset-5 border border-cyan-500/20 rounded-full border-dashed" />
            <div className="absolute inset-10 border border-cyan-500/10 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[1px] h-full bg-cyan-500/20" />
                <div className="h-[1px] w-full bg-cyan-500/20 absolute" />
            </div>

            {/* Sweep */}
            <motion.div
                className="absolute inset-0 rounded-full overflow-hidden"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
                <div className="absolute top-0 right-1/2 w-1/2 h-1/2 bg-[conic-gradient(from_0deg_at_bottom_right,transparent_0deg,rgba(0,255,255,0.4)_90deg)] origin-bottom-right" />
            </motion.div>

            <Crosshair className="w-6 h-6 text-cyan-400 absolute z-10 opacity-70" />

            {/* Targets */}
            <motion.div
                className="absolute w-2.5 h-2.5 bg-cyan-300 rounded-sm shadow-[0_0_10px_rgba(0,255,255,1)]"
                style={{ top: '25%', left: '65%' }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
                className="absolute w-2 h-2 bg-red-400 rounded-full shadow-[0_0_10px_rgba(255,0,0,0.8)]"
                style={{ top: '60%', left: '20%' }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
            />
            <motion.div
                className="absolute w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_10px_rgba(0,255,0,0.8)]"
                style={{ top: '75%', left: '70%' }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
            />
        </div>
    );
}

// Hexagonal stat display
function HexStat({ value, label, icon: Icon, color = 'cyan' }: { value: string | number; label: string; icon: React.ElementType; color?: string }) {
    const colors = {
        cyan: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/40',
        green: 'border-green-500/40 text-green-400 bg-green-950/40 hover:bg-green-900/40',
        purple: 'border-purple-500/40 text-purple-400 bg-purple-950/40 hover:bg-purple-900/40',
        orange: 'border-orange-500/40 text-orange-400 bg-orange-950/40 hover:bg-orange-900/40',
    };

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className={cn(
                "relative flex-1 min-w-[120px] p-4 flex flex-col items-center justify-center",
                "backdrop-blur-md transition-all duration-300",
                "border-y border-x border-dashed",
                colors[color as keyof typeof colors]
            )}
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
            <Icon className="w-6 h-6 mb-2 opacity-80" />
            <span className="text-2xl font-bold font-mono tracking-wider">{value}</span>
            <span className="text-[10px] mt-1 opacity-70 uppercase tracking-widest">{label}</span>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current"></div>
        </motion.div>
    );
}

// Animated bar chart with data labels
function TelemetryBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const maxValue = Math.max(...data.map(d => d.value), 1) * 1.2;

    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <div key={item.label} className="relative">
                    <div className="flex justify-between text-[11px] mb-1 font-mono uppercase tracking-widest">
                        <span className="text-cyan-500 flex items-center gap-2">
                            <span className={cn("w-1.5 h-1.5 rounded-sm", item.color)}></span>
                            {item.label}
                        </span>
                        <span className="text-cyan-200">{item.value} GB</span>
                    </div>
                    <div className="h-4 bg-[#0a1118] border border-cyan-900/50 p-[1px] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wLTRsNCw0TTAsMGw0LDRNMCw0bDQsNCIgc3Ryb2tlPSJyZ2JhKDAsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-30 z-10" />
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / maxValue) * 100}%` }}
                            transition={{ duration: 1.5, delay: index * 0.1, ease: 'easeOut' }}
                            className={cn("h-full relative z-0", item.color)}
                            style={{ boxShadow: '0 0 10px currentColor' }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50"></div>
                        </motion.div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// System status indicator
function SystemStatusLine({ label, status, icon: Icon, details }: { label: string; status: 'online' | 'warning' | 'offline'; icon: React.ElementType, details: string }) {
    const statusColors = {
        online: 'text-green-400 border-green-500/30',
        warning: 'text-yellow-400 border-yellow-500/30',
        offline: 'text-red-400 border-red-500/30',
    };

    return (
        <div className={cn(
            "flex items-center p-3 border-l-2 bg-gradient-to-r from-[rgba(0,0,0,0.5)] to-transparent",
            statusColors[status]
        )}>
            <div className="mr-4 p-2 bg-black/40 border border-current rounded-sm flex items-center justify-center">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-100">{label}</p>
                    <span className={cn("text-[10px] uppercase font-mono px-1 border", statusColors[status])}>
                        {status}
                    </span>
                </div>
                <p className="text-[10px] text-cyan-600/70 font-mono mt-1">{details}</p>
            </div>
        </div>
    );
}

export function HUDDashboardPage() {
    const { files, setFiles } = useFilesStore();
    const [totalSize, setTotalSize] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [systemMetrics, setSystemMetrics] = useState({ cpu: 42, ram: 65, net: 28 });

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

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setSystemMetrics(prev => ({
                cpu: Math.min(100, Math.max(10, prev.cpu + (Math.random() - 0.5) * 15)),
                ram: Math.min(100, Math.max(40, prev.ram + (Math.random() - 0.5) * 5)),
                net: Math.min(100, Math.max(5, prev.net + (Math.random() - 0.5) * 25)),
            }));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const totalFiles = files.length > 0 ? files.length : 1420; // Fake fallback for preview
    const tSize = totalSize > 0 ? formatBytes(totalSize) : '1.2 TB';

    const storageData = [
        { label: 'Sys.Data', value: 450, color: 'bg-cyan-500' },
        { label: 'Archives', value: 320, color: 'bg-blue-500' },
        { label: 'Media.Bin', value: 280, color: 'bg-indigo-500' },
        { label: 'Temp.Cache', value: 150, color: 'bg-purple-500' },
    ];

    return (
        <HUDLayout>
            {/* Header Telemetry */}
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div className="relative pl-6 border-l-2 border-cyan-500">
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-600 tracking-[0.2em] uppercase font-tech">
                        <TypewriterText text="GLOBAL_COMMAND" delay={100} />
                    </h1>
                    <div className="flex items-center gap-4 mt-2 font-mono text-xs">
                        <span className="text-cyan-500/70 border border-cyan-500/30 px-2 py-0.5 bg-cyan-500/10">SYS_VER: 10.4.2</span>
                        <span className="text-green-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]" />
                            UPLINK_SECURE
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="text-3xl md:text-4xl font-mono text-cyan-400 tracking-widest" style={{ textShadow: '0 0 15px rgba(0, 255, 255, 0.4)' }}>
                        {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="text-cyan-500/50 text-xl">.{currentTime.getMilliseconds().toString().padStart(3, '0').slice(0, 2)}</span>
                    </div>
                    <div className="text-xs text-cyan-600 font-mono tracking-[0.3em] uppercase mt-1 flex gap-2">
                        <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span>{currentTime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}</span>
                        <span className="text-cyan-500/40">LOC:47.60°N</span>
                    </div>
                </div>
            </div>

            <HUDDivider className="mb-6 opacity-30" />

            {/* Main Tactical Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Panel: Systems & Telemetry */}
                <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <HUDPanel className="p-5">
                        <ScanLine />
                        <div className="flex items-center justify-between mb-5 border-b border-cyan-500/20 pb-2">
                            <h3 className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] font-mono flex items-center gap-2">
                                <Shield className="w-3 h-3" /> SYS_DIAGNOSTICS
                            </h3>
                            <span className="text-[9px] text-cyan-500/50 font-mono">AUTO_SCAN: ON</span>
                        </div>

                        <div className="space-y-1">
                            <SystemStatusLine label="Firewall Core" status="online" icon={Lock} details="DEFCON 5 / 0 THREATS" />
                            <SystemStatusLine label="Global Node" status="online" icon={Server} details="LATENCY: 12ms / RT: 44ms" />
                            <SystemStatusLine label="Sat Uplink" status="warning" icon={Wifi} details="SIGNAL DEGREDATION 14%" />
                            <SystemStatusLine label="Main Array" status="offline" icon={Database} details="ERR: SECTOR 7G OFFLINE" />
                        </div>
                    </HUDPanel>

                    <HUDPanel className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-5 border-b border-cyan-500/20 pb-2">
                            <h3 className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] font-mono flex items-center gap-2">
                                <Terminal className="w-3 h-3" /> ACTION_QUEUE
                            </h3>
                        </div>
                        <div className="space-y-2 font-mono text-[10px] text-cyan-300/70 overflow-hidden flex-1 relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--hud-panel)] z-10 pointer-events-none"></div>
                            <p className="flex justify-between"><span className="text-green-400">[OK]</span> <span>AUTH_TOKEN_GEN......</span> <span>0.004s</span></p>
                            <p className="flex justify-between"><span className="text-cyan-400">[INFO]</span> <span>SYNC_MODULE_3.......</span> <span>1.240s</span></p>
                            <p className="flex justify-between"><span className="text-yellow-400">[WARN]</span> <span>CACHE_MISS_RATE_HIGH</span> <span>---</span></p>
                            <p className="flex justify-between"><span className="text-green-400">[OK]</span> <span>PKG_DEPLOY_SUCCESS..</span> <span>2.100s</span></p>
                            <p className="flex justify-between"><span className="text-cyan-400">[INFO]</span> <span>USER_SESSION_START..</span> <span>0.100s</span></p>
                            <p className="flex justify-between opacity-50"><span className="text-green-400">[OK]</span> <span>DB_INDEX_REBUILD....</span> <span>45.2s</span></p>
                        </div>
                        <HUDButton variant="primary" className="w-full mt-4 text-[10px] py-2">
                            <Cpu className="w-3 h-3 mr-2 inline" /> EXECUTE CYCLE
                        </HUDButton>
                    </HUDPanel>
                </div>

                {/* Center Panel: Radar & Primary Visualization */}
                <div className="md:col-span-12 lg:col-span-6 flex flex-col gap-6">
                    <HUDPanel glow className="p-0 overflow-hidden relative min-h-[400px] flex flex-col border-[var(--hud-accent)] bg-black/40">
                        <TacticalMap />
                        <ScanLine />

                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
                            <span className="text-[10px] text-red-400 font-mono tracking-widest bg-red-500/10 px-2 py-0.5 border border-red-500/20">LIVE_TRACKING</span>
                        </div>

                        <div className="absolute top-4 right-4 z-10 text-right">
                            <div className="text-[10px] text-cyan-500 font-mono tracking-widest">GLOBAL_NETWORK_MAP</div>
                            <div className="text-[8px] text-cyan-600 font-mono">GRID: OMEGA-4</div>
                        </div>

                        <div className="flex-1 flex items-center justify-center relative z-10 mt-8 mb-4">
                            <div className="relative">
                                {/* Decorative tech brackets around radar */}
                                <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50"></div>
                                <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50"></div>
                                <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50"></div>
                                <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50"></div>

                                <AdvancedRadar />
                            </div>
                        </div>

                        <div className="p-4 bg-black/60 border-t border-cyan-500/30 backdrop-blur-md z-10 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-[10px] text-cyan-500/80 mb-1 font-mono tracking-widest">CPU_CORE</div>
                                <div className="text-lg text-cyan-300 font-mono">{Math.round(systemMetrics.cpu)}%</div>
                                <div className="w-full h-1 bg-cyan-900/50 mt-1"><div className="h-full bg-cyan-400" style={{ width: `${systemMetrics.cpu}%` }}></div></div>
                            </div>
                            <div className="text-center border-l border-r border-cyan-500/20 px-2">
                                <div className="text-[10px] text-cyan-500/80 mb-1 font-mono tracking-widest">MEMORY_ALLOC</div>
                                <div className="text-lg text-cyan-300 font-mono">{Math.round(systemMetrics.ram)}%</div>
                                <div className="w-full h-1 bg-cyan-900/50 mt-1"><div className="h-full bg-purple-400" style={{ width: `${systemMetrics.ram}%` }}></div></div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] text-cyan-500/80 mb-1 font-mono tracking-widest">NET_TRAFFIC</div>
                                <div className="text-lg text-cyan-300 font-mono">{Math.round(systemMetrics.net)} TB/s</div>
                                <div className="w-full h-1 bg-cyan-900/50 mt-1"><div className="h-full bg-green-400" style={{ width: `${systemMetrics.net}%` }}></div></div>
                            </div>
                        </div>
                    </HUDPanel>

                    {/* Quick Stat Hexes */}
                    <div className="flex gap-4">
                        <HexStat value={totalFiles} label="Total Assets" icon={Box} color="cyan" />
                        <HexStat value={tSize} label="Data Volume" icon={Database} color="purple" />
                        <HexStat value="89.2k" label="Active Req" icon={Activity} color="green" />
                    </div>
                </div>

                {/* Right Panel: Storage & Modules */}
                <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <HUDPanel className="p-5">
                        <div className="flex items-center justify-between mb-5 border-b border-cyan-500/20 pb-2">
                            <h3 className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] font-mono flex items-center gap-2">
                                <HardDrive className="w-3 h-3" /> DATABANK_USAGE
                            </h3>
                            <span className="text-[9px] text-cyan-500/50 font-mono">CAP: 2.0 TB</span>
                        </div>
                        <TelemetryBarChart data={storageData} />
                    </HUDPanel>

                    <HUDPanel className="p-5 flex-1">
                        <div className="flex items-center justify-between mb-5 border-b border-cyan-500/20 pb-2">
                            <h3 className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] font-mono flex items-center gap-2">
                                <Box className="w-3 h-3" /> MODULE_ACCESS
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: FolderOpen, label: 'FILES', to: '/files', color: 'text-cyan-400' },
                                { icon: MapIcon, label: 'MAPS', to: '#', color: 'text-emerald-400' },
                                { icon: Download, label: 'IMPORT', to: '/telegram', color: 'text-blue-400' },
                                { icon: Zap, label: 'PLUGINS', to: '/plugins', color: 'text-violet-400' },
                            ].map((item, i) => (
                                <Link key={i} to={item.to}>
                                    <div className="border border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-900/40 p-3 flex flex-col items-center justify-center gap-2 transition-colors group cursor-pointer" style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}>
                                        <item.icon className={cn("w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all", item.color)} />
                                        <span className="text-[9px] font-bold font-mono tracking-widest text-cyan-200">{item.label}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </HUDPanel>
                </div>

            </div>
        </HUDLayout>
    );
}
