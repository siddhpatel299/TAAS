import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import {
    LayoutDashboard,
    Archive,
    MessageSquare,
    Star,
    Trash2,
    Cpu,
    Settings,
    LogOut,
    Command
} from 'lucide-react';
import '@/styles/steam-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Archives', path: '/files', icon: <Archive className="w-4 h-4" /> },
    { label: 'Telegram', path: '/telegram', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Favorites', path: '/starred', icon: <Star className="w-4 h-4" /> },
    { label: 'Trash', path: '/trash', icon: <Trash2 className="w-4 h-4" /> },
    { label: 'Plugins', path: '/plugins', icon: <Cpu className="w-4 h-4" /> },
];

export function SteamLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="steam-mode">
            <header className="steam-header">
                <div className="steam-logo">
                    <Command className="w-5 h-5 text-indigo-500" />
                    <span>Nexus Pro</span>
                </div>

                <nav className="steam-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`steam-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <span className="mr-2 opacity-70">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="steam-btn"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={logout}
                        className="steam-btn steam-btn-danger"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="p-6 relative z-10">
                <div className="max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
