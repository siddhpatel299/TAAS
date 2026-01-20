import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/paper-theme.css';

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

export function PaperLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="paper-mode">
            <header className="paper-header">
                <div className="paper-logo">✏️ Notebook</div>

                <nav className="paper-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`paper-nav-link ${isActive ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4">
                    <button onClick={() => setSettingsOpen(true)} className="paper-btn paper-btn-ghost">Settings</button>
                    <button onClick={logout} className="paper-btn">Logout</button>
                </div>
            </header>

            <main className="p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
