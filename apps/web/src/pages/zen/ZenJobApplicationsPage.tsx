import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenBadge, ZenTable, ZenEmpty, ZenTitle, ZenSection } from '@/components/zen/ZenComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function ZenJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'default' | 'accent' | 'sage' | 'sand'> = { applied: 'default', interviewing: 'sage', offered: 'accent', rejected: 'sand' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <ZenLayout>
            <div className="flex items-center justify-between" style={{ marginBottom: '64px' }}>
                <div className="flex items-center gap-6"><Link to="/plugins/job-tracker"><ZenButton><ArrowLeft className="w-3 h-3" /></ZenButton></Link><ZenTitle>Applications</ZenTitle></div>
                <ZenButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-3 h-3" /> New</ZenButton>
            </div>

            <ZenSection>
                <div className="flex items-center justify-between" style={{ marginBottom: '40px' }}>
                    <div className="flex gap-3">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("zen-btn", statusFilter === s && "zen-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search" className="zen-input" style={{ maxWidth: '200px' }} />
                </div>
            </ZenSection>

            {loading ? <div className="flex items-center justify-center" style={{ minHeight: '30vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div> :
                apps.length === 0 ? <ZenEmpty text={searchInput || statusFilter !== 'all' ? 'No results' : 'No applications'} /> :
                    <ZenSection><ZenCard><ZenTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><ZenBadge color={colors[a.status] || 'default'}>{a.status}</ZenBadge></td><td><ZenBadge>{a.priority}</ZenBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ZenButton>Edit</ZenButton></Link></td></tr>))}</ZenTable></ZenCard></ZenSection>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--zen-border)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </ZenLayout>
    );
}
