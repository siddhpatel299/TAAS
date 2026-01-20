import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelStat, PixelButton, PixelBadge, PixelTable, PixelTitle, PixelHealthBar } from '@/components/pixel/PixelComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function PixelJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'red' | 'green' | 'blue' | 'yellow'> = { applied: 'blue', interviewing: 'yellow', offered: 'green', rejected: 'red' };

    if (loading) return <PixelLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--pixel-cyan)]" /></div></PixelLayout>;

    const total = stats?.totalApplications || 1;
    const successful = (stats?.statusCounts?.interviewing || 0) + (stats?.statusCounts?.offered || 0);

    return (
        <PixelLayout>
            <PixelTitle subtitle="> LEVEL UP YOUR CAREER">💼 JOB HUNT</PixelTitle>

            <div className="pixel-grid pixel-grid-4 mb-8">
                <PixelCard><PixelStat value={stats?.totalApplications || 0} label="Total" /></PixelCard>
                <PixelCard><PixelStat value={stats?.statusCounts?.interviewing || 0} label="Interviews" /></PixelCard>
                <PixelCard><PixelStat value={stats?.statusCounts?.offered || 0} label="Offers" /></PixelCard>
                <PixelCard><PixelStat value={stats?.statusCounts?.applied || 0} label="Applied" /></PixelCard>
            </div>

            <PixelCard className="mb-8">
                <p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', marginBottom: '12px', color: 'var(--pixel-cyan)' }}>SUCCESS RATE</p>
                <PixelHealthBar value={successful} max={total} />
                <p className="text-sm mt-2 text-[var(--pixel-text-dim)]">{Math.round((successful / total) * 100)}% response rate</p>
            </PixelCard>

            <div className="pixel-grid pixel-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><PixelCard><p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>📋 APPLICATIONS</p></PixelCard></Link>
                <Link to="/plugins/job-tracker/outreach"><PixelCard><p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>✉ OUTREACH</p></PixelCard></Link>
                <Link to="/plugins/job-tracker/contacts"><PixelCard><p style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>👤 CONTACTS</p></PixelCard></Link>
            </div>

            <PixelCard>
                <h3 style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', marginBottom: '16px', color: 'var(--pixel-cyan)' }}>RECENT ACTIVITY</h3>
                {recentApps.length === 0 ? <p className="text-center py-8 text-[var(--pixel-text-dim)]">&gt; NO APPLICATIONS YET</p> : (
                    <PixelTable headers={['Company', 'Role', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><PixelBadge color={colors[a.status] || 'blue'}>{a.status.toUpperCase()}</PixelBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><PixelButton>EDIT</PixelButton></Link></td></tr>))}
                    </PixelTable>
                )}
            </PixelCard>
        </PixelLayout>
    );
}
