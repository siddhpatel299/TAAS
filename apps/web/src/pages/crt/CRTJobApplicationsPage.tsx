import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTButton, CRTBadge, CRTTable, CRTEmpty, CRTTitle } from '@/components/crt/CRTComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function CRTJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const statusColors: Record<string, 'green' | 'amber' | 'blue' | 'red'> = { applied: 'amber', interviewing: 'blue', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <CRTLayout>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker"><CRTButton><ArrowLeft className="w-4 h-4" /></CRTButton></Link>
                    <CRTTitle>Applications</CRTTitle>
                </div>
                <CRTButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> [NEW]</CRTButton>
            </div>

            <div className="crt-box mb-4 flex items-center justify-between">
                <div className="flex gap-1">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("crt-btn !px-2 !py-1 !text-xs", statusFilter === s && "crt-btn-primary")}>[{s.toUpperCase()}]</button>))}</div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--crt-green-dim)]" />
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="SEARCH..." className="crt-input !pl-10" />
                </div>
            </div>

            <CRTPanel header="Application Log">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--crt-green)]" /></div> :
                    apps.length === 0 ? <CRTEmpty text={searchInput || statusFilter !== 'all' ? 'NO MATCH' : 'NO APPLICATIONS'} /> :
                        <CRTTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                            {apps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><CRTBadge color={statusColors[a.status] || 'amber'}>{a.status}</CRTBadge></td><td><CRTBadge color={a.priority === 'high' ? 'red' : 'green'}>{a.priority}</CRTBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><CRTButton>[EDIT]</CRTButton></Link></td></tr>))}
                        </CRTTable>}
            </CRTPanel>

            {apps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--crt-green-dim)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </CRTLayout>
    );
}
