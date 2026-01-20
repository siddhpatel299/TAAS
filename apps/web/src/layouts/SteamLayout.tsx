import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/steam-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Archives', path: '/files' },
    { label: 'Telegram', path: '/telegram' },
    { label: 'Favorites', path: '/starred' },
    { label: 'Disposal', path: '/trash' },
    { label: 'Machinery', path: '/plugins' },
];

export function SteamLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="steam-mode">
            <header className="steam-header">
                <div className="steam-logo">⚙ Apparatus</div>

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
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4">
                    <button onClick={() => setSettingsOpen(true)} className="steam-btn">Settings</button>
                    <button onClick={logout} className="steam-btn steam-btn-danger">Disengage</button>
                </div>
            </header>

            <main className="p-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
