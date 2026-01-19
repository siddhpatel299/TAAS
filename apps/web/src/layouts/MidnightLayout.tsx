import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Star, Trash2, Puzzle, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/midnight-theme.css';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/files', label: 'Files', icon: FolderOpen },
    { path: '/starred', label: 'Starred', icon: Star },
    { path: '/trash', label: 'Trash', icon: Trash2 },
    { path: '/telegram', label: 'Telegram', icon: MessageSquare },
    { path: '/plugins', label: 'Plugins', icon: Puzzle },
];

interface MidnightLayoutProps {
    children: React.ReactNode;
}

export function MidnightLayout({ children }: MidnightLayoutProps) {
    const location = useLocation();
    const { logout, user } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div className="midnight-mode flex">
            {/* Sidebar */}
            <aside className="midnight-sidebar fixed left-0 top-0 h-screen flex flex-col">
                <div className="midnight-logo">TAAS</div>

                <nav className="flex-1">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn("midnight-nav-link", location.pathname === item.path && "active")}
                        >
                            <item.icon />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* User section */}
                <div className="mt-auto pt-4 border-t border-[var(--midnight-border)]">
                    {user && (
                        <div className="px-4 py-3 text-sm">
                            <p className="text-[var(--midnight-text)] font-medium truncate">{user.firstName || user.username}</p>
                            <p className="text-[var(--midnight-text-dim)] text-xs truncate">{user.email}</p>
                        </div>
                    )}
                    <button onClick={() => setSettingsOpen(true)} className="midnight-nav-link w-full">
                        <Settings />
                        Settings
                    </button>
                    <button onClick={handleLogout} className="midnight-nav-link w-full text-[var(--midnight-error)]">
                        <LogOut />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="midnight-main ml-[260px]">
                {children}
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
