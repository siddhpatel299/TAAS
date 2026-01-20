import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecStat, ExecButton, ExecBadge, ExecTable, ExecTitle } from '@/components/exec/ExecComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function ExecJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'gold' | 'burgundy' | 'navy' | 'green'> = { applied: 'navy', interviewing: 'gold', offered: 'green', rejected: 'burgundy' };

    if (loading) return <ExecLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--exec-gold)]" /></div></ExecLayout>;

    return (
        <ExecLayout>
            <ExecTitle subtitle="Track your career advancement">Career Portfolio</ExecTitle>

            <div className="exec-grid exec-grid-4 mb-10">
                <ExecCard><ExecStat value={stats?.totalApplications || 0} label="Total Applications" /></ExecCard>
                <ExecCard><ExecStat value={stats?.statusCounts?.interviewing || 0} label="In Progress" /></ExecCard>
                <ExecCard><ExecStat value={stats?.statusCounts?.offered || 0} label="Offers" /></ExecCard>
                <ExecCard><ExecStat value={stats?.statusCounts?.applied || 0} label="Submitted" /></ExecCard>
            </div>

            <div className="exec-grid exec-grid-3 mb-10">
                <Link to="/plugins/job-tracker/applications"><ExecCard><p className="text-[var(--exec-gold)] uppercase tracking-wider text-sm" style={{ fontFamily: 'var(--font-exec-heading)' }}>Applications</p></ExecCard></Link>
                <Link to="/plugins/job-tracker/outreach"><ExecCard><p className="text-[var(--exec-gold)] uppercase tracking-wider text-sm" style={{ fontFamily: 'var(--font-exec-heading)' }}>Correspondence</p></ExecCard></Link>
                <Link to="/plugins/job-tracker/contacts"><ExecCard><p className="text-[var(--exec-gold)] uppercase tracking-wider text-sm" style={{ fontFamily: 'var(--font-exec-heading)' }}>Contact Directory</p></ExecCard></Link>
            </div>

            <ExecCard>
                <h3 className="text-[var(--exec-gold)] uppercase tracking-wider text-sm mb-6" style={{ fontFamily: 'var(--font-exec-heading)' }}>Recent Activity</h3>
                {recentApps.length === 0 ? <p className="text-center py-8 text-[var(--exec-text-muted)] italic">No applications in portfolio</p> : (
                    <ExecTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><ExecBadge color={colors[a.status] || 'gold'}>{a.status}</ExecBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ExecButton>Review</ExecButton></Link></td></tr>))}
                    </ExecTable>
                )}
            </ExecCard>
        </ExecLayout>
    );
}
