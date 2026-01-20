import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecBadge, ExecTable, ExecEmpty, ExecTitle } from '@/components/exec/ExecComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function ExecJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'gold' | 'burgundy' | 'navy' | 'green'> = { applied: 'navy', interviewing: 'gold', offered: 'green', rejected: 'burgundy' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <ExecLayout>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><ExecButton><ArrowLeft className="w-4 h-4" /></ExecButton></Link><ExecTitle>Applications</ExecTitle></div>
                <ExecButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New Application</ExecButton>
            </div>

            <ExecCard className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("exec-btn uppercase", filter === s && "exec-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="exec-input w-64" />
                </div>
            </ExecCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--exec-gold)]" /></div> :
                filtered.length === 0 ? <ExecEmpty text={search || filter !== 'all' ? 'No matching applications' : 'No applications in portfolio'} /> :
                    <ExecCard><ExecTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><ExecBadge color={colors[a.status] || 'gold'}>{a.status}</ExecBadge></td><td><ExecBadge color={a.priority === 'high' ? 'burgundy' : 'gold'}>{a.priority}</ExecBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ExecButton>Review</ExecButton></Link></td></tr>))}</ExecTable></ExecCard>}
        </ExecLayout>
    );
}
