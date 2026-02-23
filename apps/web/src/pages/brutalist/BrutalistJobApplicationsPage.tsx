import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistButton, BrutalistBadge, BrutalistTable, BrutalistEmpty, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function BrutalistJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <BrutalistLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker"><BrutalistButton><ArrowLeft className="w-5 h-5" /></BrutalistButton></Link>
                    <BrutalistTitle>Applications</BrutalistTitle>
                </div>
                <BrutalistButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-5 h-5" /> New</BrutalistButton>
            </div>

            <BrutalistCard className="mb-6 flex items-center justify-between">
                <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("brutalist-btn !shadow-none", statusFilter === s && "brutalist-btn-primary")}>{s}</button>))}</div>
                <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="brutalist-input !pl-12" />
                </div>
            </BrutalistCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin" /></div> :
                apps.length === 0 ? <BrutalistEmpty text={searchInput || statusFilter !== 'all' ? 'No matching apps' : 'No applications yet'} /> :
                    <BrutalistCard className="!p-0">
                        <BrutalistTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                            {apps.map((a) => (<tr key={a.id}><td className="font-bold">{a.company}</td><td>{a.jobTitle}</td><td><BrutalistBadge variant={a.status === 'offered' || a.status === 'interviewing' ? 'inverted' : 'default'}>{a.status}</BrutalistBadge></td><td><BrutalistBadge variant={a.priority === 'high' ? 'inverted' : 'default'}>{a.priority}</BrutalistBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><BrutalistButton>Edit</BrutalistButton></Link></td></tr>))}
                        </BrutalistTable>
                    </BrutalistCard>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-black">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </BrutalistLayout>
    );
}
