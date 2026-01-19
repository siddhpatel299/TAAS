import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Users, Mail, Calendar, ArrowRight, Loader2, Leaf } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestStatCard, ForestPageHeader, ForestButton, ForestBadge } from '@/components/forest/ForestComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

interface JobApplication {
    id: string;
    company: string;
    jobTitle: string;
    status: string;
}

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'wood'> = {
    wishlist: 'default',
    applied: 'wood',
    interviewing: 'warning',
    offer: 'success',
    rejected: 'danger',
    withdrawn: 'default',
};

export function ForestJobTrackerPage() {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        byStatus: { wishlist: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0, withdrawn: 0 },
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [appsRes, dashRes] = await Promise.all([
                jobTrackerApi.getApplications(),
                jobTrackerApi.getDashboard(),
            ]);
            setApplications(appsRes.data?.data || []);
            const dashData = dashRes.data?.data;
            if (dashData) {
                setStats({
                    total: dashData.totalApplications || 0,
                    byStatus: {
                        wishlist: dashData.statusCounts?.wishlist || 0,
                        applied: dashData.statusCounts?.applied || 0,
                        interviewing: dashData.statusCounts?.interviewing || 0,
                        offer: dashData.statusCounts?.offer || 0,
                        rejected: dashData.statusCounts?.rejected || 0,
                        withdrawn: dashData.statusCounts?.withdrawn || 0,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const funnel = [
        { label: 'Wishlist', value: stats.byStatus.wishlist, color: 'var(--forest-leaf)' },
        { label: 'Applied', value: stats.byStatus.applied, color: 'var(--forest-wood)' },
        { label: 'Interviewing', value: stats.byStatus.interviewing, color: 'var(--forest-warning)' },
        { label: 'Offers', value: stats.byStatus.offer, color: 'var(--forest-success)' },
    ];

    const quickLinks = [
        { label: 'All Applications', path: '/plugins/job-tracker/applications', icon: Briefcase },
        { label: 'Find Contacts', path: '/plugins/job-tracker/contacts', icon: Users },
        { label: 'Sent Emails', path: '/plugins/job-tracker/outreach', icon: Mail },
    ];

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Job Tracker"
                subtitle="Track your career journey"
                icon={<Briefcase className="w-6 h-6" />}
                actions={
                    <Link to="/plugins/job-tracker/applications">
                        <ForestButton variant="primary">View All <ArrowRight className="w-4 h-4 ml-1" /></ForestButton>
                    </Link>
                }
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            ) : (
                <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <ForestStatCard label="Total" value={stats.total} icon={<Briefcase className="w-5 h-5" />} />
                        <ForestStatCard label="Active" value={stats.byStatus.applied + stats.byStatus.interviewing} icon={<Calendar className="w-5 h-5" />} />
                        <ForestStatCard label="Interviews" value={stats.byStatus.interviewing} icon={<Users className="w-5 h-5" />} />
                        <ForestStatCard label="Offers" value={stats.byStatus.offer} icon={<Leaf className="w-5 h-5" />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Funnel */}
                        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <ForestCard>
                                <h3 className="text-lg font-semibold text-[var(--forest-moss)] mb-6">Application Funnel</h3>
                                <div className="space-y-4">
                                    {funnel.map((stage, index) => {
                                        const maxValue = Math.max(...funnel.map(f => f.value), 1);
                                        const width = (stage.value / maxValue) * 100;
                                        return (
                                            <div key={stage.label}>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-[var(--forest-moss)] font-medium">{stage.label}</span>
                                                    <span className="text-[var(--forest-wood)]">{stage.value}</span>
                                                </div>
                                                <div className="h-8 bg-[rgba(74,124,89,0.1)] rounded-lg overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${width}%` }}
                                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                                        className="h-full rounded-lg"
                                                        style={{ background: stage.color }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ForestCard>
                        </motion.div>

                        {/* Quick Links */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <ForestCard>
                                <h3 className="text-sm font-semibold text-[var(--forest-moss)] mb-4">Quick Links</h3>
                                <div className="space-y-2">
                                    {quickLinks.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <Link key={link.path} to={link.path}>
                                                <div className="p-3 rounded-lg hover:bg-[rgba(74,124,89,0.1)] transition-colors flex items-center gap-3">
                                                    <Icon className="w-5 h-5 text-[var(--forest-leaf)]" />
                                                    <span className="text-[var(--forest-moss)]">{link.label}</span>
                                                    <ArrowRight className="w-4 h-4 ml-auto text-[var(--forest-wood)]" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </ForestCard>
                        </motion.div>
                    </div>

                    {/* Recent Applications */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
                        <ForestCard>
                            <h3 className="text-lg font-semibold text-[var(--forest-moss)] mb-4">Recent Applications</h3>
                            {applications.length === 0 ? (
                                <p className="text-center text-[var(--forest-wood)] py-8">No applications yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {applications.slice(0, 5).map((app, index) => (
                                        <motion.div
                                            key={app.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + index * 0.05 }}
                                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-[rgba(74,124,89,0.05)] transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-[rgba(74,124,89,0.1)] flex items-center justify-center text-[var(--forest-leaf)] font-semibold">
                                                {app.company.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-[var(--forest-moss)] truncate">{app.company}</p>
                                                <p className="text-sm text-[var(--forest-wood)] truncate">{app.jobTitle}</p>
                                            </div>
                                            <ForestBadge variant={statusColors[app.status] || 'default'}>{app.status}</ForestBadge>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </ForestCard>
                    </motion.div>
                </>
            )}
        </ForestLayout>
    );
}
