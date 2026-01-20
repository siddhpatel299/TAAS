import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveBadge, ArchiveButton, ArchiveTitle, ArchiveCard } from '@/components/archive/ArchiveComponents';
import { api } from '@/lib/api';

interface Plugin { id: string; name: string; description: string; enabled: boolean; }
const ICONS: Record<string, any> = { 'job-tracker': Briefcase, 'todo-lists': CheckSquare };
const PATHS: Record<string, string> = { 'job-tracker': '/plugins/job-tracker', 'todo-lists': '/plugins/todo-lists' };

export function ArchivePluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get('/plugins'); setPlugins(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const toggle = async (id: string, en: boolean) => { await api.patch(`/plugins/${id}`, { enabled: en }); load(); };

    if (loading) return <ArchiveLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[var(--archive-accent)]" /></div></ArchiveLayout>;

    return (
        <ArchiveLayout>
            <ArchiveTitle>Extensions</ArchiveTitle>
            <ArchiveSection title="Available Plugins" count={plugins.length}>
                <div className="archive-columns archive-columns-2">
                    {plugins.map((p) => {
                        const Icon = ICONS[p.id] || Briefcase;
                        return (
                            <ArchiveCard key={p.id} featured={p.enabled}>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 flex items-center justify-center border border-[var(--archive-border-dark)]"><Icon className="w-6 h-6" /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-medium">{p.name}</h3>
                                            <ArchiveBadge variant={p.enabled ? 'accent' : 'default'}>{p.enabled ? 'Active' : 'Inactive'}</ArchiveBadge>
                                        </div>
                                        <p className="text-sm text-[var(--archive-text-muted)] mb-4">{p.description}</p>
                                        <div className="flex items-center gap-2">
                                            <ArchiveButton onClick={() => toggle(p.id, !p.enabled)}>{p.enabled ? 'Disable' : 'Enable'}</ArchiveButton>
                                            {p.enabled && PATHS[p.id] && <Link to={PATHS[p.id]}><ArchiveButton variant="primary">Open →</ArchiveButton></Link>}
                                        </div>
                                    </div>
                                </div>
                            </ArchiveCard>
                        );
                    })}
                </div>
            </ArchiveSection>
        </ArchiveLayout>
    );
}
