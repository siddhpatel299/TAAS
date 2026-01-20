import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistBadge, BrutalistButton, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const PLUGIN_ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PLUGIN_PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };
const PLUGIN_COLORS: Record<string, 'yellow' | 'pink' | 'blue' | 'green'> = { 'job-tracker': 'blue', 'todo-lists': 'green' };

export function BrutalistPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPlugins = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadPlugins(); }, [loadPlugins]);
    const togglePlugin = async (id: string, enabled: boolean) => { await api.patch(`/plugins/${id}`, { enabled }); loadPlugins(); };

    if (loading) return <BrutalistLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin" /></div></BrutalistLayout>;

    return (
        <BrutalistLayout>
            <BrutalistTitle>Plugins</BrutalistTitle>
            <div className="brutalist-grid brutalist-grid-2">
                {plugins.map((p) => {
                    const Icon = PLUGIN_ICONS[p.id] || Briefcase;
                    const path = PLUGIN_PATHS[p.id];
                    const color = PLUGIN_COLORS[p.id] || 'yellow';
                    return (
                        <BrutalistCard key={p.id} color={color}>
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 flex items-center justify-center border-3 border-black bg-white"><Icon className="w-8 h-8" /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-xl uppercase">{p.name}</h3>
                                        <BrutalistBadge color={p.enabled ? 'green' : 'white'}>{p.enabled ? 'ON' : 'OFF'}</BrutalistBadge>
                                    </div>
                                    <p className="mb-4 opacity-80">{p.description}</p>
                                    <div className="flex items-center gap-3">
                                        <BrutalistButton onClick={() => togglePlugin(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable'}</BrutalistButton>
                                        {p.enabled && path && <Link to={path}><BrutalistButton color="yellow">Open →</BrutalistButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </BrutalistCard>
                    );
                })}
            </div>
        </BrutalistLayout>
    );
}
