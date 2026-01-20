import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/newsprint-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { label: 'Front Page', path: '/' },
    { label: 'Files', path: '/files' },
    { label: 'Telegram', path: '/telegram' },
    { label: 'Starred', path: '/starred' },
    { label: 'Trash', path: '/trash' },
    { label: 'Plugins', path: '/plugins' },
];

export function NewsprintLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="newsprint-mode min-h-screen">
            {/* Masthead */}
            <header className="newsprint-masthead">
                <h1 className="newsprint-masthead-title">The Daily TAAS</h1>
                <p className="newsprint-masthead-tagline">All the Files That's Fit to Store</p>
                <p className="newsprint-masthead-date">{today}</p>
            </header>

            {/* Navigation */}
            <nav className="newsprint-nav">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`newsprint-nav-link ${isActive ? 'active' : ''}`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
                <span className="flex-1" />
                <button onClick={() => setSettingsOpen(true)} className="newsprint-nav-link">Settings</button>
                <button onClick={logout} className="newsprint-nav-link" style={{ color: 'var(--newsprint-red)' }}>Logout</button>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
