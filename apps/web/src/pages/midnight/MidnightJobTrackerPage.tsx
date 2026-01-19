import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, Mail, Users, ArrowRight, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightStat, MidnightButton, MidnightBadge, MidnightTable } from '@/components/midnight/MidnightComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function MidnightJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, appsRes] = await Promise.all([
                jobTrackerApi.getDashboard(),
                jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
            ]);
            setStats(statsRes.data?.data);
            setRecentApps(appsRes.data?.data || []);
        } catch (error) {
            console.error('Failed to load job tracker:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const statusColors: Record<string, 'default' | 'gold' | 'success' | 'warning' | 'error'> = {
        applied: 'default',
        interviewing: 'gold',
        offered: 'success',
        rejected: 'error',
        saved: 'warning',
    };

    const quickLinks = [
        { icon: FileText, label: 'Applications', path: '/plugins/job-tracker/applications' },
        { icon: Mail, label: 'Outreach', path: '/plugins/job-tracker/outreach' },
        { icon: Users, label: 'Find Contacts', path: '/plugins/job-tracker/contacts' },
    ];

    if (loading) {
        return (
            <MidnightLayout>
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div>
            </MidnightLayout>
        );
    }

    return (
        <MidnightLayout>
            <MidnightHeader
                title="Job Tracker"
                subtitle="Track your job applications"
                actions={
                    <Link to="/plugins/job-tracker/applications">
                        <MidnightButton variant="primary"><Briefcase className="w-4 h-4 mr-2" /> View All Applications</MidnightButton>
                    </Link>
                }
            />

            {/* Stats */}
            <div className="midnight-grid midnight-grid-4 mb-8">
                <MidnightCard gold><MidnightStat value={stats?.total || 0} label="Total Applications" /></MidnightCard>
                <MidnightCard><MidnightStat value={stats?.interviewing || 0} label="Interviewing" /></MidnightCard>
                <MidnightCard><MidnightStat value={stats?.offered || 0} label="Offers" /></MidnightCard>
                <MidnightCard><MidnightStat value={stats?.applied || 0} label="Applied" /></MidnightCard>
            </div>

            <div className="midnight-grid midnight-grid-3 gap-8">
                {/* Quick Links */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
                    <div className="space-y-3">
                        {quickLinks.map((link) => (
                            <Link key={link.path} to={link.path}>
                                <MidnightCard className="flex items-center gap-4 !p-4">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--midnight-surface)] flex items-center justify-center text-[var(--midnight-purple)]">
                                        <link.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{link.label}</span>
                                    <ArrowRight className="w-4 h-4 ml-auto text-[var(--midnight-text-dim)]" />
                                </MidnightCard>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Applications */}
                <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Recent Applications</h2>
                        <Link to="/plugins/job-tracker/applications">
                            <MidnightButton variant="ghost">View All <ArrowRight className="w-4 h-4 ml-1" /></MidnightButton>
                        </Link>
                    </div>
                    <MidnightCard className="!p-0 overflow-hidden">
                        {recentApps.length === 0 ? (
                            <div className="p-8 text-center text-[var(--midnight-text-dim)]">No applications yet</div>
                        ) : (
                            <MidnightTable headers={['Company', 'Position', 'Status']}>
                                {recentApps.map((app) => (
                                    <tr key={app.id}>
                                        <td className="font-medium">{app.company}</td>
                                        <td className="text-[var(--midnight-text-dim)]">{app.position}</td>
                                        <td><MidnightBadge variant={statusColors[app.status] || 'default'}>{app.status}</MidnightBadge></td>
                                    </tr>
                                ))}
                            </MidnightTable>
                        )}
                    </MidnightCard>
                </div>
            </div>
        </MidnightLayout>
    );
}
