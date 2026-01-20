import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintButton, NewsprintBadge, NewsprintTable, NewsprintInput, NewsprintEmpty } from '@/components/newsprint/NewsprintComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function NewsprintJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadApps = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadApps(); }, [loadApps]);

    const statusColors: Record<string, 'default' | 'red' | 'blue'> = { applied: 'default', interviewing: 'blue', offered: 'blue', rejected: 'red', saved: 'default' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filteredApps = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = statusFilter === 'all' || a.status === statusFilter; return ms && mst; });

    return (
        <NewsprintLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker"><NewsprintButton><ArrowLeft className="w-4 h-4" /></NewsprintButton></Link>
                    <h1 className="text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Job Applications</h1>
                </div>
                <NewsprintButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4 mr-2" /> New Application</NewsprintButton>
            </div>

            <NewsprintCard className="mb-6 !p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs uppercase tracking-wide border ${statusFilter === s ? 'bg-[var(--newsprint-ink)] text-[var(--newsprint-paper)] border-[var(--newsprint-ink)]' : 'border-[var(--newsprint-rule-light)] text-[var(--newsprint-ink-muted)]'}`} style={{ fontFamily: 'var(--font-sans)' }}>{s}</button>))}</div>
                    <NewsprintInput value={search} onChange={setSearch} placeholder="Search..." icon={<Search className="w-4 h-4" />} className="w-64" />
                </div>
            </NewsprintCard>

            <NewsprintSection title={`${filteredApps.length} Applications`}>
                {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div> :
                    filteredApps.length === 0 ? <NewsprintEmpty text={search || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet. Add your first one!'} /> :
                        <NewsprintCard className="!p-0">
                            <NewsprintTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                                {filteredApps.map((a) => (<tr key={a.id}><td style={{ fontFamily: 'var(--font-headline)' }}>{a.company}</td><td className="text-[var(--newsprint-ink-muted)]">{a.jobTitle}</td><td><NewsprintBadge variant={statusColors[a.status] || 'default'}>{a.status}</NewsprintBadge></td><td><NewsprintBadge variant={a.priority === 'high' ? 'red' : 'default'}>{a.priority}</NewsprintBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><NewsprintButton>Edit</NewsprintButton></Link></td></tr>))}
                            </NewsprintTable>
                        </NewsprintCard>}
            </NewsprintSection>
        </NewsprintLayout>
    );
}
