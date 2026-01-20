import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamBadge, SteamButton, SteamTitle } from '@/components/steam/SteamComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function SteamPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <SteamLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--steam-brass)]" /></div></SteamLayout>;

    return (
        <SteamLayout>
            <SteamTitle>Machinery</SteamTitle>
            <div className="steam-grid steam-grid-2">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Briefcase;
                    return (
                        <SteamPanel key={p.id} title={p.name}>
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 flex items-center justify-center border-2 border-[var(--steam-brass)] rounded-full"><Icon className="w-7 h-7 text-[var(--steam-brass)]" /></div>
                                <div className="flex-1">
                                    <div className="mb-2"><SteamBadge color={p.enabled ? 'brass' : 'rust'}>{p.enabled ? 'Engaged' : 'Disengaged'}</SteamBadge></div>
                                    <p className="text-sm text-[var(--steam-text-muted)] mb-4">{p.description}</p>
                                    <div className="flex items-center gap-2">
                                        <SteamButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'Disengage' : 'Engage'}</SteamButton>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><SteamButton variant="primary">Access →</SteamButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </SteamPanel>
                    );
                })}
            </div>
        </SteamLayout>
    );
}
