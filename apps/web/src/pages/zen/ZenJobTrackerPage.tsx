import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenStat, ZenButton, ZenBadge, ZenTable, ZenTitle, ZenSection, ZenDivider } from '@/components/zen/ZenComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function ZenJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'default' | 'accent' | 'sage' | 'sand'> = { applied: 'default', interviewing: 'sage', offered: 'accent', rejected: 'sand' };

    if (loading) return <ZenLayout><div className="flex items-center justify-center" style={{ minHeight: '50vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div></ZenLayout>;

    return (
        <ZenLayout>
            <ZenTitle subtitle="Manage your journey">Job Tracker</ZenTitle>

            <ZenSection>
                <div className="zen-grid zen-grid-4">
                    <ZenStat value={stats?.totalApplications || 0} label="Total" />
                    <ZenStat value={stats?.statusCounts?.interviewing || 0} label="Interview" />
                    <ZenStat value={stats?.statusCounts?.offered || 0} label="Offers" />
                    <ZenStat value={stats?.statusCounts?.applied || 0} label="Applied" />
                </div>
            </ZenSection>

            <ZenDivider />

            <ZenSection title="Navigate">
                <div className="zen-grid zen-grid-3">
                    <Link to="/plugins/job-tracker/applications"><ZenCard><p>Applications</p></ZenCard></Link>
                    <Link to="/plugins/job-tracker/outreach"><ZenCard><p>Outreach</p></ZenCard></Link>
                    <Link to="/plugins/job-tracker/contacts"><ZenCard><p>Contact Finder</p></ZenCard></Link>
                </div>
            </ZenSection>

            <ZenDivider />

            <ZenSection title="Recent">
                <ZenCard>
                    {recentApps.length === 0 ? <p className="text-center py-8 text-[var(--zen-text-light)]">No applications</p> : (
                        <ZenTable headers={['Company', 'Position', 'Status', '']}>
                            {recentApps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><ZenBadge color={colors[a.status] || 'default'}>{a.status}</ZenBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ZenButton>Edit</ZenButton></Link></td></tr>))}
                        </ZenTable>
                    )}
                </ZenCard>
            </ZenSection>
        </ZenLayout>
    );
}
