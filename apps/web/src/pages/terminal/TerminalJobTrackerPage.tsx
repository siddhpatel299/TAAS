import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalStat, TerminalButton, TerminalBadge, TerminalTable } from '@/components/terminal/TerminalComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    wishlist: 'default', applied: 'info', interviewing: 'warning', offer: 'success', rejected: 'danger', withdrawn: 'default',
};

export function TerminalJobTrackerPage() {
    const [apps, setApps] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, applied: 0, interviewing: 0, offers: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [appsRes, dashRes] = await Promise.all([jobTrackerApi.getApplications(), jobTrackerApi.getDashboard()]);
            setApps(appsRes.data?.data || []);
            const d = dashRes.data?.data;
            setStats({ total: d?.totalApplications || 0, applied: d?.statusCounts?.applied || 0, interviewing: d?.statusCounts?.interviewing || 0, offers: d?.statusCounts?.offer || 0 });
        } catch (error) {
            console.error('Failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    return (
        <TerminalLayout>
            <TerminalHeader
                title="Job Tracker"
                subtitle="Application tracking system"
                actions={<Link to="/plugins/job-tracker/applications"><TerminalButton variant="primary">View All <ArrowRight className="w-3 h-3 ml-1" /></TerminalButton></Link>}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Stats */}
                    <div className="lg:col-span-2">
                        <TerminalPanel title="Statistics">
                            <div className="terminal-grid-4">
                                <TerminalStat label="Total" value={stats.total} />
                                <TerminalStat label="Applied" value={stats.applied} />
                                <TerminalStat label="Interviewing" value={stats.interviewing} />
                                <TerminalStat label="Offers" value={stats.offers} />
                            </div>
                        </TerminalPanel>
                    </div>

                    {/* Quick Links */}
                    <TerminalPanel title="Quick Links">
                        <div className="space-y-2">
                            <Link to="/plugins/job-tracker/applications" className="block"><TerminalButton className="w-full justify-start"><Briefcase className="w-3 h-3 mr-2" /> Applications</TerminalButton></Link>
                            <Link to="/plugins/job-tracker/contacts" className="block"><TerminalButton className="w-full justify-start"><Users className="w-3 h-3 mr-2" /> Contacts</TerminalButton></Link>
                            <Link to="/plugins/job-tracker/outreach" className="block"><TerminalButton className="w-full justify-start"><Mail className="w-3 h-3 mr-2" /> Outreach</TerminalButton></Link>
                        </div>
                    </TerminalPanel>

                    {/* Recent */}
                    <div className="lg:col-span-3">
                        <TerminalPanel title="Recent Applications">
                            {apps.length === 0 ? (
                                <p className="text-center text-[var(--terminal-text-dim)] py-8 text-xs">NO DATA</p>
                            ) : (
                                <TerminalTable headers={['Company', 'Position', 'Status', 'Action']}>
                                    {apps.slice(0, 5).map((app) => (
                                        <tr key={app.id}>
                                            <td className="font-bold">{app.company}</td>
                                            <td>{app.jobTitle}</td>
                                            <td><TerminalBadge variant={statusColors[app.status]}>{app.status?.toUpperCase()}</TerminalBadge></td>
                                            <td><Link to={`/plugins/job-tracker/applications/${app.id}`}><TerminalButton>View</TerminalButton></Link></td>
                                        </tr>
                                    ))}
                                </TerminalTable>
                            )}
                        </TerminalPanel>
                    </div>
                </div>
            )}
        </TerminalLayout>
    );
}
