import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecBadge, ExecTable, ExecEmpty, ExecTitle } from '@/components/exec/ExecComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function ExecJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'gold' | 'burgundy' | 'navy' | 'green'> = { applied: 'navy', interviewing: 'gold', offered: 'green', rejected: 'burgundy' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <ExecLayout>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><ExecButton><ArrowLeft className="w-4 h-4" /></ExecButton></Link><ExecTitle>Applications</ExecTitle></div>
                <ExecButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New Application</ExecButton>
            </div>

            <ExecCard className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("exec-btn uppercase", statusFilter === s && "exec-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="exec-input w-64" />
                </div>
            </ExecCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--exec-gold)]" /></div> :
                apps.length === 0 ? <ExecEmpty text={searchInput || statusFilter !== 'all' ? 'No matching applications' : 'No applications in portfolio'} /> :
                    <ExecCard><ExecTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><ExecBadge color={colors[a.status] || 'gold'}>{a.status}</ExecBadge></td><td><ExecBadge color={a.priority === 'high' ? 'burgundy' : 'gold'}>{a.priority}</ExecBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ExecButton>Review</ExecButton></Link></td></tr>))}</ExecTable></ExecCard>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--exec-gold)]/20">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </ExecLayout>
    );
}
