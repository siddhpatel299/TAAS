import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutGrid,
    FolderOpen,
    Star,
    Trash2,
    Settings,
    LogOut,
    MessageSquare,
    Puzzle,
    Briefcase,
    CheckSquare,
    Zap,
    Send,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { usePluginsStore } from '@/stores/plugins.store';
import { useVersion } from '@/contexts/VersionContext';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';

interface HUDSidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

const mainNavItems = [
    { path: '/', label: 'Dashboard', icon: LayoutGrid },
    { path: '/files', label: 'Files', icon: FolderOpen },
    { path: '/telegram', label: 'Telegram', icon: MessageSquare },
    { path: '/starred', label: 'Favorites', icon: Star },
    { path: '/trash', label: 'Trash', icon: Trash2 },
];

const pluginIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'job-tracker': Briefcase,
    'todo-lists': CheckSquare,
};

export function HUDSidebar({ collapsed = false, onToggle }: HUDSidebarProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const { enabledPlugins } = usePluginsStore();
    const { cycleVersion } = useVersion();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const enabledPluginItems = enabledPlugins
        .filter(p => p.enabled)
        .map(p => ({
            path: `/plugins/${p.id}`,
            label: p.id === 'job-tracker' ? 'Job Tracker' : p.name || p.id,
            icon: pluginIcons[p.id] || Puzzle,
        }));

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full hud-sidebar flex flex-col z-50 transition-all duration-300",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header / Logo */}
            <div className="p-4 flex items-center gap-3 border-b border-[var(--hud-border)]">
                <Link to="/" className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-10 h-10 rounded-sm bg-gradient-to-br from-cyan-900/80 to-slate-900 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.3)] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,255,255,0.4) 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
                        <Send className="w-5 h-5 text-cyan-400 relative z-10" />
                    </motion.div>
                    {
                        !collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-lg font-bold text-cyan-400 tracking-wider"
                                style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}
                            >
                                TAAS
                            </motion.span>
                        )
                    }
                </Link >

                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="ml-auto p-2 text-cyan-500/70 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                )
                }
            </div >

            {/* Navigation */}
            < nav className="flex-1 p-3 space-y-1 overflow-y-auto" >
                {!collapsed && (
                    <div className="px-3 py-2 mb-2 flex items-center gap-2">
                        <div className="w-1 h-3 bg-cyan-500/70"></div>
                        <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] opacity-80">
                            System Navigation
                        </p>
                    </div>
                )}

                {
                    mainNavItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path === '/' && location.pathname.startsWith('/?'));

                        return (
                            <Link key={item.path} to={item.path}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "hud-sidebar-item",
                                        isActive && "active",
                                        collapsed && "justify-center px-0"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5 flex-shrink-0",
                                        isActive ? "text-cyan-400" : "text-cyan-600/70"
                                    )} />
                                    {!collapsed && (
                                        <span className="truncate">{item.label}</span>
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })
                }

                {/* Plugins Section */}
                {
                    enabledPluginItems.length > 0 && (
                        <>
                            <div className="hud-divider my-3" />
                            {!collapsed && (
                                <div className="px-3 py-2 mb-2 flex items-center gap-2">
                                    <div className="w-1 h-3 bg-cyan-500/70"></div>
                                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] opacity-80">
                                        Active Modules
                                    </p>
                                </div>
                            )}

                            {enabledPluginItems.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                const Icon = item.icon;

                                return (
                                    <Link key={item.path} to={item.path}>
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={cn(
                                                "hud-sidebar-item",
                                                isActive && "active",
                                                collapsed && "justify-center px-0"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "w-5 h-5 flex-shrink-0",
                                                isActive ? "text-cyan-400" : "text-cyan-600/70"
                                            )} />
                                            {!collapsed && (
                                                <span className="truncate">{item.label}</span>
                                            )}
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </>
                    )
                }

                {/* Plugins Store */}
                <Link to="/plugins">
                    <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "hud-sidebar-item",
                            location.pathname === '/plugins' && "active",
                            collapsed && "justify-center px-0"
                        )}
                    >
                        <Puzzle className={cn(
                            "w-5 h-5 flex-shrink-0",
                            location.pathname === '/plugins' ? "text-cyan-400" : "text-cyan-600/70"
                        )} />
                        {!collapsed && <span>Plugins Store</span>}
                    </motion.div>
                </Link>
            </nav >

            {/* Footer */}
            < div className="p-3 border-t border-[var(--hud-border)] space-y-1" >
                {/* Theme Toggle */}
                < motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cycleVersion}
                    className={
                        cn(
                            "w-full hud-sidebar-item text-cyan-500",
                            collapsed && "justify-center px-0"
                        )}
                >
                    <Zap className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>Switch Theme</span>}
                </motion.button >

                {/* Settings */}
                < motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSettingsOpen(true)}
                    className={
                        cn(
                            "w-full hud-sidebar-item",
                            collapsed && "justify-center px-0"
                        )}
                >
                    <Settings className="w-5 h-5 flex-shrink-0 text-cyan-600/70" />
                    {!collapsed && <span>Settings</span>}
                </motion.button >

                {/* Logout */}
                < motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => logout()}
                    className={
                        cn(
                            "w-full hud-sidebar-item hover:!text-red-400 hover:!bg-red-500/10",
                            collapsed && "justify-center px-0"
                        )}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0 text-cyan-600/70" />
                    {!collapsed && <span>Logout</span>}
                </motion.button >
            </div >

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </aside >
    );
}
