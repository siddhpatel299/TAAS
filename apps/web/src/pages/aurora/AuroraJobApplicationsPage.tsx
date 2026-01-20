import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraBadge, AuroraTable, AuroraEmpty, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function AuroraJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'default' | 'teal' | 'pink' | 'purple'> = { applied: 'default', interviewing: 'teal', offered: 'purple', rejected: 'pink' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <AuroraLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><AuroraButton><ArrowLeft className="w-4 h-4" /></AuroraButton></Link><AuroraTitle>Applications</AuroraTitle></div>
                <AuroraButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New</AuroraButton>
            </div>

            <AuroraCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("aurora-btn", filter === s && "aurora-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="aurora-input w-64" />
                </div>
            </AuroraCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--aurora-gradient-1)]" /></div> :
                filtered.length === 0 ? <AuroraEmpty text={search || filter !== 'all' ? 'No matches' : 'No applications'} /> :
                    <AuroraCard><AuroraTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><AuroraBadge color={colors[a.status] || 'default'}>{a.status}</AuroraBadge></td><td><AuroraBadge color={a.priority === 'high' ? 'pink' : 'default'}>{a.priority}</AuroraBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><AuroraButton>Edit</AuroraButton></Link></td></tr>))}</AuroraTable></AuroraCard>}
        </AuroraLayout>
    );
}
