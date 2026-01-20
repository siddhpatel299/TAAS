import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTBox, CRTStat, CRTButton, CRTBadge, CRTTable, CRTTitle } from '@/components/crt/CRTComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function CRTJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    const statusColors: Record<string, 'green' | 'amber' | 'blue' | 'red'> = { applied: 'amber', interviewing: 'blue', offered: 'green', rejected: 'red' };

    if (loading) return <CRTLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--crt-green)]" /></div></CRTLayout>;

    return (
        <CRTLayout>
            <CRTTitle>Job Tracker</CRTTitle>

            <div className="crt-panels crt-panels-2">
                <CRTPanel header="Statistics">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <CRTStat value={stats?.totalApplications || 0} label="Total" />
                        <CRTStat value={stats?.statusCounts?.interviewing || 0} label="Interview" />
                        <CRTStat value={stats?.statusCounts?.offered || 0} label="Offered" />
                        <CRTStat value={stats?.statusCounts?.rejected || 0} label="Rejected" />
                    </div>

                    <div className="crt-subtitle">Quick Links</div>
                    <div className="space-y-2">
                        <Link to="/plugins/job-tracker/applications" className="block"><CRTBox className="flex items-center gap-3"><Briefcase className="w-5 h-5" /> Applications</CRTBox></Link>
                        <Link to="/plugins/job-tracker/outreach" className="block"><CRTBox className="flex items-center gap-3"><Mail className="w-5 h-5" /> Outreach</CRTBox></Link>
                        <Link to="/plugins/job-tracker/contacts" className="block"><CRTBox className="flex items-center gap-3"><Users className="w-5 h-5" /> Contacts</CRTBox></Link>
                    </div>
                </CRTPanel>

                <CRTPanel header="Recent Applications">
                    {recentApps.length === 0 ? <div className="text-[var(--crt-green-dim)]">&gt; No applications logged</div> : (
                        <CRTTable headers={['Company', 'Position', 'Status', '']}>
                            {recentApps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><CRTBadge color={statusColors[a.status] || 'amber'}>{a.status}</CRTBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><CRTButton>[EDIT]</CRTButton></Link></td></tr>))}
                        </CRTTable>
                    )}
                </CRTPanel>
            </div>
        </CRTLayout>
    );
}
