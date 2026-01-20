import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveStat, ArchiveButton, ArchiveBadge, ArchiveTable, ArchiveCard, ArchiveBigNumber, ArchiveHeadline, ArchiveSubhead } from '@/components/archive/ArchiveComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function ArchiveJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const variants: Record<string, 'default' | 'accent' | 'dark'> = { applied: 'default', interviewing: 'accent', offered: 'dark', rejected: 'default' };

    if (loading) return <ArchiveLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[var(--archive-accent)]" /></div></ArchiveLayout>;

    return (
        <ArchiveLayout>
            <ArchiveBigNumber value={stats?.totalApplications || 0} />

            <ArchiveSection className="mb-12">
                <ArchiveHeadline>Job Tracker</ArchiveHeadline>
                <ArchiveSubhead>Track and manage your job applications with precision.</ArchiveSubhead>
            </ArchiveSection>

            <ArchiveSection title="Statistics" className="mb-12">
                <div className="archive-columns archive-columns-4">
                    <ArchiveStat value={stats?.totalApplications || 0} label="Total Applications" />
                    <ArchiveStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" />
                    <ArchiveStat value={stats?.statusCounts?.offered || 0} label="Offers" />
                    <ArchiveStat value={stats?.statusCounts?.applied || 0} label="Applied" />
                </div>
            </ArchiveSection>

            <ArchiveSection title="Quick Access" className="mb-12">
                <div className="archive-columns archive-columns-3">
                    <Link to="/plugins/job-tracker/applications"><ArchiveCard><div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-[var(--archive-accent)]" /><span className="font-medium">Applications</span></div></ArchiveCard></Link>
                    <Link to="/plugins/job-tracker/outreach"><ArchiveCard><div className="flex items-center gap-3"><Mail className="w-5 h-5 text-[var(--archive-accent)]" /><span className="font-medium">Outreach</span></div></ArchiveCard></Link>
                    <Link to="/plugins/job-tracker/contacts"><ArchiveCard><div className="flex items-center gap-3"><Users className="w-5 h-5 text-[var(--archive-accent)]" /><span className="font-medium">Contact Finder</span></div></ArchiveCard></Link>
                </div>
            </ArchiveSection>

            <ArchiveSection title="Recent Applications" count={recentApps.length}>
                {recentApps.length === 0 ? <p className="text-[var(--archive-text-muted)]">No applications recorded.</p> : (
                    <ArchiveTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><ArchiveBadge variant={variants[a.status] || 'default'}>{a.status}</ArchiveBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><ArchiveButton>Edit</ArchiveButton></Link></td></tr>))}
                    </ArchiveTable>
                )}
            </ArchiveSection>
        </ArchiveLayout>
    );
}
