
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useVersion } from '@/contexts/VersionContext';
import {
    Monitor,
    Shield,
    Cpu,
    LogOut,
    Database,
    Grid,
    Zap
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate, useLocation } from 'react-router-dom';
import { CyberButton } from '@/components/war-zone/CyberButton';

interface WarZoneLayoutProps {
    children: React.ReactNode;
}

export function WarZoneLayout({ children }: WarZoneLayoutProps) {
    const { toggleVersion } = useVersion();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: Grid, label: 'DASHBOARD', path: '/' },
        { icon: Database, label: 'ARCHIVES', path: '/files' },
        { icon: Zap, label: 'VORTEX', path: '/starred' },
        { icon: Shield, label: 'SECURE', path: '/vault' },
    ];

    return (
        <div className="min-h-screen bg-black text-cyan-500 font-mono overflow-hidden relative selection:bg-cyan-500/30">
            {/* Background Matrix/Grid Effect */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,3px_100%]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black opacity-80" />
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .03) 25%, rgba(6, 182, 212, .03) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .03) 75%, rgba(6, 182, 212, .03) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .03) 25%, rgba(6, 182, 212, .03) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .03) 75%, rgba(6, 182, 212, .03) 76%, transparent 77%, transparent)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            <div className="relative z-10 flex h-screen">
                {/* Cyber Sidebar */}
                <aside className="w-20 md:w-64 border-r border-cyan-900/50 bg-black/80 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 transition-all duration-300">
                    <div>
                        <div className="flex items-center gap-3 mb-10 overflow-hidden group cursor-pointer" onClick={() => navigate('/')}>
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <div className="absolute inset-0 bg-cyan-500 animate-pulse blur-md rounded-full opacity-50" />
                                <div className="relative w-full h-full border-2 border-cyan-400 rounded-full flex items-center justify-center bg-black">
                                    <Cpu className="w-5 h-5 text-cyan-400" />
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                    T.A.A.S
                                </h1>
                                <p className="text-[10px] text-cyan-700 tracking-[0.2em]">SYSTEM ONLINE</p>
                            </div>
                        </div>

                        <nav className="space-y-4">
                            {menuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent transition-all duration-200 group relative overflow-hidden",
                                        location.pathname === item.path
                                            ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                            : "hover:bg-cyan-950/20 hover:border-cyan-800 text-cyan-700 hover:text-cyan-400"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", location.pathname === item.path && "animate-pulse")} />
                                    <span className="hidden md:block text-sm font-bold tracking-wider">{item.label}</span>
                                    {location.pathname === item.path && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 border border-cyan-900/50 rounded-lg bg-cyan-950/10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-cyan-600 tracking-wider">NETWORK STABLE</span>
                            </div>
                            <div className="h-1 w-full bg-cyan-900/30 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 w-3/4 animate-pulse relative">
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={toggleVersion}
                            className="w-full text-xs text-center text-cyan-800 hover:text-cyan-400 transition-colors uppercase tracking-widest border-t border-cyan-900/30 pt-4"
                        >
                            [ Return to Standard ]
                        </button>

                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center justify-center gap-2 text-red-900 hover:text-red-500 transition-colors py-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden md:inline text-xs font-bold">DISCONNECT</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Viewport */}
                <main className="flex-1 overflow-auto relative p-4 md:p-8">
                    {/* Header Bar */}
                    <header className="flex justify-between items-center mb-8 border-b border-cyan-900/30 pb-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-cyan-100 tracking-tight" style={{ textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>
                                COMMAND CENTER
                            </h2>
                            <div className="flex items-center gap-2 text-cyan-600 text-xs font-mono mt-1">
                                <span>USER: {user?.firstName?.toUpperCase()}</span>
                                <span>//</span>
                                <span>ID: {user?.id?.substring(0, 8)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <CyberButton variant="primary" className="hidden md:flex text-xs py-2 px-4 h-10">
                                <Monitor className="w-4 h-4 mr-2" />
                                SYS_DIAG
                            </CyberButton>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Decorative Overlays */}
            <div className="fixed top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="fixed bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        </div>
    );
}
