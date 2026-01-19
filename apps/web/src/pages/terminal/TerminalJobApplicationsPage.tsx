import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Search, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalBadge, TerminalTable, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { AddJobDialog } from '@/components/AddJobDialog';
import { jobTrackerApi } from '@/lib/plugins-api';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    wishlist: 'default', applied: 'info', interviewing: 'warning', offer: 'success', rejected: 'danger', withdrawn: 'default',
};

export function TerminalJobApplicationsPage() {
    const [apps, setApps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAdd, setShowAdd] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await jobTrackerApi.getApplications();
            setApps(res.data?.data || []);
        } catch (error) {
            console.error('Failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const filtered = apps.filter(app => {
        const matchSearch = !search || app.company.toLowerCase().includes(search.toLowerCase()) || app.jobTitle.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const statuses = ['all', 'wishlist', 'applied', 'interviewing', 'offer', 'rejected'];

    return (
        <TerminalLayout>
            <TerminalHeader
                title="Applications"
                subtitle={`${apps.length} total`}
                actions={<TerminalButton variant="primary" onClick={() => setShowAdd(true)}><Plus className="w-3 h-3 mr-1" /> Add</TerminalButton>}
            />

            {/* Filters */}
            <TerminalPanel className="mb-4 !p-2">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--terminal-text-dim)]" />
                        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="terminal-input pl-7 !py-1" />
                    </div>
                    <div className="flex items-center gap-1">
                        {statuses.map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)} className={`px-2 py-1 text-[10px] uppercase ${statusFilter === s ? 'bg-[var(--terminal-amber)] text-black' : 'bg-[var(--terminal-dark)] border border-[var(--terminal-border)]'}`}>{s}</button>
                        ))}
                    </div>
                </div>
            </TerminalPanel>

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <TerminalEmpty icon={<Briefcase className="w-full h-full" />} text="No applications" action={<TerminalButton variant="primary" onClick={() => setShowAdd(true)}><Plus className="w-3 h-3 mr-1" /> Add</TerminalButton>} />
            ) : (
                <TerminalPanel>
                    <TerminalTable headers={['Company', 'Position', 'Location', 'Status', 'Action']}>
                        {filtered.map((app) => (
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

            <AddJobDialog isOpen={showAdd} onClose={() => { setShowAdd(false); loadData(); }} />
        </TerminalLayout>
    );
}
