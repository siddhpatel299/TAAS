import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoBadge, DecoButton, DecoTitle } from '@/components/artdeco/ArtDecoComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function ArtDecoPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <ArtDecoLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--deco-gold)]" /></div></ArtDecoLayout>;

    return (
        <ArtDecoLayout>
            <DecoTitle>Plugins</DecoTitle>
            <div className="deko-grid deco-grid-2 grid grid-cols-2 gap-6">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Briefcase;
                    return (
                        <DecoCard key={p.id}>
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 border border-[var(--deco-gold)] flex items-center justify-center"><Icon className="w-7 h-7 text-[var(--deco-gold)]" /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-lg">{p.name}</h3>
                                        <DecoBadge color={p.enabled ? 'sage' : 'rose'}>{p.enabled ? 'Active' : 'Inactive'}</DecoBadge>
                                    </div>
                                    <p className="text-[var(--deco-text-muted)] mb-4 text-sm">{p.description}</p>
                                    <div className="flex items-center gap-3">
                                        <DecoButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable'}</DecoButton>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><DecoButton variant="primary">Open</DecoButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </DecoCard>
                    );
                })}
            </div>
        </ArtDecoLayout>
    );
}
