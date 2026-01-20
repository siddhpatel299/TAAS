import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2, Puzzle } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasBadge, CanvasButton, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function CanvasPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <CanvasLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--canvas-accent)]" /></div></CanvasLayout>;

    return (
        <CanvasLayout>
            <CanvasTitle>Plugins</CanvasTitle>
            <div className="grid grid-cols-2 gap-6">
                {plugins.map((p) => {
                    const Icon = ICONS[p.id] || Puzzle;
                    return (
                        <CanvasWindow key={p.id} title={p.name} icon={<Icon className="w-4 h-4" />} zLevel={p.enabled ? "close" : "far"}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--canvas-accent)] to-[var(--canvas-accent-2)] flex items-center justify-center"><Icon className="w-6 h-6 text-white" /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CanvasBadge color={p.enabled ? 'blue' : 'pink'}>{p.enabled ? 'Active' : 'Inactive'}</CanvasBadge>
                                    </div>
                                    <p className="text-sm text-[var(--canvas-text-muted)] mb-4">{p.description}</p>
                                    <div className="flex items-center gap-2">
                                        <CanvasButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable'}</CanvasButton>
                                        {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><CanvasButton variant="primary">Open →</CanvasButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </CanvasWindow>
                    );
                })}
            </div>
        </CanvasLayout>
    );
}
