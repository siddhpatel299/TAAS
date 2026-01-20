import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/glass-theme.css';

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

export function GlassLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="glass-mode">
            {/* Header */}
            <header className="glass-header">
                <div className="glass-logo">TAAS</div>

                <nav className="glass-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`glass-nav-link ${isActive ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    {user && <span className="text-[var(--glass-text-muted)]">{user.firstName || user.username}</span>}
                    <button onClick={() => setSettingsOpen(true)} className="glass-btn">Settings</button>
                    <button onClick={logout} className="glass-btn glass-btn-danger">Logout</button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
