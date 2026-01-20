import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuBadge, SkeuButton, SkeuTitle, SkeuToggle } from '@/components/skeu/SkeuComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function SkeuPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <SkeuLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--skeu-led-blue)]" /></div></SkeuLayout>;

    return (
        <SkeuLayout>
            <SkeuTitle subtitle="System modules and extensions">Plugin Control</SkeuTitle>
            <div className="skeu-grid skeu-grid-2">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Briefcase;
                    return (
                        <SkeuCard key={p.id}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 flex items-center justify-center bg-[var(--skeu-surface-inset)] rounded-lg" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                                    <Icon className="w-6 h-6 text-[var(--skeu-led-blue)]" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold">{p.name}</h3>
                                        <SkeuBadge color={p.enabled ? 'green' : 'red'}>{p.enabled ? 'Online' : 'Offline'}</SkeuBadge>
                                    </div>
                                    <p className="text-sm text-[var(--skeu-text-muted)] mb-4">{p.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <SkeuToggle active={p.enabled} onChange={(active) => toggle(p.id, active)} />
                                            <span className="text-sm text-[var(--skeu-text-muted)]">{p.enabled ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><SkeuButton variant="primary">Launch →</SkeuButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </SkeuCard>
                    );
                })}
            </div>
        </SkeuLayout>
    );
}
