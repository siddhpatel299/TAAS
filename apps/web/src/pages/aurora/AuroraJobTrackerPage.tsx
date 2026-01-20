import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraStat, AuroraButton, AuroraBadge, AuroraTable, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function AuroraJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'default' | 'teal' | 'pink' | 'purple'> = { applied: 'default', interviewing: 'teal', offered: 'purple', rejected: 'pink' };

    if (loading) return <AuroraLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--aurora-gradient-1)]" /></div></AuroraLayout>;

    return (
        <AuroraLayout>
            <AuroraTitle subtitle="Manage your career journey">Job Tracker</AuroraTitle>

            <div className="aurora-grid aurora-grid-4 mb-8">
                <AuroraStat value={stats?.totalApplications || 0} label="Total" />
                <AuroraStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" />
                <AuroraStat value={stats?.statusCounts?.offered || 0} label="Offers" />
                <AuroraStat value={stats?.statusCounts?.applied || 0} label="Applied" />
            </div>

            <div className="aurora-grid aurora-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><AuroraCard glow><div className="text-center py-2"><Briefcase className="w-8 h-8 mx-auto mb-2 text-[var(--aurora-gradient-1)]" /><p className="font-medium">Applications</p></div></AuroraCard></Link>
                <Link to="/plugins/job-tracker/outreach"><AuroraCard glow><div className="text-center py-2"><Mail className="w-8 h-8 mx-auto mb-2 text-[var(--aurora-teal)]" /><p className="font-medium">Outreach</p></div></AuroraCard></Link>
                <Link to="/plugins/job-tracker/contacts"><AuroraCard glow><div className="text-center py-2"><Users className="w-8 h-8 mx-auto mb-2 text-[var(--aurora-purple)]" /><p className="font-medium">Contact Finder</p></div></AuroraCard></Link>
            </div>

            <AuroraCard>
                <h3 className="font-semibold mb-4">Recent Applications</h3>
                {recentApps.length === 0 ? <p className="text-center py-8 text-[var(--aurora-text-muted)]">No applications yet</p> : (
                    <AuroraTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><AuroraBadge color={colors[a.status] || 'default'}>{a.status}</AuroraBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><AuroraButton>Edit</AuroraButton></Link></td></tr>))}
                    </AuroraTable>
                )}
            </AuroraCard>
        </AuroraLayout>
    );
}
