import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamGauge, SteamButton, SteamBadge, SteamTable, SteamTitle, SteamDivider } from '@/components/steam/SteamComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function SteamJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'brass' | 'copper' | 'rust'> = { applied: 'brass', interviewing: 'copper', offered: 'brass', rejected: 'rust' };

    if (loading) return <SteamLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--steam-brass)]" /></div></SteamLayout>;

    return (
        <SteamLayout>
            <SteamTitle>Employment Engine</SteamTitle>

            <div className="flex justify-center gap-8 mb-8">
                <SteamGauge value={stats?.totalApplications || 0} label="Total" />
                <SteamGauge value={stats?.statusCounts?.interviewing || 0} label="Interview" />
                <SteamGauge value={stats?.statusCounts?.offered || 0} label="Offers" />
                <SteamGauge value={stats?.statusCounts?.applied || 0} label="Applied" />
            </div>

            <SteamDivider />

            <div className="steam-grid steam-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><SteamPanel title="Applications"><div className="text-center py-2"><Briefcase className="w-8 h-8 mx-auto mb-2 text-[var(--steam-brass)]" /><p className="text-sm text-[var(--steam-text-muted)]">View all entries</p></div></SteamPanel></Link>
                <Link to="/plugins/job-tracker/outreach"><SteamPanel title="Correspondence"><div className="text-center py-2"><Mail className="w-8 h-8 mx-auto mb-2 text-[var(--steam-copper)]" /><p className="text-sm text-[var(--steam-text-muted)]">Email transmissions</p></div></SteamPanel></Link>
                <Link to="/plugins/job-tracker/contacts"><SteamPanel title="Contact Finder"><div className="text-center py-2"><Users className="w-8 h-8 mx-auto mb-2 text-[var(--steam-bronze)]" /><p className="text-sm text-[var(--steam-text-muted)]">Locate HR contacts</p></div></SteamPanel></Link>
            </div>

            <SteamPanel title="Recent Applications">
                {recentApps.length === 0 ? <p className="text-center py-8 text-[var(--steam-text-muted)]">No applications recorded</p> : (
                    <SteamTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><SteamBadge color={colors[a.status] || 'brass'}>{a.status}</SteamBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><SteamButton>Edit</SteamButton></Link></td></tr>))}
                    </SteamTable>
                )}
            </SteamPanel>
        </SteamLayout>
    );
}
