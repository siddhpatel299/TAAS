import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicStat, ComicButton, ComicBadge, ComicTable, ComicTitle, ComicBurst } from '@/components/comic/ComicComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function ComicJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'yellow' | 'green' | 'blue' | 'red'> = { applied: 'yellow', interviewing: 'blue', offered: 'green', rejected: 'red' };

    if (loading) return <ComicLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--comic-blue)]" /></div></ComicLayout>;

    return (
        <ComicLayout>
            <ComicTitle>Job Tracker!</ComicTitle>
            <div className="comic-grid comic-grid-4 mb-8">
                <ComicStat value={stats?.totalApplications || 0} label="Total" />
                <ComicStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" />
                <ComicStat value={stats?.statusCounts?.offered || 0} label="Offers" />
                <ComicStat value={stats?.statusCounts?.applied || 0} label="Applied" />
            </div>
            <div className="comic-grid comic-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><ComicPanel title="Applications!"><div className="text-center py-4"><Briefcase className="w-12 h-12 mx-auto mb-3 text-[var(--comic-blue)]" /><ComicBurst>View All!</ComicBurst></div></ComicPanel></Link>
                <Link to="/plugins/job-tracker/outreach"><ComicPanel title="Outreach!"><div className="text-center py-4"><Mail className="w-12 h-12 mx-auto mb-3 text-[var(--comic-purple)]" /><ComicBurst>Emails!</ComicBurst></div></ComicPanel></Link>
                <Link to="/plugins/job-tracker/contacts"><ComicPanel title="Contacts!"><div className="text-center py-4"><Users className="w-12 h-12 mx-auto mb-3 text-[var(--comic-green)]" /><ComicBurst>Find HR!</ComicBurst></div></ComicPanel></Link>
            </div>
            <ComicPanel title="Recent Applications!">
                {recentApps.length === 0 ? <div className="p-8 text-center font-bold">No applications yet!</div> : (
                    <ComicTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td className="font-bold">{a.company}</td><td>{a.jobTitle}</td><td><ComicBadge color={colors[a.status] || 'yellow'}>{a.status.toUpperCase()}!</ComicBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ComicButton>Edit!</ComicButton></Link></td></tr>))}
                    </ComicTable>
                )}
            </ComicPanel>
        </ComicLayout>
    );
}
