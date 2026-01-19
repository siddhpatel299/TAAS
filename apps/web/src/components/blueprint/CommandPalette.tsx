import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, FolderOpen, Star, Trash2, Puzzle, Settings, LogOut, Send, Briefcase, CheckSquare, Mail, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';

interface Command {
    id: string;
    label: string;
    icon: any;
    shortcut?: string;
    action: () => void;
    category: 'navigation' | 'action' | 'plugin';
}

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
}

export function CommandPalette({ open, onClose, onOpenSettings }: CommandPaletteProps) {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: Command[] = useMemo(() => [
        // Navigation
        { id: 'dashboard', label: 'Go to Dashboard', icon: Home, shortcut: 'G D', action: () => navigate('/'), category: 'navigation' },
        { id: 'files', label: 'Go to Files', icon: FolderOpen, shortcut: 'G F', action: () => navigate('/files'), category: 'navigation' },
        { id: 'telegram', label: 'Go to Telegram', icon: Send, shortcut: 'G T', action: () => navigate('/telegram'), category: 'navigation' },
        { id: 'starred', label: 'Go to Starred', icon: Star, shortcut: 'G S', action: () => navigate('/starred'), category: 'navigation' },
        { id: 'trash', label: 'Go to Trash', icon: Trash2, shortcut: 'G X', action: () => navigate('/trash'), category: 'navigation' },
        { id: 'plugins', label: 'Go to Plugins', icon: Puzzle, shortcut: 'G P', action: () => navigate('/plugins'), category: 'navigation' },
        // Plugins
        { id: 'job-tracker', label: 'Open Job Tracker', icon: Briefcase, action: () => navigate('/plugins/job-tracker'), category: 'plugin' },
        { id: 'applications', label: 'View Job Applications', icon: Briefcase, action: () => navigate('/plugins/job-tracker/applications'), category: 'plugin' },
        { id: 'outreach', label: 'View Email Outreach', icon: Mail, action: () => navigate('/plugins/job-tracker/outreach'), category: 'plugin' },
        { id: 'contacts', label: 'Find Company Contacts', icon: Users, action: () => navigate('/plugins/job-tracker/contacts'), category: 'plugin' },
        { id: 'todos', label: 'Open Todo Lists', icon: CheckSquare, action: () => navigate('/plugins/todo-lists'), category: 'plugin' },
        // Actions
        { id: 'settings', label: 'Open Settings', icon: Settings, shortcut: ',', action: () => { onClose(); onOpenSettings(); }, category: 'action' },
        { id: 'logout', label: 'Logout', icon: LogOut, action: () => { logout(); navigate('/login'); }, category: 'action' },
    ], [navigate, logout, onClose, onOpenSettings]);

    const filtered = useMemo(() => {
        if (!search.trim()) return commands;
        const q = search.toLowerCase();
        return commands.filter(c => c.label.toLowerCase().includes(q) || c.id.includes(q));
    }, [commands, search]);

    useEffect(() => {
        if (open) {
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && filtered[selectedIndex]) {
            e.preventDefault();
            filtered[selectedIndex].action();
            onClose();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[var(--blueprint-bg)]/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.15 }}
                    className="w-full max-w-xl bg-[var(--blueprint-surface)] border border-[var(--blueprint-line)] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 p-4 border-b border-[var(--blueprint-line-dim)]">
                        <Search className="w-5 h-5 text-[var(--blueprint-cyan)]" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent outline-none text-[var(--blueprint-text)] placeholder-[var(--blueprint-text-muted)] text-sm font-mono"
                            autoComplete="off"
                        />
                        <button onClick={onClose} className="p-1 hover:bg-[var(--blueprint-line-dim)] rounded">
                            <X className="w-4 h-4 text-[var(--blueprint-text-dim)]" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto py-2">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-8 text-center text-[var(--blueprint-text-dim)] text-sm">
                                No commands found for "{search}"
                            </div>
                        ) : (
                            <>
                                {/* Group by category */}
                                {(['navigation', 'plugin', 'action'] as const).map(category => {
                                    const items = filtered.filter(c => c.category === category);
                                    if (items.length === 0) return null;
                                    const categoryLabel = { navigation: 'Navigation', plugin: 'Plugins', action: 'Actions' }[category];

                                    return (
                                        <div key={category}>
                                            <div className="px-4 py-2 text-[0.65rem] uppercase tracking-widest text-[var(--blueprint-text-muted)]">
                                                {categoryLabel}
                                            </div>
                                            {items.map((cmd) => {
                                                const globalIndex = filtered.indexOf(cmd);
                                                const isSelected = globalIndex === selectedIndex;
                                                return (
                                                    <button
                                                        key={cmd.id}
                                                        onClick={() => { cmd.action(); onClose(); }}
                                                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected
                                                                ? 'bg-[var(--blueprint-cyan)] text-[var(--blueprint-bg)]'
                                                                : 'text-[var(--blueprint-text)] hover:bg-[var(--blueprint-line-dim)]/30'
                                                            }`}
                                                    >
                                                        <cmd.icon className={`w-4 h-4 ${isSelected ? 'text-[var(--blueprint-bg)]' : 'text-[var(--blueprint-cyan)]'}`} />
                                                        <span className="flex-1 text-sm font-mono">{cmd.label}</span>
                                                        {cmd.shortcut && (
                                                            <kbd className={`text-xs px-1.5 py-0.5 rounded ${isSelected
                                                                    ? 'bg-[var(--blueprint-bg)]/20 text-[var(--blueprint-bg)]'
                                                                    : 'bg-[var(--blueprint-line-dim)] text-[var(--blueprint-text-dim)]'
                                                                }`}>
                                                                {cmd.shortcut}
                                                            </kbd>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-[var(--blueprint-line-dim)] flex items-center justify-between text-[0.65rem] text-[var(--blueprint-text-muted)]">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                        <span>ESC Close</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
