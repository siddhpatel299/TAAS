import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraBadge, AuroraButton, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function AuroraPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <AuroraLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--aurora-gradient-1)]" /></div></AuroraLayout>;

    return (
        <AuroraLayout>
            <AuroraTitle subtitle="Extend your experience">Plugins</AuroraTitle>
            <div className="aurora-grid aurora-grid-2">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Briefcase;
                    return (
                        <AuroraCard key={p.id} glow={p.enabled}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[var(--aurora-gradient-1)] to-[var(--aurora-gradient-2)] rounded-xl"><Icon className="w-6 h-6 text-white" /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold">{p.name}</h3>
                                        <AuroraBadge color={p.enabled ? 'teal' : 'pink'}>{p.enabled ? 'Active' : 'Inactive'}</AuroraBadge>
                                    </div>
                                    <p className="text-sm text-[var(--aurora-text-muted)] mb-4">{p.description}</p>
                                    <div className="flex items-center gap-2">
                                        <AuroraButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable'}</AuroraButton>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><AuroraButton variant="primary">Open →</AuroraButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </AuroraCard>
                    );
                })}
            </div>
        </AuroraLayout>
    );
}
