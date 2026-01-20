import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTBox, CRTBadge, CRTButton, CRTTitle } from '@/components/crt/CRTComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const PLUGIN_ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PLUGIN_PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function CRTPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPlugins = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadPlugins(); }, [loadPlugins]);
    const togglePlugin = async (id: string, enabled: boolean) => { await api.patch(`/plugins/${id}`, { enabled }); loadPlugins(); };

    if (loading) return <CRTLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--crt-green)]" /></div></CRTLayout>;

    return (
        <CRTLayout>
            <CRTTitle>Installed Modules</CRTTitle>
            <div className="grid grid-cols-2 gap-4">
                {plugins.map((p) => {
                    const Icon = PLUGIN_ICONS[p.id] || Briefcase;
                    const path = PLUGIN_PATHS[p.id];
                    return (
                        <CRTBox key={p.id}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 border border-[var(--crt-green-dim)] flex items-center justify-center"><Icon className="w-6 h-6" /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg">{p.name.toUpperCase()}</h3>
                                        <CRTBadge color={p.enabled ? 'green' : 'red'}>{p.enabled ? 'ACTIVE' : 'INACTIVE'}</CRTBadge>
                                    </div>
                                    <p className="text-[var(--crt-green-dim)] mb-4 text-sm">&gt; {p.description}</p>
                                    <div className="flex items-center gap-3">
                                        <CRTButton onClick={() => togglePlugin(p.id, !p.enabled)}>{p.enabled ? '[DISABLE]' : '[ENABLE]'}</CRTButton>
                                        {p.enabled && path && <Link to={path}><CRTButton variant="primary">[RUN]</CRTButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </CRTBox>
                    );
                })}
            </div>
        </CRTLayout>
    );
}
