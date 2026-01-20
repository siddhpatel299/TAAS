import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Star, Trash2, Puzzle, Settings, LogOut, Send } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/brutalist-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: FolderOpen, label: 'Files', path: '/files' },
    { icon: Send, label: 'Telegram', path: '/telegram' },
    { icon: Star, label: 'Starred', path: '/starred' },
    { icon: Trash2, label: 'Trash', path: '/trash' },
    { icon: Puzzle, label: 'Plugins', path: '/plugins' },
];

export function BrutalistLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="brutalist-mode min-h-screen">
            {/* Header */}
            <header className="brutalist-header">
                <div className="brutalist-logo">TAAS_</div>

                <nav className="brutalist-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`brutalist-nav-link ${isActive ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    {user && (
                        <div className="brutalist-card !p-2 !shadow-none !border-2">
                            <span className="font-semibold text-sm">{user.firstName || user.username}</span>
                        </div>
                    )}
                    <button onClick={() => setSettingsOpen(true)} className="brutalist-btn !p-2">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button onClick={logout} className="brutalist-btn brutalist-btn-primary !p-2">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
