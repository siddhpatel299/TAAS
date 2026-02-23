import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintButton, NewsprintBadge, NewsprintTable, NewsprintInput, NewsprintEmpty } from '@/components/newsprint/NewsprintComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';

export function NewsprintJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();

    const statusColors: Record<string, 'default' | 'red' | 'blue'> = { applied: 'default', interviewing: 'blue', offered: 'blue', rejected: 'red', saved: 'default' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <NewsprintLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker"><NewsprintButton><ArrowLeft className="w-4 h-4" /></NewsprintButton></Link>
                    <h1 className="text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Job Applications</h1>
                </div>
                <NewsprintButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4 mr-2" /> New Application</NewsprintButton>
            </div>

            <NewsprintCard className="mb-6 !p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs uppercase tracking-wide border ${statusFilter === s ? 'bg-[var(--newsprint-ink)] text-[var(--newsprint-paper)] border-[var(--newsprint-ink)]' : 'border-[var(--newsprint-rule-light)] text-[var(--newsprint-ink-muted)]'}`} style={{ fontFamily: 'var(--font-sans)' }}>{s}</button>))}</div>
                    <NewsprintInput value={searchInput} onChange={setSearchInput} placeholder="Search..." icon={<Search className="w-4 h-4" />} className="w-64" />
                </div>
            </NewsprintCard>

            <NewsprintSection title={`${total} Applications`}>
                {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div> :
                    apps.length === 0 ? <NewsprintEmpty text={searchInput || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet. Add your first one!'} /> :
                        <NewsprintCard className="!p-0">
                            <NewsprintTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                                {apps.map((a) => (<tr key={a.id}><td style={{ fontFamily: 'var(--font-headline)' }}>{a.company}</td><td className="text-[var(--newsprint-ink-muted)]">{a.jobTitle}</td><td><NewsprintBadge variant={statusColors[a.status] || 'default'}>{a.status}</NewsprintBadge></td><td><NewsprintBadge variant={a.priority === 'high' ? 'red' : 'default'}>{a.priority}</NewsprintBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><NewsprintButton>Edit</NewsprintButton></Link></td></tr>))}
                            </NewsprintTable>
                        </NewsprintCard>}
            </NewsprintSection>

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--newsprint-rule-light)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </NewsprintLayout>
    );
}
