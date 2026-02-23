import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelBadge, PixelTable, PixelEmpty, PixelTitle } from '@/components/pixel/PixelComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function PixelJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'red' | 'green' | 'blue' | 'yellow'> = { applied: 'blue', interviewing: 'yellow', offered: 'green', rejected: 'red' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <PixelLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><PixelButton><ArrowLeft className="w-4 h-4" /></PixelButton></Link><PixelTitle>APPLICATIONS</PixelTitle></div>
                <PixelButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> NEW</PixelButton>
            </div>

            <PixelCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("pixel-btn", statusFilter === s && "pixel-btn-primary")}>{s.toUpperCase()}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="> SEARCH..." className="pixel-input w-48" />
                </div>
            </PixelCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--pixel-cyan)]" /></div> :
                apps.length === 0 ? <PixelEmpty text={searchInput || statusFilter !== 'all' ? 'NO MATCHES' : 'NO APPLICATIONS'} /> :
                    <PixelCard><PixelTable headers={['Company', 'Role', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><PixelBadge color={colors[a.status] || 'blue'}>{a.status.toUpperCase()}</PixelBadge></td><td><PixelBadge color={a.priority === 'high' ? 'red' : 'blue'}>{a.priority?.toUpperCase()}</PixelBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><PixelButton>EDIT</PixelButton></Link></td></tr>))}</PixelTable></PixelCard>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--pixel-cyan)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </PixelLayout>
    );
}
