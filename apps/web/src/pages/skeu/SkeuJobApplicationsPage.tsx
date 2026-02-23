import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuButton, SkeuBadge, SkeuTable, SkeuEmpty, SkeuTitle } from '@/components/skeu/SkeuComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function SkeuJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'green' | 'blue' | 'orange' | 'red' | 'purple'> = { applied: 'blue', interviewing: 'purple', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <SkeuLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><SkeuButton><ArrowLeft className="w-4 h-4" /></SkeuButton></Link><SkeuTitle>Applications</SkeuTitle></div>
                <SkeuButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New Application</SkeuButton>
            </div>

            <SkeuCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("skeu-btn", statusFilter === s && "skeu-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="skeu-input w-64" />
                </div>
            </SkeuCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--skeu-led-blue)]" /></div> :
                apps.length === 0 ? <SkeuEmpty text={searchInput || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet'} /> :
                    <SkeuCard><SkeuTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><SkeuBadge color={colors[a.status] || 'blue'}>{a.status}</SkeuBadge></td><td><SkeuBadge color={a.priority === 'high' ? 'red' : 'blue'}>{a.priority}</SkeuBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><SkeuButton>Edit</SkeuButton></Link></td></tr>))}</SkeuTable></SkeuCard>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--skeu-border)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </SkeuLayout>
    );
}
