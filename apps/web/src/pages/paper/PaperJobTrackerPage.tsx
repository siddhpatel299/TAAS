import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperSticky, PaperStat, PaperButton, PaperBadge, PaperTable, PaperTitle } from '@/components/paper/PaperComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function PaperJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'red' | 'blue' | 'green'> = { applied: 'blue', interviewing: 'blue', offered: 'green', rejected: 'red' };

    if (loading) return <PaperLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--ink-blue)]" /></div></PaperLayout>;

    return (
        <PaperLayout>
            <PaperTitle subtitle="track your job search">💼 Job Tracker</PaperTitle>

            <div className="paper-grid paper-grid-4 mb-8">
                <PaperSticky color="yellow"><PaperStat value={stats?.totalApplications || 0} label="Total" /></PaperSticky>
                <PaperSticky color="blue"><PaperStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" /></PaperSticky>
                <PaperSticky color="green"><PaperStat value={stats?.statusCounts?.offered || 0} label="Offers" /></PaperSticky>
                <PaperSticky color="pink"><PaperStat value={stats?.statusCounts?.applied || 0} label="Applied" /></PaperSticky>
            </div>

            <div className="paper-grid paper-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><PaperCard><p style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem' }}>📋 Applications</p></PaperCard></Link>
                <Link to="/plugins/job-tracker/outreach"><PaperCard><p style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem' }}>✉️ Outreach</p></PaperCard></Link>
                <Link to="/plugins/job-tracker/contacts"><PaperCard><p style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem' }}>👤 Contact Finder</p></PaperCard></Link>
            </div>

            <PaperCard>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginBottom: '16px' }}>Recent Activity</h3>
                {recentApps.length === 0 ? <p className="text-center py-8 text-[var(--ink-blue)]">no applications yet...</p> : (
                    <PaperTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.25rem' }}>{a.company}</td><td>{a.jobTitle}</td><td><PaperBadge color={colors[a.status] || 'blue'}>{a.status}</PaperBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><PaperButton>edit</PaperButton></Link></td></tr>))}
                    </PaperTable>
                )}
            </PaperCard>
        </PaperLayout>
    );
}
