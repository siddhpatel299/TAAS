import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Send, Star, Trash2, Puzzle, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import '@/styles/canvas-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: FileText, path: '/files', label: 'Files' },
    { icon: Send, path: '/telegram', label: 'Telegram' },
    { icon: Star, path: '/starred', label: 'Starred' },
    { icon: Trash2, path: '/trash', label: 'Trash' },
    { icon: Puzzle, path: '/plugins', label: 'Plugins' },
];

export function CanvasLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout } = useAuthStore();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="canvas-mode">
            {/* Main Content Area - fills the canvas */}
            <main className="p-8 pb-28 min-h-screen relative z-10">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Dock Navigation */}
            <nav className="canvas-dock">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`canvas-dock-item ${isActive ? 'active' : ''}`}
                            title={item.label}
                        >
                            <Icon className="w-5 h-5" />
                        </Link>
                    );
                })}
                <div className="w-px h-8 bg-[var(--canvas-border)] mx-2" />
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="canvas-dock-item"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
                <button
                    onClick={logout}
                    className="canvas-dock-item"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </nav>

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
