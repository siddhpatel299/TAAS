import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperSticky, PaperBadge, PaperButton, PaperTitle } from '@/components/paper/PaperComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };
const COLORS: Record<string, 'yellow' | 'pink' | 'blue' | 'green'> = { 'job-tracker': 'pink', 'todo-lists': 'blue' };

export function PaperPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <PaperLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--ink-blue)]" /></div></PaperLayout>;

    return (
        <PaperLayout>
            <PaperTitle subtitle="add-ons for your notebook">🧩 Plugins</PaperTitle>
            <div className="paper-grid paper-grid-2">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Briefcase;
                    const color = COLORS[p.id] || 'yellow';
                    return (
                        <PaperSticky key={p.id} color={color}>
                            <div className="flex items-start gap-4">
                                <Icon className="w-8 h-8" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem' }}>{p.name}</span>
                                        <PaperBadge color={p.enabled ? 'green' : 'red'}>{p.enabled ? 'ON' : 'OFF'}</PaperBadge>
                                    </div>
                                    <p className="text-sm mb-4">{p.description}</p>
                                    <div className="flex items-center gap-3">
                                        <PaperButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'disable' : 'enable'}</PaperButton>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><PaperButton variant="primary">open →</PaperButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </PaperSticky>
                    );
                })}
            </div>
        </PaperLayout>
    );
}
