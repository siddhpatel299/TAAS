import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuGauge, SkeuButton, SkeuBadge, SkeuTable, SkeuTitle } from '@/components/skeu/SkeuComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function SkeuJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'green' | 'blue' | 'orange' | 'red' | 'purple'> = { applied: 'blue', interviewing: 'purple', offered: 'green', rejected: 'red' };

    if (loading) return <SkeuLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--skeu-led-blue)]" /></div></SkeuLayout>;

    return (
        <SkeuLayout>
            <SkeuTitle subtitle="Application tracking system">Job Command Center</SkeuTitle>

            <div className="skeu-grid skeu-grid-4 mb-8">
                <SkeuCard className="flex items-center justify-center py-6">
                    <SkeuGauge value={stats?.totalApplications || 0} label="Total" color="blue" />
                </SkeuCard>
                <SkeuCard className="flex items-center justify-center py-6">
                    <SkeuGauge value={stats?.statusCounts?.interviewing || 0} label="Interview" color="purple" />
                </SkeuCard>
                <SkeuCard className="flex items-center justify-center py-6">
                    <SkeuGauge value={stats?.statusCounts?.offered || 0} label="Offers" color="green" />
                </SkeuCard>
                <SkeuCard className="flex items-center justify-center py-6">
                    <SkeuGauge value={stats?.statusCounts?.applied || 0} label="Applied" color="orange" />
                </SkeuCard>
            </div>

            <div className="skeu-grid skeu-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><SkeuCard><div className="text-center py-2"><p className="font-semibold">Applications</p><p className="text-sm text-[var(--skeu-text-muted)]">Manage all</p></div></SkeuCard></Link>
                <Link to="/plugins/job-tracker/outreach"><SkeuCard><div className="text-center py-2"><p className="font-semibold">Outreach</p><p className="text-sm text-[var(--skeu-text-muted)]">Email tracking</p></div></SkeuCard></Link>
                <Link to="/plugins/job-tracker/contacts"><SkeuCard><div className="text-center py-2"><p className="font-semibold">Contact Finder</p><p className="text-sm text-[var(--skeu-text-muted)]">HR discovery</p></div></SkeuCard></Link>
            </div>

            <SkeuCard>
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                {recentApps.length === 0 ? <p className="text-center py-8 text-[var(--skeu-text-muted)]">No applications logged</p> : (
                    <SkeuTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><SkeuBadge color={colors[a.status] || 'blue'}>{a.status}</SkeuBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><SkeuButton>Edit</SkeuButton></Link></td></tr>))}
                    </SkeuTable>
                )}
            </SkeuCard>
        </SkeuLayout>
    );
}
