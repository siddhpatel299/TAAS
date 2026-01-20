import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2, Power } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelBadge, PixelButton, PixelTitle } from '@/components/pixel/PixelComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };
const COLORS: Record<string, 'red' | 'green' | 'blue' | 'yellow'> = { 'job-tracker': 'yellow', 'todo-lists': 'green' };

export function PixelPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <PixelLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--pixel-cyan)]" /></div></PixelLayout>;

    return (
        <PixelLayout>
            <PixelTitle subtitle="> POWER-UPS AND MODS">🔌 PLUGINS</PixelTitle>
            <div className="pixel-grid pixel-grid-2">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Briefcase;
                    const color = COLORS[p.id] || 'blue';
                    return (
                        <PixelCard key={p.id}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 flex items-center justify-center bg-[var(--pixel-${color})] text-[var(--pixel-black)]`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.5rem' }}>{p.name.toUpperCase()}</span>
                                        <PixelBadge color={p.enabled ? 'green' : 'red'}>{p.enabled ? 'ON' : 'OFF'}</PixelBadge>
                                    </div>
                                    <p className="text-sm mb-4 text-[var(--pixel-text-dim)]">{p.description}</p>
                                    <div className="flex items-center gap-3">
                                        <PixelButton onClick={() => toggle(p.id, !p.enabled)}><Power className="w-4 h-4" /> {p.enabled ? 'DISABLE' : 'ENABLE'}</PixelButton>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><PixelButton variant="primary">PLAY →</PixelButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </PixelCard>
                    );
                })}
            </div>
        </PixelLayout>
    );
}
