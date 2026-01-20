import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintStat, NewsprintButton, NewsprintBadge, NewsprintArticle, NewsprintTable } from '@/components/newsprint/NewsprintComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function NewsprintJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    const statusColors: Record<string, 'default' | 'red' | 'blue'> = { applied: 'default', interviewing: 'blue', offered: 'blue', rejected: 'red', saved: 'default' };

    if (loading) return <NewsprintLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin" /></div></NewsprintLayout>;

    return (
        <NewsprintLayout>
            <NewsprintArticle headline="Job Tracker" headlineSize="large" byline="Your Employment Search Headquarters">
                <div className="newsprint-article-body">
                    <p>Track your job applications, manage outreach campaigns, and find the right contacts at your target companies. Your comprehensive employment search command center.</p>
                </div>
                <div className="flex gap-3 mt-6">
                    <Link to="/plugins/job-tracker/applications"><NewsprintButton variant="primary"><Briefcase className="w-4 h-4" /> All Applications</NewsprintButton></Link>
                    <Link to="/plugins/job-tracker/outreach"><NewsprintButton><Mail className="w-4 h-4" /> Outreach</NewsprintButton></Link>
                    <Link to="/plugins/job-tracker/contacts"><NewsprintButton><Users className="w-4 h-4" /> Contacts</NewsprintButton></Link>
                </div>
            </NewsprintArticle>

            <div className="grid grid-cols-4 gap-4 my-8">
                <NewsprintStat value={stats?.totalApplications || 0} label="Total Applications" />
                <NewsprintStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" />
                <NewsprintStat value={stats?.statusCounts?.offered || 0} label="Offers" />
                <NewsprintStat value={stats?.statusCounts?.applied || 0} label="Applied" />
            </div>

            <NewsprintSection title="Recent Applications">
                <NewsprintCard className="!p-0">
                    {recentApps.length === 0 ? <div className="p-8 text-center text-[var(--newsprint-ink-muted)] italic">No applications yet</div> : (
                        <NewsprintTable headers={['Company', 'Position', 'Status', '']}>
                            {recentApps.map((a) => (<tr key={a.id}><td style={{ fontFamily: 'var(--font-headline)' }}>{a.company}</td><td className="text-[var(--newsprint-ink-muted)]">{a.jobTitle}</td><td><NewsprintBadge variant={statusColors[a.status] || 'default'}>{a.status}</NewsprintBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`} className="text-[var(--newsprint-red)] hover:underline text-sm">Edit</Link></td></tr>))}
                        </NewsprintTable>
                    )}
                </NewsprintCard>
            </NewsprintSection>
        </NewsprintLayout>
    );
}
