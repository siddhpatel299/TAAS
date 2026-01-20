import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveButton, ArchiveBadge, ArchiveTable, ArchiveEmpty, ArchiveTitle } from '@/components/archive/ArchiveComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function ArchiveJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const variants: Record<string, 'default' | 'accent' | 'dark'> = { applied: 'default', interviewing: 'accent', offered: 'dark', rejected: 'default' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <ArchiveLayout>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><ArchiveButton><ArrowLeft className="w-4 h-4" /></ArchiveButton></Link><ArchiveTitle>Applications Index</ArchiveTitle></div>
                <ArchiveButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New Entry</ArchiveButton>
            </div>

            <ArchiveSection title="Filter">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("archive-btn", filter === s && "archive-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="archive-input w-64" />
                </div>
            </ArchiveSection>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--archive-accent)]" /></div> :
                filtered.length === 0 ? <ArchiveEmpty title={search || filter !== 'all' ? 'No matches found' : 'No applications'} text="Add your first job application to get started." /> :
                    <ArchiveSection title="All Entries" count={filtered.length}><ArchiveTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><ArchiveBadge variant={variants[a.status] || 'default'}>{a.status}</ArchiveBadge></td><td><ArchiveBadge variant={a.priority === 'high' ? 'accent' : 'default'}>{a.priority}</ArchiveBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ArchiveButton>Edit</ArchiveButton></Link></td></tr>))}</ArchiveTable></ArchiveSection>}
        </ArchiveLayout>
    );
}
