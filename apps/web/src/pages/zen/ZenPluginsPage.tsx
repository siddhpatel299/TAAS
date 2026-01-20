import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenBadge, ZenButton, ZenTitle, ZenSection } from '@/components/zen/ZenComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function ZenPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <ZenLayout><div className="flex items-center justify-center" style={{ minHeight: '50vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div></ZenLayout>;

    return (
        <ZenLayout>
            <ZenTitle subtitle="Extend your experience">Plugins</ZenTitle>
            <ZenSection>
                <div className="zen-grid zen-grid-2">
                    {plugins.map((p) => {
                        const Icon = ICONS[p.id] || Briefcase;
                        return (
                            <ZenCard key={p.id}>
                                <div className="flex items-start gap-6">
                                    <Icon className="w-6 h-6 text-[var(--zen-text-light)]" style={{ marginTop: '4px' }} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4" style={{ marginBottom: '8px' }}>
                                            <span className="font-medium" style={{ fontWeight: '400' }}>{p.name}</span>
                                            <ZenBadge color={p.enabled ? 'sage' : 'default'}>{p.enabled ? 'Active' : 'Inactive'}</ZenBadge>
                                        </div>
                                        <p className="text-sm text-[var(--zen-text-light)]" style={{ marginBottom: '24px' }}>{p.description}</p>
                                        <div className="flex items-center gap-4">
                                            <ZenButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable'}</ZenButton>
                                            {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><ZenButton variant="primary">Open</ZenButton></Link>}
                                        </div>
                                    </div>
                                </div>
                            </ZenCard>
                        );
                    })}
                </div>
            </ZenSection>
        </ZenLayout>
    );
}
