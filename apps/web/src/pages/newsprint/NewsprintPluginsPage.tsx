import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintBadge, NewsprintButton, NewsprintArticle } from '@/components/newsprint/NewsprintComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const PLUGIN_ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PLUGIN_PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function NewsprintPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPlugins = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadPlugins(); }, [loadPlugins]);
    const togglePlugin = async (id: string, enabled: boolean) => { await api.patch(`/plugins/${id}`, { enabled }); loadPlugins(); };

    if (loading) return <NewsprintLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin" /></div></NewsprintLayout>;

    return (
        <NewsprintLayout>
            <NewsprintArticle headline="Plugins & Extensions" headlineSize="large" byline="Enhance Your Experience">
                <div className="newsprint-article-body">
                    <p>Extend your file management capabilities with our curated collection of plugins. Each plugin adds powerful new features to help you work more efficiently.</p>
                </div>
            </NewsprintArticle>

            <div className="grid grid-cols-2 gap-6 mt-8">
                {plugins.map((p) => {
                    const Icon = PLUGIN_ICONS[p.id] || Briefcase;
                    const path = PLUGIN_PATHS[p.id];
                    return (
                        <NewsprintCard key={p.id}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 border-2 border-[var(--newsprint-rule)] flex items-center justify-center">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg" style={{ fontFamily: 'var(--font-headline)' }}>{p.name}</h3>
                                        <NewsprintBadge variant={p.enabled ? 'red' : 'default'}>{p.enabled ? 'Active' : 'Inactive'}</NewsprintBadge>
                                    </div>
                                    <p className="text-sm text-[var(--newsprint-ink-muted)] mb-4">{p.description}</p>
                                    <div className="flex items-center gap-3">
                                        <NewsprintButton onClick={() => togglePlugin(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable'}</NewsprintButton>
                                        {p.enabled && path && <Link to={path}><NewsprintButton variant="primary">Open →</NewsprintButton></Link>}
                                    </div>
                                </div>
                            </div>
                        </NewsprintCard>
                    );
                })}
            </div>
        </NewsprintLayout>
    );
}
