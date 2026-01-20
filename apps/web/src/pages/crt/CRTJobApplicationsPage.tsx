import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTButton, CRTBadge, CRTTable, CRTEmpty, CRTTitle } from '@/components/crt/CRTComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function CRTJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadApps = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadApps(); }, [loadApps]);

    const statusColors: Record<string, 'green' | 'amber' | 'blue' | 'red'> = { applied: 'amber', interviewing: 'blue', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filteredApps = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = statusFilter === 'all' || a.status === statusFilter; return ms && mst; });

    return (
        <CRTLayout>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker"><CRTButton><ArrowLeft className="w-4 h-4" /></CRTButton></Link>
                    <CRTTitle>Applications</CRTTitle>
                </div>
                <CRTButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> [NEW]</CRTButton>
            </div>

            <div className="crt-box mb-4 flex items-center justify-between">
                <div className="flex gap-1">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("crt-btn !px-2 !py-1 !text-xs", statusFilter === s && "crt-btn-primary")}>[{s.toUpperCase()}]</button>))}</div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--crt-green-dim)]" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH..." className="crt-input !pl-10" />
                </div>
            </div>

            <CRTPanel header="Application Log">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--crt-green)]" /></div> :
                    filteredApps.length === 0 ? <CRTEmpty text={search || statusFilter !== 'all' ? 'NO MATCH' : 'NO APPLICATIONS'} /> :
                        <CRTTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                            {filteredApps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><CRTBadge color={statusColors[a.status] || 'amber'}>{a.status}</CRTBadge></td><td><CRTBadge color={a.priority === 'high' ? 'red' : 'green'}>{a.priority}</CRTBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><CRTButton>[EDIT]</CRTButton></Link></td></tr>))}
                        </CRTTable>}
            </CRTPanel>
        </CRTLayout>
    );
}
