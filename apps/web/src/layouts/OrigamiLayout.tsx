import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Star, Trash2, Puzzle, Settings, LogOut, Send, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/origami-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: FolderOpen, label: 'Files', path: '/files' },
    { icon: Send, label: 'Telegram', path: '/telegram' },
    { icon: Star, label: 'Starred', path: '/starred' },
    { icon: Trash2, label: 'Trash', path: '/trash' },
    { icon: Puzzle, label: 'Plugins', path: '/plugins' },
];

export function OrigamiLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [navOpen, setNavOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="origami-mode min-h-screen">
            {/* Floating Navigation Button */}
            <button
                onClick={() => setNavOpen(true)}
                className="fixed top-6 left-6 z-40 w-12 h-12 bg-[var(--origami-paper)] border border-[var(--origami-crease)] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
                <Menu className="w-5 h-5 text-[var(--origami-text)]" />
            </button>

            {/* User Badge - Top Right */}
            <div className="fixed top-6 right-6 z-40 flex items-center gap-3">
                {user && (
                    <div className="bg-[var(--origami-paper)] border border-[var(--origami-crease)] px-4 py-2 rounded-full shadow-md">
                        <span className="text-sm font-medium text-[var(--origami-text)]">{user.firstName || user.username}</span>
                    </div>
                )}
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="w-10 h-10 bg-[var(--origami-paper)] border border-[var(--origami-crease)] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                >
                    <Settings className="w-4 h-4 text-[var(--origami-text-dim)]" />
                </button>
            </div>

            {/* Floating Navigation Panel */}
            <AnimatePresence>
                {navOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                            onClick={() => setNavOpen(false)}
                        />

                        {/* Nav Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className="fixed top-6 left-6 z-50 bg-[var(--origami-paper)] border border-[var(--origami-crease)] rounded-2xl shadow-2xl p-2 min-w-[280px]"
                        >
                            {/* Close Button */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--origami-crease)]">
                                <span className="text-lg font-light tracking-widest uppercase text-[var(--origami-terracotta)]">TAAS</span>
                                <button onClick={() => setNavOpen(false)} className="p-1 hover:bg-[var(--origami-bg)] rounded">
                                    <X className="w-5 h-5 text-[var(--origami-text-dim)]" />
                                </button>
                            </div>

                            {/* Nav Items */}
                            <div className="py-2">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path ||
                                        (item.path !== '/' && location.pathname.startsWith(item.path));
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setNavOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-1 transition-all ${isActive
                                                    ? 'bg-[var(--origami-terracotta)] text-white'
                                                    : 'text-[var(--origami-text-dim)] hover:bg-[var(--origami-bg)]'
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Logout */}
                            <div className="border-t border-[var(--origami-crease)] pt-2 mt-2">
                                <button
                                    onClick={() => { logout(); setNavOpen(false); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl mx-1 w-full text-left text-[var(--origami-error)] hover:bg-red-50 transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content - Full width with padding for floating elements */}
            <main className="px-6 py-6 pt-24">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
