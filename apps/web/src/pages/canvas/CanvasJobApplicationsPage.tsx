import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2, Briefcase } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasButton, CanvasBadge, CanvasTable, CanvasEmpty, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function CanvasJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'blue' | 'pink' | 'purple'> = { applied: 'blue', interviewing: 'purple', offered: 'blue', rejected: 'pink' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <CanvasLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><Link to="/plugins/job-tracker"><CanvasButton><ArrowLeft className="w-4 h-4" /></CanvasButton></Link><CanvasTitle>Applications</CanvasTitle></div>
                <CanvasButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New</CanvasButton>
            </div>
            <CanvasWindow title="Filters" icon={<Search className="w-4 h-4" />} zLevel="far" className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("canvas-btn !py-1.5", filter === s && "canvas-btn-primary")}>{s}</button>))}</div>
                    <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--canvas-text-muted)]" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="canvas-input !pl-10" /></div>
                </div>
            </CanvasWindow>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--canvas-accent)]" /></div> :
                filtered.length === 0 ? <CanvasEmpty text={search || filter !== 'all' ? 'No matches' : 'No applications'} icon={<Briefcase className="w-10 h-10" />} /> :
                    <CanvasWindow title={`Applications (${filtered.length})`} icon={<Briefcase className="w-4 h-4" />} zLevel="mid"><CanvasTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><CanvasBadge color={colors[a.status] || 'blue'}>{a.status}</CanvasBadge></td><td><CanvasBadge color={a.priority === 'high' ? 'pink' : 'blue'}>{a.priority}</CanvasBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><CanvasButton>Edit</CanvasButton></Link></td></tr>))}</CanvasTable></CanvasWindow>}
        </CanvasLayout>
    );
}
