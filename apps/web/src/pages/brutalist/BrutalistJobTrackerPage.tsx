import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistStat, BrutalistButton, BrutalistBadge, BrutalistTable, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function BrutalistJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    if (loading) return <BrutalistLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin" /></div></BrutalistLayout>;

    return (
        <BrutalistLayout>
            <BrutalistTitle>Job Tracker</BrutalistTitle>

            <div className="brutalist-grid brutalist-grid-4 mb-8">
                <BrutalistStat value={stats?.totalApplications || 0} label="Total" inverted />
                <BrutalistStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" />
                <BrutalistStat value={stats?.statusCounts?.offered || 0} label="Offers" />
                <BrutalistStat value={stats?.statusCounts?.applied || 0} label="Applied" />
            </div>

            <div className="brutalist-grid brutalist-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><BrutalistCard color="inverted" className="flex items-center gap-4"><Briefcase className="w-10 h-10" /><div><p className="font-bold text-lg uppercase">Applications</p><p className="text-sm">View all jobs</p></div></BrutalistCard></Link>
                <Link to="/plugins/job-tracker/outreach"><BrutalistCard color="gray" className="flex items-center gap-4"><Mail className="w-10 h-10" /><div><p className="font-bold text-lg uppercase">Outreach</p><p className="text-sm">Email tracking</p></div></BrutalistCard></Link>
                <Link to="/plugins/job-tracker/contacts"><BrutalistCard color="gray" className="flex items-center gap-4"><Users className="w-10 h-10" /><div><p className="font-bold text-lg uppercase">Contacts</p><p className="text-sm">Find HR contacts</p></div></BrutalistCard></Link>
            </div>

            <h2 className="text-xl font-bold uppercase mb-4">Recent Applications</h2>
            <BrutalistCard className="!p-0">
                {recentApps.length === 0 ? <div className="p-8 text-center font-semibold uppercase">No applications yet</div> : (
                    <BrutalistTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td className="font-bold">{a.company}</td><td>{a.jobTitle}</td><td><BrutalistBadge variant={a.status === 'offered' || a.status === 'interviewing' ? 'inverted' : 'default'}>{a.status}</BrutalistBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><BrutalistButton>Edit</BrutalistButton></Link></td></tr>))}
                    </BrutalistTable>
                )}
            </BrutalistCard>
        </BrutalistLayout>
    );
}
