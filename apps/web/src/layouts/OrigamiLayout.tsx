import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Star, Trash2, Puzzle, Settings, LogOut, Send } from 'lucide-react';
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
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="origami-mode flex">
            {/* Sidebar */}
            <aside className="origami-sidebar">
                <div className="origami-sidebar-header">
                    <div className="origami-logo">Taas</div>
                </div>

                <nav className="origami-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`origami-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="mt-auto border-t border-[var(--origami-crease)]">
                    {user && (
                        <div className="px-6 py-4">
                            <p className="font-medium text-[var(--origami-text)] truncate">{user.firstName || user.username}</p>
                            <p className="text-sm text-[var(--origami-text-dim)] truncate">{user.email}</p>
                        </div>
                    )}
                    <button onClick={() => setSettingsOpen(true)} className="origami-nav-link w-full">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </button>
                    <button onClick={logout} className="origami-nav-link w-full text-[var(--origami-error)]">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-[260px] p-8 min-h-screen">
                {children}
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
