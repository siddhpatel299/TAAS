import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton, BlueprintBadge, BlueprintTable, BlueprintInput, BlueprintEmpty } from '@/components/blueprint/BlueprintComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function BlueprintJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadApps = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadApps(); }, [loadApps]);

    const statusColors: Record<string, 'default' | 'cyan' | 'green' | 'orange' | 'red'> = { applied: 'default', interviewing: 'cyan', offered: 'green', rejected: 'red', saved: 'orange' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filteredApps = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = statusFilter === 'all' || a.status === statusFilter; return ms && mst; });

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Applications" subtitle={`${apps.length} total`} actions={<div className="flex items-center gap-3"><Link to="/plugins/job-tracker"><BlueprintButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</BlueprintButton></Link><BlueprintButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4 mr-2" /> Add</BlueprintButton></div>} />
            <BlueprintCard className="mb-4 !p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${statusFilter === s ? 'bg-[var(--blueprint-cyan)] text-[var(--blueprint-bg)]' : 'border border-[var(--blueprint-line-dim)] text-[var(--blueprint-text-dim)]'}`}>{s}</button>))}</div>
                    <BlueprintInput value={search} onChange={setSearch} placeholder="Search..." icon={<Search className="w-4 h-4" />} className="w-64" />
                </div>
            </BlueprintCard>
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div> :
                filteredApps.length === 0 ? <BlueprintEmpty icon={<Search className="w-8 h-8" />} text={search || statusFilter !== 'all' ? 'No matches' : 'No applications'} action={<BlueprintButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4 mr-2" /> Add</BlueprintButton>} /> :
                    <BlueprintCard className="!p-0 overflow-hidden">
                        <BlueprintTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                            {filteredApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td className="text-[var(--blueprint-text-dim)]">{a.jobTitle}</td><td><BlueprintBadge variant={statusColors[a.status] || 'default'}>{a.status}</BlueprintBadge></td><td><BlueprintBadge variant={a.priority === 'high' ? 'red' : a.priority === 'medium' ? 'orange' : 'default'}>{a.priority}</BlueprintBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><BlueprintButton variant="ghost">Edit</BlueprintButton></Link></td></tr>))}
                        </BlueprintTable>
                    </BlueprintCard>}
        </BlueprintLayout>
    );
}
