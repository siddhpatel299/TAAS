import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalBadge } from '@/components/terminal/TerminalComponents';
import { api } from '@/lib/api';

const allPlugins = [
    { id: 'job-tracker', name: 'JOB TRACKER', description: 'Track job applications', icon: Briefcase, path: '/plugins/job-tracker' },
    { id: 'todo-lists', name: 'TODO LISTS', description: 'Manage tasks', icon: CheckSquare, path: '/plugins/todo-lists' },
];

export function TerminalPluginsPage() {
    const [enabled, setEnabled] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPlugins = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/users/plugins');
            setEnabled(response.data?.data?.enabledPlugins || ['job-tracker', 'todo-lists']);
        } catch (error) {
            setEnabled(['job-tracker', 'todo-lists']);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadPlugins(); }, [loadPlugins]);

    const togglePlugin = async (pluginId: string) => {
        try {
            await api.post(`/users/plugins/${pluginId}/toggle`);
            if (enabled.includes(pluginId)) setEnabled(enabled.filter(id => id !== pluginId));
            else setEnabled([...enabled, pluginId]);
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    };

    return (
        <TerminalLayout>
            <TerminalHeader title="Plugins" subtitle="System extensions" />

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allPlugins.map((plugin) => {
                        const Icon = plugin.icon;
                        const isEnabled = enabled.includes(plugin.id);
                        return (
                            <TerminalPanel key={plugin.id}>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-[var(--terminal-dark)] border border-[var(--terminal-border)]">
                                        <Icon className="w-6 h-6 text-[var(--terminal-amber)]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-xs">{plugin.name}</span>
                                            {isEnabled && <TerminalBadge variant="success">ACTIVE</TerminalBadge>}
                                        </div>
                                        <p className="text-xs text-[var(--terminal-text-dim)] mb-3">{plugin.description}</p>
                                        <div className="flex items-center gap-2">
                                            {isEnabled ? (
                                                <>
                                                    <Link to={plugin.path}><TerminalButton variant="primary">Open <ArrowRight className="w-3 h-3 ml-1" /></TerminalButton></Link>
                                                    <TerminalButton onClick={() => togglePlugin(plugin.id)}>Disable</TerminalButton>
                                                </>
                                            ) : (
                                                <TerminalButton variant="success" onClick={() => togglePlugin(plugin.id)}>Enable</TerminalButton>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TerminalPanel>
                        );
                    })}
                </div>
            )}
        </TerminalLayout>
    );
}
