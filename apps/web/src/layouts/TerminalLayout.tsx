import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Star, MessageSquare, Puzzle, Briefcase, LogOut, Settings } from 'lucide-react';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import { cn } from '@/lib/utils';
import '@/styles/terminal-theme.css';

interface TerminalLayoutProps {
    children: ReactNode;
}

const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/files', label: 'Files', icon: FileText },
    { path: '/starred', label: 'Starred', icon: Star },
    { path: '/telegram', label: 'Telegram', icon: MessageSquare },
    { path: '/plugins', label: 'Plugins', icon: Puzzle },
    { path: '/plugins/job-tracker', label: 'Jobs', icon: Briefcase },
];

export function TerminalLayout({ children }: TerminalLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <>
            <div className="terminal-mode min-h-screen pb-6">
                {/* Top Bar */}
                <header className="terminal-bar">
                    <div className="terminal-bar-content">
                        {/* Brand */}
                        <div className="terminal-brand">TAAS TERMINAL</div>

                        {/* Navigation */}
                        <nav className="terminal-nav">
                            {navLinks.map(({ path, label, icon: Icon }) => {
                                const isActive = location.pathname === path ||
                                    (path !== '/' && location.pathname.startsWith(path));
                                return (
                                    <Link
                                        key={path}
                                        to={path}
                                        className={cn("terminal-nav-link", isActive && "active")}
                                    >
                                        <Icon className="icon" />
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setSettingsOpen(true)}
                                className="terminal-btn"
                            >
                                <Settings className="w-3 h-3 mr-1" />
                                Cfg
                            </button>
                            <button onClick={handleLogout} className="terminal-btn terminal-btn-danger">
                                <LogOut className="w-3 h-3 mr-1" />
                                Exit
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="px-4 py-4">
                    {children}
                </main>

                {/* Status Bar */}
                <div className="terminal-status-bar">
                    <div className="terminal-status-item">
                        <span className="text-[var(--terminal-green)]">●</span>
                        <span>CONNECTED</span>
                    </div>
                    <div className="terminal-status-item">
                        <span>v1.0.0</span>
                    </div>
                    <div className="terminal-status-item">
                        <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            <AccountSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </>
    );
}
