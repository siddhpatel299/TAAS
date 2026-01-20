import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/pixel-theme.css';

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

export function PixelLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="pixel-mode">
            <header className="pixel-header">
                <div className="pixel-logo">PIXEL DRIVE</div>

                <nav className="pixel-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`pixel-nav-link ${isActive ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4">
                    <button onClick={() => setSettingsOpen(true)} className="pixel-btn pixel-btn-ghost">Config</button>
                    <button onClick={logout} className="pixel-btn">Quit</button>
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
