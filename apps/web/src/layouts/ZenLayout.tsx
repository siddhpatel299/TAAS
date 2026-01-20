import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/zen-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Files', path: '/files' },
    { label: 'Telegram', path: '/telegram' },
    { label: 'Starred', path: '/starred' },
    { label: 'Trash', path: '/trash' },
    { label: 'Plugins', path: '/plugins' },
];

export function ZenLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="zen-mode">
            <header className="zen-header">
                <div className="zen-logo">Zen</div>

                <nav className="zen-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`zen-nav-link ${isActive ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-8">
                    <button onClick={() => setSettingsOpen(true)} className="zen-nav-link">Settings</button>
                    <button onClick={logout} className="zen-nav-link">Logout</button>
                </div>
            </header>

            <main style={{ padding: '64px 96px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
