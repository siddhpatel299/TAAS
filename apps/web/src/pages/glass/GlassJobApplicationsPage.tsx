import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassButton, GlassBadge, GlassTable, GlassEmpty, GlassTitle } from '@/components/glass/GlassComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function GlassJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadApps = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadApps(); }, [loadApps]);

    const statusColors: Record<string, 'cyan' | 'pink' | 'purple'> = { applied: 'cyan', interviewing: 'purple', offered: 'cyan', rejected: 'pink' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filteredApps = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = statusFilter === 'all' || a.status === statusFilter; return ms && mst; });

    return (
        <GlassLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker"><GlassButton><ArrowLeft className="w-5 h-5" /></GlassButton></Link>
                    <GlassTitle>Applications</GlassTitle>
                </div>
                <GlassButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-5 h-5" /> New</GlassButton>
            </div>

            <GlassCard flat className="mb-6 flex items-center justify-between">
                <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("glass-btn !py-2", statusFilter === s && "glass-btn-primary")}>{s}</button>))}</div>
                <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--glass-text-muted)]" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="glass-input !pl-12" />
                </div>
            </GlassCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--glass-accent)]" /></div> :
                filteredApps.length === 0 ? <GlassEmpty text={search || statusFilter !== 'all' ? 'No matching apps' : 'No applications yet'} /> :
                    <GlassCard flat>
                        <GlassTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                            {filteredApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><GlassBadge color={statusColors[a.status] || 'cyan'}>{a.status}</GlassBadge></td><td><GlassBadge color={a.priority === 'high' ? 'pink' : 'cyan'}>{a.priority}</GlassBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><GlassButton>Edit</GlassButton></Link></td></tr>))}
                        </GlassTable>
                    </GlassCard>}
        </GlassLayout>
    );
}
