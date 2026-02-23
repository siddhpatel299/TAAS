import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperButton, PaperBadge, PaperTable, PaperEmpty, PaperTitle } from '@/components/paper/PaperComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function PaperJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'red' | 'blue' | 'green'> = { applied: 'blue', interviewing: 'blue', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <PaperLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><PaperButton><ArrowLeft className="w-4 h-4" /></PaperButton></Link><PaperTitle>📋 Applications</PaperTitle></div>
                <PaperButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New</PaperButton>
            </div>

            <PaperCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("paper-btn", statusFilter === s && "paper-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="search..." className="paper-input w-48" />
                </div>
            </PaperCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--ink-blue)]" /></div> :
                apps.length === 0 ? <PaperEmpty text={searchInput || statusFilter !== 'all' ? 'nothing found...' : 'no applications yet!'} /> :
                    <PaperCard><PaperTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.25rem' }}>{a.company}</td><td>{a.jobTitle}</td><td><PaperBadge color={colors[a.status] || 'blue'}>{a.status}</PaperBadge></td><td><PaperBadge>{a.priority}</PaperBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><PaperButton>edit</PaperButton></Link></td></tr>))}</PaperTable></PaperCard>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--ink-blue)]/20">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </PaperLayout>
    );
}
