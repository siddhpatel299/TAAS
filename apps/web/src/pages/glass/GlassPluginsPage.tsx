import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassBadge, GlassButton, GlassTitle } from '@/components/glass/GlassComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const PLUGIN_ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PLUGIN_PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function GlassPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPlugins = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadPlugins(); }, [loadPlugins]);
    const togglePlugin = async (id: string, enabled: boolean) => { await api.patch(`/plugins/${id}`, { enabled }); loadPlugins(); };

    if (loading) return <GlassLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--glass-accent)]" /></div></GlassLayout>;

    return (
        <GlassLayout>
            <GlassTitle>Plugins</GlassTitle>
            <div className="glass-grid glass-grid-2">
                {plugins.map((p) => {
                    const Icon = PLUGIN_ICONS[p.id] || Briefcase;
                    const path = PLUGIN_PATHS[p.id];
                    return (
                        <GlassCard key={p.id}>
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center"><Icon className="w-7 h-7 text-[var(--glass-accent)]" /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-lg">{p.name}</h3>
                                        <GlassBadge color={p.enabled ? 'cyan' : 'pink'}>{p.enabled ? 'Active' : 'Inactive'}</GlassBadge>
                                    </div>
                                    <p className="text-[var(--glass-text-muted)] mb-4 text-sm">{p.description}</p>
                                    <div className="flex items-center gap-3">
                                        <GlassButton onClick={() => togglePlugin(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable'}</GlassButton>
                                        {p.enabled && path && <Link to={path}><GlassButton variant="primary">Open →</GlassButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </GlassLayout>
    );
}
