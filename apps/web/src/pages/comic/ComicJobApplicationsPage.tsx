import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicButton, ComicBadge, ComicTable, ComicEmpty, ComicTitle } from '@/components/comic/ComicComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function ComicJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'yellow' | 'green' | 'blue' | 'red'> = { applied: 'yellow', interviewing: 'blue', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <ComicLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><Link to="/plugins/job-tracker"><ComicButton><ArrowLeft className="w-5 h-5" /></ComicButton></Link><ComicTitle>Applications!</ComicTitle></div>
                <ComicButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-5 h-5" /> NEW!</ComicButton>
            </div>
            <ComicPanel title="Filter!">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("comic-btn", filter === s && "comic-btn-primary")}>{s.toUpperCase()}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="comic-input w-64" />
                </div>
            </ComicPanel>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--comic-blue)]" /></div> :
                filtered.length === 0 ? <ComicEmpty text={search || filter !== 'all' ? 'No matches!' : 'No applications!'} /> :
                    <ComicPanel title={`${filtered.length} Applications!`}><ComicTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td className="font-bold">{a.company}</td><td>{a.jobTitle}</td><td><ComicBadge color={colors[a.status] || 'yellow'}>{a.status.toUpperCase()}!</ComicBadge></td><td><ComicBadge color={a.priority === 'high' ? 'red' : 'blue'}>{a.priority}</ComicBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ComicButton>Edit!</ComicButton></Link></td></tr>))}</ComicTable></ComicPanel>}
        </ComicLayout>
    );
}
