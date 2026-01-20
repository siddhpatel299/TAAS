import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassStat, GlassButton, GlassBadge, GlassTable, GlassTitle } from '@/components/glass/GlassComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function GlassJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadData(); }, [loadData]);

    const statusColors: Record<string, 'cyan' | 'pink' | 'purple'> = { applied: 'cyan', interviewing: 'purple', offered: 'cyan', rejected: 'pink' };

    if (loading) return <GlassLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--glass-accent)]" /></div></GlassLayout>;

    return (
        <GlassLayout>
            <GlassTitle>Job Tracker</GlassTitle>

            <div className="glass-grid glass-grid-4 mb-8">
                <GlassStat value={stats?.totalApplications || 0} label="Total" />
                <GlassStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" />
                <GlassStat value={stats?.statusCounts?.offered || 0} label="Offers" />
                <GlassStat value={stats?.statusCounts?.applied || 0} label="Applied" />
            </div>

            <div className="glass-grid glass-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><GlassCard className="flex items-center gap-4"><Briefcase className="w-10 h-10 text-[var(--glass-accent)]" /><div><p className="font-semibold text-lg">Applications</p><p className="text-sm text-[var(--glass-text-muted)]">View all jobs</p></div></GlassCard></Link>
                <Link to="/plugins/job-tracker/outreach"><GlassCard className="flex items-center gap-4"><Mail className="w-10 h-10 text-[var(--glass-accent-pink)]" /><div><p className="font-semibold text-lg">Outreach</p><p className="text-sm text-[var(--glass-text-muted)]">Email tracking</p></div></GlassCard></Link>
                <Link to="/plugins/job-tracker/contacts"><GlassCard className="flex items-center gap-4"><Users className="w-10 h-10 text-[var(--glass-accent-purple)]" /><div><p className="font-semibold text-lg">Contacts</p><p className="text-sm text-[var(--glass-text-muted)]">Find HR contacts</p></div></GlassCard></Link>
            </div>

            <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
            <GlassCard flat>
                {recentApps.length === 0 ? <div className="p-8 text-center text-[var(--glass-text-muted)]">No applications yet</div> : (
                    <GlassTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><GlassBadge color={statusColors[a.status] || 'cyan'}>{a.status}</GlassBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><GlassButton>Edit</GlassButton></Link></td></tr>))}
                    </GlassTable>
                )}
            </GlassCard>
        </GlassLayout>
    );
}
