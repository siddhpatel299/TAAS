import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperButton, PaperBadge, PaperTable, PaperEmpty, PaperTitle } from '@/components/paper/PaperComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function PaperJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'red' | 'blue' | 'green'> = { applied: 'blue', interviewing: 'blue', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <PaperLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><PaperButton><ArrowLeft className="w-4 h-4" /></PaperButton></Link><PaperTitle>📋 Applications</PaperTitle></div>
                <PaperButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New</PaperButton>
            </div>

            <PaperCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("paper-btn", filter === s && "paper-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search..." className="paper-input w-48" />
                </div>
            </PaperCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--ink-blue)]" /></div> :
                filtered.length === 0 ? <PaperEmpty text={search || filter !== 'all' ? 'nothing found...' : 'no applications yet!'} /> :
                    <PaperCard><PaperTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.25rem' }}>{a.company}</td><td>{a.jobTitle}</td><td><PaperBadge color={colors[a.status] || 'blue'}>{a.status}</PaperBadge></td><td><PaperBadge>{a.priority}</PaperBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><PaperButton>edit</PaperButton></Link></td></tr>))}</PaperTable></PaperCard>}
        </PaperLayout>
    );
}
