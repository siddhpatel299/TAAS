import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicBadge, ComicButton, ComicTitle } from '@/components/comic/ComicComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function ComicPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <ComicLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--comic-blue)]" /></div></ComicLayout>;

    return (
        <ComicLayout>
            <ComicTitle>Plugins!</ComicTitle>
            <div className="comic-grid comic-grid-2">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Briefcase;
                    return (
                        <ComicPanel key={p.id} title={p.name.toUpperCase() + "!"}>
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-[var(--comic-yellow)] border-3 border-black flex items-center justify-center transform rotate-3"><Icon className="w-8 h-8" /></div>
                                <div className="flex-1">
                                    <div className="mb-2"><ComicBadge color={p.enabled ? 'green' : 'red'}>{p.enabled ? 'ACTIVE!' : 'OFF'}</ComicBadge></div>
                                    <p className="mb-4">{p.description}</p>
                                    <div className="flex items-center gap-2">
                                        <ComicButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable!'}</ComicButton>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><ComicButton variant="primary">Open! →</ComicButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </ComicPanel>
                    );
                })}
            </div>
        </ComicLayout>
    );
}
