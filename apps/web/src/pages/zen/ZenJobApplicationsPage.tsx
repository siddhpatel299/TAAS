import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenBadge, ZenTable, ZenEmpty, ZenTitle, ZenSection } from '@/components/zen/ZenComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

export function ZenJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getApplications(); setApps(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'default' | 'accent' | 'sage' | 'sand'> = { applied: 'default', interviewing: 'sage', offered: 'accent', rejected: 'sand' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];
    const filtered = apps.filter(a => { const ms = !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.jobTitle?.toLowerCase().includes(search.toLowerCase()); const mst = filter === 'all' || a.status === filter; return ms && mst; });

    return (
        <ZenLayout>
            <div className="flex items-center justify-between" style={{ marginBottom: '64px' }}>
                <div className="flex items-center gap-6"><Link to="/plugins/job-tracker"><ZenButton><ArrowLeft className="w-3 h-3" /></ZenButton></Link><ZenTitle>Applications</ZenTitle></div>
                <ZenButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-3 h-3" /> New</ZenButton>
            </div>

            <ZenSection>
                <div className="flex items-center justify-between" style={{ marginBottom: '40px' }}>
                    <div className="flex gap-3">{statuses.map(s => (<button key={s} onClick={() => setFilter(s)} className={cn("zen-btn", filter === s && "zen-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="zen-input" style={{ maxWidth: '200px' }} />
                </div>
            </ZenSection>

            {loading ? <div className="flex items-center justify-center" style={{ minHeight: '30vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div> :
                filtered.length === 0 ? <ZenEmpty text={search || filter !== 'all' ? 'No results' : 'No applications'} /> :
                    <ZenSection><ZenCard><ZenTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{filtered.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><ZenBadge color={colors[a.status] || 'default'}>{a.status}</ZenBadge></td><td><ZenBadge>{a.priority}</ZenBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ZenButton>Edit</ZenButton></Link></td></tr>))}</ZenTable></ZenCard></ZenSection>}
        </ZenLayout>
    );
}
