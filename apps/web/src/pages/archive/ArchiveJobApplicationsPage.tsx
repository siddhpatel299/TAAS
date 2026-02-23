import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveButton, ArchiveBadge, ArchiveTable, ArchiveEmpty, ArchiveTitle } from '@/components/archive/ArchiveComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function ArchiveJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const variants: Record<string, 'default' | 'accent' | 'dark'> = { applied: 'default', interviewing: 'accent', offered: 'dark', rejected: 'default' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <ArchiveLayout>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><ArchiveButton><ArrowLeft className="w-4 h-4" /></ArchiveButton></Link><ArchiveTitle>Applications Index</ArchiveTitle></div>
                <ArchiveButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New Entry</ArchiveButton>
            </div>

            <ArchiveSection title="Filter">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("archive-btn", statusFilter === s && "archive-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="archive-input w-64" />
                </div>
            </ArchiveSection>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--archive-accent)]" /></div> :
                apps.length === 0 ? <ArchiveEmpty title={searchInput || statusFilter !== 'all' ? 'No matches found' : 'No applications'} text="Add your first job application to get started." /> :
                    <ArchiveSection title="All Entries" count={total}><ArchiveTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><ArchiveBadge variant={variants[a.status] || 'default'}>{a.status}</ArchiveBadge></td><td><ArchiveBadge variant={a.priority === 'high' ? 'accent' : 'default'}>{a.priority}</ArchiveBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ArchiveButton>Edit</ArchiveButton></Link></td></tr>))}</ArchiveTable></ArchiveSection>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--archive-border)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </ArchiveLayout>
    );
}
