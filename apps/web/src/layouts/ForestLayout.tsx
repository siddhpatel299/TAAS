import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, FileText, Star, MessageSquare, Puzzle, Briefcase, LogOut, Settings, Trees } from 'lucide-react';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/forest-theme.css';

interface ForestLayoutProps {
    children: ReactNode;
}

const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/files', label: 'Files', icon: FileText },
    { path: '/starred', label: 'Starred', icon: Star },
    { path: '/telegram', label: 'Telegram', icon: MessageSquare },
    { path: '/plugins', label: 'Plugins', icon: Puzzle },
    { path: '/plugins/job-tracker', label: 'Jobs', icon: Briefcase },
];

export function ForestLayout({ children }: ForestLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <>
            <div className="min-h-screen bg-[var(--forest-cream)]">
                {/* Top Navigation */}
                <motion.nav
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[rgba(74,124,89,0.1)] shadow-sm"
                >
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex items-center justify-between h-16">
                            {/* Brand */}
                            <Link to="/" className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: [0, 3, -3, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <Trees className="w-8 h-8 text-[var(--forest-leaf)]" />
                                </motion.div>
                                <span className="text-xl font-bold text-[var(--forest-moss)]">TAAS</span>
                            </Link>

                            {/* Nav Links */}
                            <div className="flex items-center gap-2">
                                {navLinks.map(({ path, label, icon: Icon }) => {
                                    const isActive = location.pathname === path ||
                                        (path !== '/' && location.pathname.startsWith(path));
                                    return (
                                        <Link
                                            key={path}
                                            to={path}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${isActive
                                                ? 'bg-gradient-to-r from-[#3d8b4d] to-[#5ab06a] text-white border-transparent shadow-md'
                                                : 'bg-[rgba(61,139,77,0.08)] text-[var(--forest-moss)] border-[rgba(61,139,77,0.2)] hover:bg-[rgba(61,139,77,0.15)] hover:border-[rgba(61,139,77,0.3)]'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="hidden md:inline">{label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSettingsOpen(true)}
                                    className="p-2 rounded-lg text-[var(--forest-wood)] hover:bg-[rgba(74,124,89,0.1)] transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg text-[var(--forest-wood)] hover:bg-[rgba(196,92,92,0.1)] hover:text-[var(--forest-danger)] transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-6 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            <AccountSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </>
    );
}
