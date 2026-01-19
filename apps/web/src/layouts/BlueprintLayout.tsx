import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Star, Trash2, Puzzle, Settings, LogOut, Send, Grid3X3 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/blueprint-theme.css';

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

export function BlueprintLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="blueprint-mode flex">
            {/* Sidebar */}
            <aside className="blueprint-sidebar">
                <div className="blueprint-sidebar-header">
                    <div className="blueprint-logo">
                        <Grid3X3 className="w-5 h-5" />
                        TAAS
                    </div>
                </div>

                <nav className="blueprint-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`blueprint-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="mt-auto border-t border-[var(--blueprint-line-dim)]">
                    {user && (
                        <div className="px-6 py-4">
                            <p className="text-xs uppercase tracking-wider text-[var(--blueprint-cyan)] truncate">{user.firstName || user.username}</p>
                            <p className="text-xs text-[var(--blueprint-text-muted)] truncate">{user.email}</p>
                        </div>
                    )}
                    <button onClick={() => setSettingsOpen(true)} className="blueprint-nav-link w-full">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </button>
                    <button onClick={logout} className="blueprint-nav-link w-full text-[var(--blueprint-error)]">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-[260px] p-6 min-h-screen">
                {children}
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
