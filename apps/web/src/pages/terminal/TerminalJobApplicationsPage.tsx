import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Search, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalBadge, TerminalTable, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { AddJobDialog } from '@/components/AddJobDialog';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    wishlist: 'default', applied: 'info', interviewing: 'warning', offer: 'success', rejected: 'danger', withdrawn: 'default',
};

export function TerminalJobApplicationsPage() {
    const [showAdd, setShowAdd] = useState(false);
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage, loadApps } = useJobApplicationsApi();
    const statuses = ['all', 'wishlist', 'applied', 'interviewing', 'offer', 'rejected'];

    return (
        <TerminalLayout>
            <TerminalHeader
                title="Applications"
                subtitle={`${total} total`}
                actions={<TerminalButton variant="primary" onClick={() => setShowAdd(true)}><Plus className="w-3 h-3 mr-1" /> Add</TerminalButton>}
            />

            {/* Filters */}
            <TerminalPanel className="mb-4 !p-2">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--terminal-text-dim)]" />
                        <input type="text" placeholder="Search..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="terminal-input pl-7 !py-1" />
                    </div>
                    <div className="flex items-center gap-1">
                        {statuses.map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)} className={`px-2 py-1 text-[10px] uppercase ${statusFilter === s ? 'bg-[var(--terminal-amber)] text-black' : 'bg-[var(--terminal-dark)] border border-[var(--terminal-border)]'}`}>{s}</button>
                        ))}
                    </div>
                </div>
            </TerminalPanel>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : apps.length === 0 ? (
                <TerminalEmpty icon={<Briefcase className="w-full h-full" />} text="No applications" action={<TerminalButton variant="primary" onClick={() => setShowAdd(true)}><Plus className="w-3 h-3 mr-1" /> Add</TerminalButton>} />
            ) : (
                <TerminalPanel>
                    <TerminalTable headers={['Company', 'Position', 'Location', 'Status', 'Action']}>
                        {apps.map((app) => (
                            <tr key={app.id}>
                                <td className="font-bold">{app.company}</td>
                                <td>{app.jobTitle}</td>
                                <td className="text-[var(--terminal-text-dim)]">{app.location || '—'}</td>
                                <td><TerminalBadge variant={statusColors[app.status]}>{app.status?.toUpperCase()}</TerminalBadge></td>
                                <td><Link to={`/plugins/job-tracker/applications/${app.id}`}><TerminalButton>Edit</TerminalButton></Link></td>
                            </tr>
                        ))}
                    </TerminalTable>
                </TerminalPanel>
            )}

            {apps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--terminal-border)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}

            <AddJobDialog isOpen={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => loadApps(1)} />
        </TerminalLayout>
    );
}
