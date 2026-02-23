import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiButton, OrigamiBadge, OrigamiTable, OrigamiInput, OrigamiEmpty } from '@/components/origami/OrigamiComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';

export function OrigamiJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const statusColors: Record<string, 'default' | 'terracotta' | 'sage' | 'slate' | 'warning'> = {
        applied: 'default', interviewing: 'terracotta', offered: 'sage', rejected: 'slate', saved: 'warning',
    };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <OrigamiLayout>
            <OrigamiHeader
                title="Applications"
                subtitle={`${total} applications`}
                actions={
                    <div className="flex items-center gap-3">
                        <Link to="/plugins/job-tracker"><OrigamiButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</OrigamiButton></Link>
                        <OrigamiButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4 mr-2" /> Add</OrigamiButton>
                    </div>
                }
            />

            <OrigamiCard className="mb-6 !p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {statuses.map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${statusFilter === status ? 'bg-[var(--origami-terracotta)] text-white' : 'bg-[var(--origami-bg)] text-[var(--origami-text-dim)] hover:text-[var(--origami-text)]'}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                    <OrigamiInput value={searchInput} onChange={setSearchInput} placeholder="Search..." icon={<Search className="w-4 h-4" />} className="w-64" />
                </div>
            </OrigamiCard>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--origami-terracotta)] animate-spin" /></div>
            ) : apps.length === 0 ? (
                <OrigamiEmpty icon={<Search className="w-8 h-8" />} text={searchInput || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet'} action={<OrigamiButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4 mr-2" /> Add First</OrigamiButton>} />
            ) : (
                <OrigamiCard className="!p-0 overflow-hidden">
                    <OrigamiTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                        {apps.map((app) => (
                            <tr key={app.id}>
                                <td className="font-medium">{app.company}</td>
                                <td className="text-[var(--origami-text-dim)]">{app.jobTitle}</td>
                                <td><OrigamiBadge variant={statusColors[app.status] || 'default'}>{app.status}</OrigamiBadge></td>
                                <td><OrigamiBadge variant={app.priority === 'high' ? 'terracotta' : app.priority === 'medium' ? 'warning' : 'default'}>{app.priority}</OrigamiBadge></td>
                                <td><Link to={`/plugins/job-tracker/applications/${app.id}`}><OrigamiButton variant="ghost">Edit</OrigamiButton></Link></td>
                            </tr>
                        ))}
                    </OrigamiTable>
                </OrigamiCard>
            )}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--origami-border)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </OrigamiLayout>
    );
}
