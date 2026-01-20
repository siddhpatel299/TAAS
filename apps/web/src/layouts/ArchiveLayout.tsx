import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/archive-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { label: 'Index', path: '/' },
    { label: 'Files', path: '/files' },
    { label: 'Telegram', path: '/telegram' },
    { label: 'Starred', path: '/starred' },
    { label: 'Trash', path: '/trash' },
    { label: 'Plugins', path: '/plugins' },
];

export function ArchiveLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="archive-mode">
            <header className="archive-header">
                <div className="archive-masthead">The Archive</div>

                <nav className="archive-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`archive-nav-link ${isActive ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4">
                    <button onClick={() => setSettingsOpen(true)} className="archive-btn archive-btn-ghost">Settings</button>
                    <button onClick={logout} className="archive-btn">Exit</button>
                </div>
            </header>

            <main className="p-12 max-w-7xl mx-auto relative z-10">
                {children}
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
