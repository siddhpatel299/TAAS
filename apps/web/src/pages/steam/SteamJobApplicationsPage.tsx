import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamButton, SteamBadge, SteamTable, SteamEmpty, SteamTitle } from '@/components/steam/SteamComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function SteamJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'brass' | 'copper' | 'rust'> = { applied: 'brass', interviewing: 'copper', offered: 'brass', rejected: 'rust' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <SteamLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><SteamButton><ArrowLeft className="w-4 h-4" /></SteamButton></Link><SteamTitle>Applications Register</SteamTitle></div>
                <SteamButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New Entry</SteamButton>
            </div>

            <SteamPanel title="Filter Apparatus" className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("steam-btn", filter === s && "steam-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="steam-input w-64" />
                </div>
            </SteamPanel>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--steam-brass)]" /></div> :
                filtered.length === 0 ? <SteamEmpty text={search || filter !== 'all' ? 'No matching entries' : 'No applications recorded'} /> :
                    <SteamPanel title={`${filtered.length} Entries`}><SteamTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><SteamBadge color={colors[a.status] || 'brass'}>{a.status}</SteamBadge></td><td><SteamBadge color={a.priority === 'high' ? 'copper' : 'brass'}>{a.priority}</SteamBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><SteamButton>Edit</SteamButton></Link></td></tr>))}</SteamTable></SteamPanel>}
        </SteamLayout>
    );
}
