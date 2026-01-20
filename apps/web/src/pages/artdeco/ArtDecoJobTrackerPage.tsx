import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Users, Loader2 } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoStat, DecoButton, DecoBadge, DecoTable, DecoTitle, DecoDivider } from '@/components/artdeco/ArtDecoComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function ArtDecoJobTrackerPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentApps, setRecentApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const [s, a] = await Promise.all([jobTrackerApi.getDashboard(), jobTrackerApi.getApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })]); setStats(s.data?.data); setRecentApps(a.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const colors: Record<string, 'gold' | 'sage' | 'rose'> = { applied: 'gold', interviewing: 'sage', offered: 'sage', rejected: 'rose' };

    if (loading) return <ArtDecoLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--deco-gold)]" /></div></ArtDecoLayout>;

    return (
        <ArtDecoLayout>
            <DecoTitle>Job Tracker</DecoTitle>
            <div className="deco-grid deco-grid-4 mb-8">
                <DecoStat value={stats?.totalApplications || 0} label="Total" />
                <DecoStat value={stats?.statusCounts?.interviewing || 0} label="Interviewing" />
                <DecoStat value={stats?.statusCounts?.offered || 0} label="Offers" />
                <DecoStat value={stats?.statusCounts?.applied || 0} label="Applied" />
            </div>
            <DecoDivider text="Navigation" />
            <div className="deco-grid deco-grid-3 mb-8">
                <Link to="/plugins/job-tracker/applications"><DecoCard className="text-center"><Briefcase className="w-10 h-10 mx-auto mb-3 text-[var(--deco-gold)]" /><p className="text-lg">Applications</p></DecoCard></Link>
                <Link to="/plugins/job-tracker/outreach"><DecoCard className="text-center"><Mail className="w-10 h-10 mx-auto mb-3 text-[var(--deco-sage)]" /><p className="text-lg">Outreach</p></DecoCard></Link>
                <Link to="/plugins/job-tracker/contacts"><DecoCard className="text-center"><Users className="w-10 h-10 mx-auto mb-3 text-[var(--deco-rose)]" /><p className="text-lg">Contacts</p></DecoCard></Link>
            </div>
            <DecoDivider text="Recent Applications" />
            <DecoCard>
                {recentApps.length === 0 ? <div className="p-8 text-center text-[var(--deco-text-muted)]">No applications yet</div> : (
                    <DecoTable headers={['Company', 'Position', 'Status', '']}>
                        {recentApps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><DecoBadge color={colors[a.status] || 'gold'}>{a.status}</DecoBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><DecoButton>Edit</DecoButton></Link></td></tr>))}
                    </DecoTable>
                )}
            </DecoCard>
        </ArtDecoLayout>
    );
}
