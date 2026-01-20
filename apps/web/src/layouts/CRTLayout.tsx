import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/crt-theme.css';

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

export function CRTLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="crt-mode">
            <div className="crt-screen">
                {/* Header */}
                <header className="crt-header">
                    <div className="crt-logo">TAAS://TERMINAL</div>

                    <nav className="crt-nav">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`crt-nav-link ${isActive ? 'active' : ''}`}
                                >
                                    [{item.label}]
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        {user && <span className="text-[var(--crt-green-dim)]">USER:{user.firstName || user.username}</span>}
                        <button onClick={() => setSettingsOpen(true)} className="crt-btn">[CFG]</button>
                        <button onClick={logout} className="crt-btn crt-btn-danger">[EXIT]</button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-4">
                    {children}
                </main>
            </div>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
