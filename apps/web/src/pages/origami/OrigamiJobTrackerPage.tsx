import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, Mail, Users, ArrowRight, Loader2 } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiStat, OrigamiButton, OrigamiBadge, OrigamiTable } from '@/components/origami/OrigamiComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function OrigamiJobTrackerPage() {
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

    const statusColors: Record<string, 'default' | 'terracotta' | 'sage' | 'slate' | 'warning'> = {
        applied: 'default',
        interviewing: 'terracotta',
        offered: 'sage',
        rejected: 'slate',
        saved: 'warning',
    };

    const quickLinks = [
        { icon: FileText, label: 'Applications', path: '/plugins/job-tracker/applications' },
        { icon: Mail, label: 'Outreach', path: '/plugins/job-tracker/outreach' },
        { icon: Users, label: 'Find Contacts', path: '/plugins/job-tracker/contacts' },
    ];

    if (loading) {
        return (
            <OrigamiLayout>
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--origami-terracotta)] animate-spin" /></div>
            </OrigamiLayout>
        );
    }

    return (
        <OrigamiLayout>
            <OrigamiHeader
                title="Job Tracker"
                subtitle="Track your applications"
                actions={
                    <Link to="/plugins/job-tracker/applications">
                        <OrigamiButton variant="primary"><Briefcase className="w-4 h-4 mr-2" /> View All</OrigamiButton>
                    </Link>
                }
            />

            {/* Stats */}
            <div className="origami-grid origami-grid-4 mb-8">
                <OrigamiCard folded><OrigamiStat value={stats?.totalApplications || 0} label="Total" /></OrigamiCard>
                <OrigamiCard><OrigamiStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" /></OrigamiCard>
                <OrigamiCard><OrigamiStat value={stats?.statusCounts?.offered || 0} label="Offers" /></OrigamiCard>
                <OrigamiCard><OrigamiStat value={stats?.statusCounts?.applied || 0} label="Applied" /></OrigamiCard>
            </div>

            <div className="origami-grid origami-grid-3 gap-8">
                {/* Quick Links */}
                <div>
                    <h2 className="text-lg font-medium mb-4">Quick Links</h2>
                    <div className="space-y-3">
                        {quickLinks.map((link) => (
                            <Link key={link.path} to={link.path}>
                                <OrigamiCard className="flex items-center gap-4 !p-4">
                                    <div className="w-10 h-10 rounded bg-[var(--origami-bg)] flex items-center justify-center text-[var(--origami-slate)]">
                                        <link.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{link.label}</span>
                                    <ArrowRight className="w-4 h-4 ml-auto text-[var(--origami-text-dim)]" />
                                </OrigamiCard>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Applications */}
                <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium">Recent Applications</h2>
                        <Link to="/plugins/job-tracker/applications" className="text-sm text-[var(--origami-terracotta)] hover:underline">View All</Link>
                    </div>
                    <OrigamiCard className="!p-0 overflow-hidden">
                        {recentApps.length === 0 ? (
                            <div className="p-8 text-center text-[var(--origami-text-dim)]">No applications yet</div>
                        ) : (
                            <OrigamiTable headers={['Company', 'Position', 'Status']}>
                                {recentApps.map((app) => (
                                    <tr key={app.id}>
                                        <td className="font-medium">{app.company}</td>
                                        <td className="text-[var(--origami-text-dim)]">{app.jobTitle}</td>
                                        <td><OrigamiBadge variant={statusColors[app.status] || 'default'}>{app.status}</OrigamiBadge></td>
                                    </tr>
                                ))}
                            </OrigamiTable>
                        )}
                    </OrigamiCard>
                </div>
            </div>
        </OrigamiLayout>
    );
}
