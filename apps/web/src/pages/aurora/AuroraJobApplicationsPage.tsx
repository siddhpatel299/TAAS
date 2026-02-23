import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraBadge, AuroraTable, AuroraEmpty, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function AuroraJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'default' | 'teal' | 'pink' | 'purple'> = { applied: 'default', interviewing: 'teal', offered: 'purple', rejected: 'pink' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <AuroraLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><AuroraButton><ArrowLeft className="w-4 h-4" /></AuroraButton></Link><AuroraTitle>Applications</AuroraTitle></div>
                <AuroraButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New</AuroraButton>
            </div>

            <AuroraCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("aurora-btn", statusFilter === s && "aurora-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="aurora-input w-64" />
                </div>
            </AuroraCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--aurora-gradient-1)]" /></div> :
                apps.length === 0 ? <AuroraEmpty text={searchInput || statusFilter !== 'all' ? 'No matches' : 'No applications'} /> :
                    <AuroraCard><AuroraTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><AuroraBadge color={colors[a.status] || 'default'}>{a.status}</AuroraBadge></td><td><AuroraBadge color={a.priority === 'high' ? 'pink' : 'default'}>{a.priority}</AuroraBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><AuroraButton>Edit</AuroraButton></Link></td></tr>))}</AuroraTable></AuroraCard>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--aurora-border)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </AuroraLayout>
    );
}
