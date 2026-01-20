import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuButton, SkeuBadge, SkeuTable, SkeuEmpty, SkeuTitle } from '@/components/skeu/SkeuComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function SkeuJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'green' | 'blue' | 'orange' | 'red' | 'purple'> = { applied: 'blue', interviewing: 'purple', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <SkeuLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><SkeuButton><ArrowLeft className="w-4 h-4" /></SkeuButton></Link><SkeuTitle>Applications</SkeuTitle></div>
                <SkeuButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New Application</SkeuButton>
            </div>

            <SkeuCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("skeu-btn", filter === s && "skeu-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="skeu-input w-64" />
                </div>
            </SkeuCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--skeu-led-blue)]" /></div> :
                filtered.length === 0 ? <SkeuEmpty text={search || filter !== 'all' ? 'No matching applications' : 'No applications yet'} /> :
                    <SkeuCard><SkeuTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><SkeuBadge color={colors[a.status] || 'blue'}>{a.status}</SkeuBadge></td><td><SkeuBadge color={a.priority === 'high' ? 'red' : 'blue'}>{a.priority}</SkeuBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><SkeuButton>Edit</SkeuButton></Link></td></tr>))}</SkeuTable></SkeuCard>}
        </SkeuLayout>
    );
}
