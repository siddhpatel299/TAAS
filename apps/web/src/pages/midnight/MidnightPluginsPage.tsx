import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightBadge } from '@/components/midnight/MidnightComponents';
import { api } from '@/lib/api';

interface Plugin {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    icon: string;
}

const PLUGIN_ICONS: Record<string, any> = {
    'job-tracker': Briefcase,
    'todo-lists': CheckSquare,
};

const PLUGIN_PATHS: Record<string, string> = {
    'job-tracker': '/plugins/job-tracker',
    'todo-lists': '/plugins/todo-lists',
};

export function MidnightPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPlugins = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/plugins');
            setPlugins(res.data?.data || []);
        } catch (error) {
            console.error('Failed to load plugins:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPlugins(); }, [loadPlugins]);

    const togglePlugin = async (pluginId: string, enabled: boolean) => {
        try {
            await api.patch(`/plugins/${pluginId}`, { enabled });
            loadPlugins();
        } catch (error) {
            console.error('Failed to toggle plugin:', error);
        }
    };

    if (loading) {
        return (
            <MidnightLayout>
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div>
            </MidnightLayout>
        );
    }

    return (
        <MidnightLayout>
            <MidnightHeader title="Plugins" subtitle="Extend your workspace with plugins" />

            <div className="midnight-grid midnight-grid-2">
                {plugins.map((plugin) => {
                    const Icon = PLUGIN_ICONS[plugin.id] || Briefcase;
                    const path = PLUGIN_PATHS[plugin.id];

                    return (
                        <MidnightCard key={plugin.id} gold={plugin.enabled}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[var(--midnight-surface)] flex items-center justify-center" style={{ color: plugin.enabled ? 'var(--midnight-gold)' : 'var(--midnight-text-dim)' }}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold">{plugin.name}</h3>
                                        <MidnightBadge variant={plugin.enabled ? 'gold' : 'default'}>
                                            {plugin.enabled ? 'Active' : 'Inactive'}
                                        </MidnightBadge>
                                    </div>
                                    <p className="text-sm text-[var(--midnight-text-dim)] mb-4">{plugin.description}</p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => togglePlugin(plugin.id, !plugin.enabled)}
                                            className={`text-sm font-medium ${plugin.enabled ? 'text-[var(--midnight-error)]' : 'text-[var(--midnight-gold)]'}`}
                                        >
                                            {plugin.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                        {plugin.enabled && path && (
                                            <Link to={path} className="text-sm font-medium text-[var(--midnight-accent)] flex items-center gap-1">
                                                Open <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </MidnightCard>
                    );
                })}
            </div>
        </MidnightLayout>
    );
}
