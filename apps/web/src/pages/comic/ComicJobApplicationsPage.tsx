import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicButton, ComicBadge, ComicTable, ComicEmpty, ComicTitle } from '@/components/comic/ComicComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function ComicJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'yellow' | 'green' | 'blue' | 'red'> = { applied: 'yellow', interviewing: 'blue', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <ComicLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><Link to="/plugins/job-tracker"><ComicButton><ArrowLeft className="w-5 h-5" /></ComicButton></Link><ComicTitle>Applications!</ComicTitle></div>
                <ComicButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-5 h-5" /> NEW!</ComicButton>
            </div>
            <ComicPanel title="Filter!">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("comic-btn", statusFilter === s && "comic-btn-primary")}>{s.toUpperCase()}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="comic-input w-64" />
                </div>
            </ComicPanel>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--comic-blue)]" /></div> :
                apps.length === 0 ? <ComicEmpty text={searchInput || statusFilter !== 'all' ? 'No matches!' : 'No applications!'} /> :
                    <ComicPanel title={`${total} Applications!`}><ComicTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td className="font-bold">{a.company}</td><td>{a.jobTitle}</td><td><ComicBadge color={colors[a.status] || 'yellow'}>{a.status.toUpperCase()}!</ComicBadge></td><td><ComicBadge color={a.priority === 'high' ? 'red' : 'blue'}>{a.priority}</ComicBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ComicButton>Edit!</ComicButton></Link></td></tr>))}</ComicTable></ComicPanel>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-[var(--comic-black)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </ComicLayout>
    );
}
