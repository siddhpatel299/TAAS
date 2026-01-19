import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, Mail, Users, ArrowRight, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintStat, BlueprintButton, BlueprintBadge, BlueprintTable } from '@/components/blueprint/BlueprintComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function BlueprintJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]);
            setStats(s.data?.data); setRecentApps(a.data?.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const statusColors: Record<string, 'default' | 'cyan' | 'green' | 'orange' | 'red'> = { applied: 'default', interviewing: 'cyan', offered: 'green', rejected: 'red', saved: 'orange' };
    const quickLinks = [{ icon: FileText, label: 'Applications', path: '/plugins/job-tracker/applications' }, { icon: Mail, label: 'Outreach', path: '/plugins/job-tracker/outreach' }, { icon: Users, label: 'Contacts', path: '/plugins/job-tracker/contacts' }];

    if (loading) return <BlueprintLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div></BlueprintLayout>;

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Job Tracker" subtitle="Application tracking" actions={<Link to="/plugins/job-tracker/applications"><BlueprintButton variant="primary"><Briefcase className="w-4 h-4 mr-2" /> All Jobs</BlueprintButton></Link>} />
            <div className="blueprint-grid blueprint-grid-4 mb-6">
                <BlueprintCard corners><BlueprintStat value={stats?.totalApplications || 0} label="Total" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={stats?.statusCounts?.offered || 0} label="Offers" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={stats?.statusCounts?.applied || 0} label="Applied" /></BlueprintCard>
            </div>
            <div className="blueprint-grid blueprint-grid-3 gap-6">
                <div>
                    <h2 className="text-xs uppercase tracking-widest text-[var(--blueprint-cyan)] mb-4">Quick Access</h2>
                    <div className="space-y-3">
                        {quickLinks.map((l) => (<Link key={l.path} to={l.path}><BlueprintCard className="flex items-center gap-4 !p-4 cursor-pointer"><l.icon className="w-4 h-4 text-[var(--blueprint-cyan)]" /><span className="text-sm uppercase tracking-wide">{l.label}</span><ArrowRight className="w-4 h-4 ml-auto text-[var(--blueprint-text-dim)]" /></BlueprintCard></Link>))}
                    </div>
                </div>
                <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4"><h2 className="text-xs uppercase tracking-widest text-[var(--blueprint-cyan)]">Recent Applications</h2><Link to="/plugins/job-tracker/applications" className="text-xs text-[var(--blueprint-text-dim)]">VIEW ALL →</Link></div>
                    <BlueprintCard className="!p-0 overflow-hidden">
                        {recentApps.length === 0 ? <div className="p-8 text-center text-[var(--blueprint-text-dim)]">No applications</div> : (
                            <BlueprintTable headers={['Company', 'Position', 'Status']}>
                                {recentApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td className="text-[var(--blueprint-text-dim)]">{a.jobTitle}</td><td><BlueprintBadge variant={statusColors[a.status] || 'default'}>{a.status}</BlueprintBadge></td></tr>))}
                            </BlueprintTable>
                        )}
                    </BlueprintCard>
                </div>
            </div>
        </BlueprintLayout>
    );
}
