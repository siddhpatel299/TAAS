import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecBadge, ExecButton, ExecTitle, ExecDivider } from '@/components/exec/ExecComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function ExecPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <ExecLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--exec-gold)]" /></div></ExecLayout>;

    return (
        <ExecLayout>
            <ExecTitle subtitle="Premium extensions for your workflow">Executive Modules</ExecTitle>
            <div className="exec-grid exec-grid-2">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Briefcase;
                    return (
                        <ExecCard key={p.id}>
                            <div className="flex items-start gap-6">
                                <div className="w-14 h-14 flex items-center justify-center border border-[var(--exec-border-gold)]">
                                    <Icon className="w-7 h-7 text-[var(--exec-gold)]" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-lg" style={{ fontFamily: 'var(--font-exec-heading)' }}>{p.name}</span>
                                        <ExecBadge color={p.enabled ? 'gold' : 'burgundy'}>{p.enabled ? 'Active' : 'Inactive'}</ExecBadge>
                                    </div>
                                    <p className="text-sm text-[var(--exec-text-muted)] mb-6">{p.description}</p>
                                    <ExecDivider />
                                    <div className="flex items-center justify-between">
                                        <ExecButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'Deactivate' : 'Activate'}</ExecButton>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><ExecButton variant="primary">Launch</ExecButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </ExecCard>
                    );
                })}
            </div>
        </ExecLayout>
    );
}
