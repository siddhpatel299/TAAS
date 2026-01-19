import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton, MidnightBadge, MidnightTable, MidnightInput, MidnightEmpty } from '@/components/midnight/MidnightComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function MidnightJobApplicationsPage() {
    const navigate = useNavigate();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadApps = useCallback(async () => {
        setLoading(true);
        try {
            const res = await jobTrackerApi.getApplications();
            setApps(res.data?.data || []);
        } catch (error) {
            console.error('Failed to load applications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadApps(); }, [loadApps]);

    const statusColors: Record<string, 'default' | 'gold' | 'success' | 'warning' | 'error'> = {
        applied: 'default', interviewing: 'gold', offered: 'success', rejected: 'error', saved: 'warning',
    };

    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    const filteredApps = apps.filter(app => {
        const matchesSearch = !search || app.company.toLowerCase().includes(search.toLowerCase()) || app.jobTitle?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <MidnightLayout>
            <MidnightHeader
                title="Job Applications"
                subtitle={`${apps.length} applications`}
                actions={
                    <div className="flex items-center gap-3">
                        <Link to="/plugins/job-tracker"><MidnightButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</MidnightButton></Link>
                        <MidnightButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4 mr-2" /> Add Application</MidnightButton>
                    </div>
                }
            />

            <MidnightCard className="mb-6 !p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {statuses.map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === status ? 'bg-[var(--midnight-gold)] text-[var(--midnight-bg)]' : 'bg-[var(--midnight-surface)] text-[var(--midnight-text-dim)] hover:text-[var(--midnight-text)]'}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                    <MidnightInput value={search} onChange={setSearch} placeholder="Search..." icon={<Search className="w-4 h-4" />} className="w-64" />
                </div>
            </MidnightCard>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div>
            ) : filteredApps.length === 0 ? (
                <MidnightEmpty icon={<Search className="w-8 h-8" />} text={search || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet'} action={<MidnightButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4 mr-2" /> Add First Application</MidnightButton>} />
            ) : (
                <MidnightCard className="!p-0 overflow-hidden">
                    <MidnightTable headers={['Company', 'Position', 'Status', 'Priority', '']}>
                        {filteredApps.map((app) => (
                            <tr key={app.id}>
                                <td className="font-medium">{app.company}</td>
                                <td className="text-[var(--midnight-text-dim)]">{app.jobTitle}</td>
                                <td><MidnightBadge variant={statusColors[app.status] || 'default'}>{app.status}</MidnightBadge></td>
                                <td><MidnightBadge variant={app.priority === 'high' ? 'error' : app.priority === 'medium' ? 'warning' : 'default'}>{app.priority}</MidnightBadge></td>
                                <td><Link to={`/plugins/job-tracker/applications/${app.id}`}><MidnightButton variant="ghost">Edit</MidnightButton></Link></td>
                            </tr>
                        ))}
                    </MidnightTable>
                </MidnightCard>
            )}
        </MidnightLayout>
    );
}
