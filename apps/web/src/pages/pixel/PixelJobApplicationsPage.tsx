import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelBadge, PixelTable, PixelEmpty, PixelTitle } from '@/components/pixel/PixelComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function PixelJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'red' | 'green' | 'blue' | 'yellow'> = { applied: 'blue', interviewing: 'yellow', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <PixelLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><PixelButton><ArrowLeft className="w-4 h-4" /></PixelButton></Link><PixelTitle>APPLICATIONS</PixelTitle></div>
                <PixelButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> NEW</PixelButton>
            </div>

            <PixelCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("pixel-btn", filter === s && "pixel-btn-primary")}>{s.toUpperCase()}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="> SEARCH..." className="pixel-input w-48" />
                </div>
            </PixelCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--pixel-cyan)]" /></div> :
                filtered.length === 0 ? <PixelEmpty text={search || filter !== 'all' ? 'NO MATCHES' : 'NO APPLICATIONS'} /> :
                    <PixelCard><PixelTable headers={['Company', 'Role', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><PixelBadge color={colors[a.status] || 'blue'}>{a.status.toUpperCase()}</PixelBadge></td><td><PixelBadge color={a.priority === 'high' ? 'red' : 'blue'}>{a.priority?.toUpperCase()}</PixelBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><PixelButton>EDIT</PixelButton></Link></td></tr>))}</PixelTable></PixelCard>}
        </PixelLayout>
    );
}
