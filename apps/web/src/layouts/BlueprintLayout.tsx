import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Home, FolderOpen, Star, Trash2, Puzzle, Send, Command } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import { CommandPalette } from '@/components/blueprint/CommandPalette';
import '@/styles/blueprint-theme.css';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: FolderOpen, label: 'Files', path: '/files' },
    { icon: Send, label: 'Telegram', path: '/telegram' },
    { icon: Star, label: 'Starred', path: '/starred' },
    { icon: Trash2, label: 'Trash', path: '/trash' },
    { icon: Puzzle, label: 'Plugins', path: '/plugins' },
];

export function BlueprintLayout({ children }: LayoutProps) {
    const location = useLocation();
    const { user } = useAuthStore();
    const [commandOpen, setCommandOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Global keyboard shortcut for command palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // CMD+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="blueprint-mode min-h-screen flex flex-col">
            {/* Minimal Top Bar */}
            <header className="h-14 border-b border-[var(--blueprint-line-dim)] flex items-center justify-between px-6">
                {/* Left: Logo + Nav */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[var(--blueprint-cyan)]">
                        <Command className="w-5 h-5" />
                        <span className="font-mono text-sm font-semibold tracking-wider">TAAS</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition-colors ${isActive
                                            ? 'bg-[var(--blueprint-cyan)] text-[var(--blueprint-bg)]'
                                            : 'text-[var(--blueprint-text-dim)] hover:text-[var(--blueprint-text)] hover:bg-[var(--blueprint-line-dim)]/30'
                                        }`}
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Center: Command Bar Trigger */}
                <button
                    onClick={() => setCommandOpen(true)}
                    className="flex items-center gap-3 px-4 py-2 bg-[var(--blueprint-bg)] border border-[var(--blueprint-line-dim)] text-[var(--blueprint-text-dim)] hover:border-[var(--blueprint-cyan)] hover:text-[var(--blueprint-text)] transition-colors min-w-[300px]"
                >
                    <Search className="w-4 h-4" />
                    <span className="text-sm font-mono">Search or type a command...</span>
                    <kbd className="ml-auto text-[0.65rem] px-1.5 py-0.5 bg-[var(--blueprint-line-dim)] text-[var(--blueprint-text-muted)]">⌘K</kbd>
                </button>

                {/* Right: User */}
                <div className="flex items-center gap-4">
                    {user && (
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-mono text-[var(--blueprint-cyan)]">{user.firstName || user.username}</p>
                            <p className="text-[0.65rem] text-[var(--blueprint-text-muted)]">{user.email}</p>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content - Full Width, Command-First */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Command Palette */}
            <CommandPalette
                open={commandOpen}
                onClose={() => setCommandOpen(false)}
                onOpenSettings={() => setSettingsOpen(true)}
            />

            <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
