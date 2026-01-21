import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalBadge } from '@/components/terminal/TerminalComponents';
import { pluginsApi, Plugin } from '@/lib/plugins-api';

export function TerminalPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPlugins = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await pluginsApi.getAvailable();
            // We only show the ones we have icons for/want to support in terminal
            const supportedIds = ['job-tracker', 'todo-lists', 'notes'];
            setPlugins(response.data.data.filter(p => supportedIds.includes(p.id)));
        } catch (error) {
            console.error('Failed to load plugins:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadPlugins(); }, [loadPlugins]);

    const togglePlugin = async (pluginId: string, currentlyEnabled: boolean) => {
        try {
            if (currentlyEnabled) {
                await pluginsApi.disable(pluginId);
            } else {
                await pluginsApi.enable(pluginId);
            }
            await loadPlugins();
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    };

    const PLUGIN_ICONS: Record<string, any> = {
        'job-tracker': Briefcase,
        'todo-lists': CheckSquare,
        'notes': FileText
    };

    const PLUGIN_PATHS: Record<string, string> = {
        'job-tracker': '/plugins/job-tracker',
        'todo-lists': '/plugins/todo-lists',
        'notes': '/plugins/notes'
    };

    return (
        <TerminalLayout>
            <TerminalHeader title="Plugins" subtitle="System extensions" />

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plugins.map((plugin) => {
                        const Icon = PLUGIN_ICONS[plugin.id] || Briefcase;
                        const isEnabled = plugin.enabled;
                        const path = PLUGIN_PATHS[plugin.id];
                        return (
                            <TerminalPanel key={plugin.id}>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-[var(--terminal-dark)] border border-[var(--terminal-border)]">
                                        <Icon className="w-6 h-6 text-[var(--terminal-amber)]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-xs">{plugin.name.toUpperCase()}</span>
                                            {isEnabled && <TerminalBadge variant="success">ACTIVE</TerminalBadge>}
                                        </div>
                                        <p className="text-xs text-[var(--terminal-text-dim)] mb-3">{plugin.description}</p>
                                        <div className="flex items-center gap-2">
                                            {isEnabled ? (
                                                <>
                                                    {path && <Link to={path}><TerminalButton variant="primary">Open <ArrowRight className="w-3 h-3 ml-1" /></TerminalButton></Link>}
                                                    <TerminalButton onClick={() => togglePlugin(plugin.id, true)}>Disable</TerminalButton>
                                                </>
                                            ) : (
                                                <TerminalButton variant="success" onClick={() => togglePlugin(plugin.id, false)}>Enable</TerminalButton>
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
