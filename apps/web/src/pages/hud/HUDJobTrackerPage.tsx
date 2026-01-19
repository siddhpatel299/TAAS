import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Briefcase,
    TrendingUp,
    Calendar,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    ChevronRight,
    Settings,
    Mail,
    Send,
    Search,
    Target,
    Zap,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDStatCard, HUDButton } from '@/components/hud/HUDComponents';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AddJobDialog } from '@/components/AddJobDialog';
import { JobTrackerSettingsDialog } from '@/components/JobTrackerSettingsDialog';
import { jobTrackerApi, FollowUpStats } from '@/lib/plugins-api';

// HUD-styled Funnel Chart
function HUDApplicationFunnel({ statusCounts }: { statusCounts: Record<string, number> }) {
    const stages = [
        { status: 'wishlist', label: 'Wishlist', color: 'from-gray-500 to-gray-600', glow: 'rgba(156, 163, 175, 0.5)' },
        { status: 'applied', label: 'Applied', color: 'from-blue-500 to-blue-600', glow: 'rgba(59, 130, 246, 0.5)' },
        { status: 'interview', label: 'Interview', color: 'from-yellow-500 to-yellow-600', glow: 'rgba(234, 179, 8, 0.5)' },
        { status: 'offer', label: 'Offer', color: 'from-green-500 to-green-600', glow: 'rgba(34, 197, 94, 0.5)' },
        { status: 'rejected', label: 'Rejected', color: 'from-red-500 to-red-600', glow: 'rgba(239, 68, 68, 0.5)' },
    ];

    const maxCount = Math.max(...Object.values(statusCounts), 1);

    return (
        <div className="space-y-4">
            {stages.map(stage => {
                const count = statusCounts[stage.status] || 0;
                const percentage = Math.round((count / maxCount) * 100);

                return (
                    <div key={stage.status} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-cyan-400 text-right font-medium">{stage.label}</div>
                        <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 h-8 bg-cyan-900/20 border border-cyan-500/20 rounded-lg overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className={cn('h-full rounded-lg flex items-center justify-center bg-gradient-to-r', stage.color)}
                                    style={{ boxShadow: count > 0 ? `0 0 20px ${stage.glow}` : 'none' }}
                                >
                                    {count > 0 && (
                                        <span className="text-white text-sm font-bold">{count}</span>
                                    )}
                                </motion.div>
                            </div>
                            <span className="w-12 text-sm text-cyan-600 text-right font-mono">{percentage}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function HUDJobTrackerPage() {
    const {
        dashboardStats,
        upcomingTasks,
        recentActivity,
        isLoading,
        error,
        fetchDashboard,
    } = useJobTrackerStore();

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [followUpStats, setFollowUpStats] = useState<FollowUpStats | null>(null);

    useEffect(() => {
        fetchDashboard();
        jobTrackerApi.getFollowUpStats()
            .then(res => setFollowUpStats(res.data.data))
            .catch(err => console.error('Failed to load follow-up stats:', err));
    }, [fetchDashboard]);

    const handleJobAdded = () => {
        fetchDashboard();
        setShowAddDialog(false);
    };

    const stats = dashboardStats;

    if (isLoading && !stats) {
        return (
            <HUDLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </HUDLayout>
        );
    }

    if (error) {
        return (
            <HUDLayout>
                <HUDPanel className="p-8 text-center" glow>
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-400 mb-2">System Error</h2>
                    <p className="text-cyan-600 mb-4">{error}</p>
                    <Link to="/plugins" className="text-cyan-400 hover:text-cyan-300">
                        Return to Plugins →
                    </Link>
                </HUDPanel>
            </HUDLayout>
        );
    }

    return (
        <HUDLayout>
            {/* Header */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                            JOB TRACKER
                        </h1>
                        <p className="text-cyan-600/70 mt-1">Mission Control Center</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <HUDButton onClick={() => setShowSettingsDialog(true)}>
                            <Settings className="w-4 h-4" />
                        </HUDButton>
                        <HUDButton variant="primary" onClick={() => setShowAddDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Job
                        </HUDButton>
                    </div>
                </motion.div>
            </div>

            {/* Add Job Dialog */}
            <AddJobDialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSuccess={handleJobAdded}
            />

            {/* Settings Dialog */}
            <JobTrackerSettingsDialog
                isOpen={showSettingsDialog}
                onClose={() => setShowSettingsDialog(false)}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <HUDStatCard
                        label="Total Applications"
                        value={stats?.totalApplications || 0}
                        icon={<Briefcase className="w-5 h-5 text-cyan-400" />}
                        trend={{ value: 'Active job search', positive: true }}
                    />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <HUDStatCard
                        label="Response Rate"
                        value={`${stats?.responseRate || 0}%`}
                        icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
                        trend={{ value: 'Interviews + Offers' }}
                    />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <HUDStatCard
                        label="Interviews"
                        value={stats?.interviews || 0}
                        icon={<Calendar className="w-5 h-5 text-yellow-400" />}
                        trend={{ value: `${upcomingTasks.length} upcoming tasks` }}
                    />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <HUDStatCard
                        label="Success Rate"
                        value={`${stats?.successRate || 0}%`}
                        icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
                        trend={{ value: `${stats?.offers || 0} offers received`, positive: true }}
                    />
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Funnel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2"
                >
                    <HUDPanel className="p-6" glow>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-cyan-400" />
                                <h2 className="text-lg font-semibold text-cyan-300">Application Funnel</h2>
                            </div>
                            <Link
                                to="/plugins/job-tracker/applications"
                                className="text-sm text-cyan-500 hover:text-cyan-400 flex items-center gap-1"
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <HUDApplicationFunnel statusCounts={stats?.statusCounts || {}} />
                    </HUDPanel>
                </motion.div>

                {/* Upcoming Tasks */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <HUDPanel className="p-6 h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertCircle className="w-5 h-5 text-orange-400" />
                            <h2 className="text-lg font-semibold text-cyan-300">Upcoming Deadlines</h2>
                        </div>

                        {upcomingTasks.length === 0 ? (
                            <div className="text-center py-8">
                                <Clock className="w-10 h-10 mx-auto mb-3 text-cyan-700" />
                                <p className="text-cyan-600">No upcoming tasks</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingTasks.slice(0, 5).map(task => {
                                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

                                    return (
                                        <div
                                            key={task.id}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all",
                                                isOverdue
                                                    ? "border-red-500/50 bg-red-500/10"
                                                    : "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50"
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full mt-2",
                                                    isOverdue ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-orange-400"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-cyan-200 truncate">{task.title}</p>
                                                    <p className="text-sm text-cyan-600 truncate">
                                                        {task.jobApplication?.company} - {task.jobApplication?.jobTitle}
                                                    </p>
                                                    {task.dueDate && (
                                                        <p className={cn(
                                                            "text-xs mt-1",
                                                            isOverdue ? "text-red-400 font-medium" : "text-cyan-700"
                                                        )}>
                                                            {isOverdue ? 'Overdue: ' : 'Due: '}
                                                            {new Date(task.dueDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </HUDPanel>
                </motion.div>
            </div>

            {/* Follow-up Alert */}
            {followUpStats && (followUpStats.overdue > 0 || followUpStats.dueToday > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6"
                >
                    <HUDPanel className="p-4 border-amber-500/50 bg-amber-500/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-amber-400" />
                                <span className="text-amber-300">
                                    <strong>{followUpStats.overdue}</strong> overdue and <strong>{followUpStats.dueToday}</strong> email follow-ups due today
                                </span>
                            </div>
                            <Link
                                to="/plugins/job-tracker/outreach"
                                className="text-sm font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
                            >
                                View Outreach <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </HUDPanel>
                </motion.div>
            )}

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
                <Link to="/plugins/job-tracker/applications">
                    <HUDPanel hover className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-cyan-200">Applications</h3>
                            <p className="text-sm text-cyan-600">View all jobs</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-cyan-600 ml-auto" />
                    </HUDPanel>
                </Link>

                <Link to="/plugins/job-tracker/outreach">
                    <HUDPanel hover className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <Send className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-cyan-200">Outreach</h3>
                            <p className="text-sm text-cyan-600">Track emails</p>
                        </div>
                        {followUpStats && (followUpStats.overdue + followUpStats.dueToday) > 0 && (
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                                {followUpStats.overdue + followUpStats.dueToday}
                            </span>
                        )}
                        <ArrowRight className="w-5 h-5 text-cyan-600" />
                    </HUDPanel>
                </Link>

                <Link to="/plugins/job-tracker/contacts">
                    <HUDPanel hover className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                            <Search className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-cyan-200">Find Contacts</h3>
                            <p className="text-sm text-cyan-600">Email finder</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-cyan-600 ml-auto" />
                    </HUDPanel>
                </Link>

                <Link to="/plugins/job-tracker/applications">
                    <HUDPanel hover className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-cyan-200">Tasks</h3>
                            <p className="text-sm text-cyan-600">Follow-ups</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-cyan-600 ml-auto" />
                    </HUDPanel>
                </Link>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-6"
            >
                <HUDPanel className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-semibold text-cyan-300">Recent Activity</h2>
                        </div>
                    </div>

                    {recentActivity.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="w-10 h-10 mx-auto mb-3 text-cyan-700" />
                            <p className="text-cyan-600">No recent activity</p>
                            <button
                                onClick={() => setShowAddDialog(true)}
                                className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                            >
                                <Plus className="w-4 h-4" /> Add your first job application
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentActivity.slice(0, 3).map(activity => (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-4 pb-4 border-b border-cyan-500/20 last:border-0 last:pb-0"
                                >
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                                        <Briefcase className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-cyan-200">{activity.description}</p>
                                        <p className="text-sm text-cyan-600 mt-1">
                                            {activity.jobApplication?.company} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </HUDPanel>
            </motion.div>
        </HUDLayout>
    );
}
