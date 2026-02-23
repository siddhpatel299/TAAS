import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassButton, GlassBadge, GlassTable, GlassEmpty, GlassTitle } from '@/components/glass/GlassComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function GlassJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const statusColors: Record<string, 'cyan' | 'pink' | 'purple'> = { applied: 'cyan', interviewing: 'purple', offered: 'cyan', rejected: 'pink' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

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
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="glass-input !pl-12" />
                </div>
            </GlassCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--glass-accent)]" /></div> :
                apps.length === 0 ? <GlassEmpty text={searchInput || statusFilter !== 'all' ? 'No matching apps' : 'No applications yet'} /> :
                    <GlassCard flat>
                        <GlassTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                            {apps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><GlassBadge color={statusColors[a.status] || 'cyan'}>{a.status}</GlassBadge></td><td><GlassBadge color={a.priority === 'high' ? 'pink' : 'cyan'}>{a.priority}</GlassBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><GlassButton>Edit</GlassButton></Link></td></tr>))}
                        </GlassTable>
                    </GlassCard>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--glass-border)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </GlassLayout>
    );
}
