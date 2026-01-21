import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintBadge } from '@/components/blueprint/BlueprintComponents';
import { pluginsApi, Plugin } from '@/lib/plugins-api';

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

export function BlueprintPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPlugins = useCallback(async () => {
        setLoading(true);
        try {
            const response = await pluginsApi.getAvailable();
            // We only show the ones we have icons for/want to support in blueprint
            const supportedIds = ['job-tracker', 'todo-lists', 'notes'];
            setPlugins(response.data.data.filter(p => supportedIds.includes(p.id)));
        }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadPlugins(); }, [loadPlugins]);
    const togglePlugin = async (id: string, enabled: boolean) => {
        try {
            if (enabled) {
                await pluginsApi.enable(id);
            } else {
                await pluginsApi.disable(id);
            }
            await loadPlugins();
        } catch (e) { console.error(e); }
    };

    if (loading) return <BlueprintLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div></BlueprintLayout>;

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Plugins" subtitle="System extensions" />
            <div className="blueprint-grid blueprint-grid-2">
                {plugins.map((p) => {
                    const Icon = PLUGIN_ICONS[p.id] || Briefcase;
                    const path = PLUGIN_PATHS[p.id];
                    return (
                        <BlueprintCard key={p.id} corners={p.enabled}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 border border-[var(--blueprint-line-dim)] flex items-center justify-center" style={{ color: p.enabled ? 'var(--blueprint-cyan)' : 'var(--blueprint-text-dim)' }}><Icon className="w-6 h-6" /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1"><h3 className="text-sm uppercase tracking-wide">{p.name}</h3><BlueprintBadge variant={p.enabled ? 'green' : 'default'}>{p.enabled ? 'Active' : 'Inactive'}</BlueprintBadge></div>
                                    <p className="text-xs text-[var(--blueprint-text-dim)] mb-4">{p.description}</p>
                                    <div className="flex items-center gap-3 text-xs">
                                        <button onClick={() => togglePlugin(p.id, !p.enabled)} className={`uppercase tracking-wide ${p.enabled ? 'text-[var(--blueprint-error)]' : 'text-[var(--blueprint-cyan)]'}`}>{p.enabled ? 'Disable' : 'Enable'}</button>
                                        {p.enabled && path && <Link to={path} className="text-[var(--blueprint-text-dim)] flex items-center gap-1 uppercase tracking-wide">Open <ArrowRight className="w-3 h-3" /></Link>}
                                    </div>
                                </div>
                            </div>
                        </BlueprintCard>
                    );
                })}
            </div>
        </BlueprintLayout>
    );
}
