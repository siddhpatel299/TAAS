import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasStat, CanvasButton, CanvasBadge, CanvasTable, CanvasTitle, CanvasCard } from '@/components/canvas/CanvasComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function CanvasJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'blue' | 'pink' | 'purple'> = { applied: 'blue', interviewing: 'purple', offered: 'blue', rejected: 'pink' };

    if (loading) return <CanvasLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--canvas-accent)]" /></div></CanvasLayout>;

    return (
        <CanvasLayout>
            <CanvasTitle>Job Tracker</CanvasTitle>
            <div className="grid grid-cols-4 gap-4 mb-8">
                <CanvasWindow title="Total" icon={<Briefcase className="w-4 h-4" />} zLevel="mid"><CanvasStat value={stats?.totalApplications || 0} label="applications" /></CanvasWindow>
                <CanvasWindow title="Interviewing" icon={<Briefcase className="w-4 h-4" />} zLevel="close"><CanvasStat value={stats?.statusCounts?.interviewing || 0} label="in progress" /></CanvasWindow>
                <CanvasWindow title="Offers" icon={<Briefcase className="w-4 h-4" />} zLevel="mid"><CanvasStat value={stats?.statusCounts?.offered || 0} label="received" /></CanvasWindow>
                <CanvasWindow title="Applied" icon={<Briefcase className="w-4 h-4" />} zLevel="far"><CanvasStat value={stats?.statusCounts?.applied || 0} label="pending" /></CanvasWindow>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Link to="/plugins/job-tracker/applications"><CanvasCard className="flex items-center gap-4 hover:scale-105 transition-transform"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--canvas-accent)] to-[var(--canvas-accent-2)] flex items-center justify-center"><Briefcase className="w-6 h-6 text-white" /></div><div><p className="font-semibold">Applications</p><p className="text-xs text-[var(--canvas-text-muted)]">View all</p></div></CanvasCard></Link>
                <Link to="/plugins/job-tracker/outreach"><CanvasCard className="flex items-center gap-4 hover:scale-105 transition-transform"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--canvas-accent-2)] to-[var(--canvas-accent-3)] flex items-center justify-center"><Mail className="w-6 h-6 text-white" /></div><div><p className="font-semibold">Outreach</p><p className="text-xs text-[var(--canvas-text-muted)]">Emails</p></div></CanvasCard></Link>
                <Link to="/plugins/job-tracker/contacts"><CanvasCard className="flex items-center gap-4 hover:scale-105 transition-transform"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--canvas-accent-3)] to-[var(--canvas-accent)] flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div><div><p className="font-semibold">Contacts</p><p className="text-xs text-[var(--canvas-text-muted)]">Find HR</p></div></CanvasCard></Link>
            </div>
            <CanvasWindow title="Recent Applications" icon={<Briefcase className="w-4 h-4" />} zLevel="mid">
                {recentApps.length === 0 ? <div className="p-8 text-center text-[var(--canvas-text-muted)]">No applications yet</div> : (
                    <CanvasTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><CanvasBadge color={colors[a.status] || 'blue'}>{a.status}</CanvasBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><CanvasButton>Edit</CanvasButton></Link></td></tr>))}
                    </CanvasTable>
                )}
            </CanvasWindow>
        </CanvasLayout>
    );
}
