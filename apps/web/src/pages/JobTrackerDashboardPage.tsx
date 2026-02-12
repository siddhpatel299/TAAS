import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Settings,
  Send,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { AddJobDialog } from '@/components/AddJobDialog';
import { JobTrackerSettingsDialog } from '@/components/JobTrackerSettingsDialog';


// Funnel Chart Component
function ApplicationFunnel({ statusCounts }: { statusCounts: Record<string, number> }) {
  const stages = [
    { status: 'wishlist', label: 'Wishlist', color: 'from-gray-400 to-gray-500', bg: 'bg-gray-100' },
    { status: 'applied', label: 'Applied', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { status: 'interview', label: 'Interview', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
    { status: 'offer', label: 'Offer', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
    { status: 'rejected', label: 'Rejected', color: 'from-red-400 to-red-500', bg: 'bg-red-50' },
  ];

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const count = statusCounts[stage.status] || 0;
        const percentage = Math.round((count / maxCount) * 100);

        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={stage.status}
            className="group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{stage.label}</span>
              <span className="text-sm text-gray-500">{count}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={cn('h-full rounded-full bg-gradient-to-r', stage.color)}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function JobTrackerDashboardPage() {
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

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleJobAdded = () => {
    fetchDashboard();
    setShowAddDialog(false);
  };

  const stats = dashboardStats;

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            to="/plugins"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
          >
            Return to Plugins
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <ModernSidebar />

      <main className="ml-20 p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Job Command Center</h1>
            <p className="text-gray-500 mt-1">Manage your applications, tasks, and network.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsDialog(true)}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Job
            </button>
          </div>
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
          <Link to="/plugins/job-tracker/applications?status=active" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all group-hover:border-sky-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-sky-600" />
                </div>
                {stats?.totalApplications && stats.totalApplications > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    Active
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-gray-900">{stats?.totalApplications || 0}</h3>
                <p className="text-gray-500 font-medium">Total Applications</p>
              </div>
            </motion.div>
          </Link>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-gray-900">{stats?.responseRate || 0}%</h3>
              <p className="text-gray-500 font-medium">Response Rate</p>
            </div>
          </div>



          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-gray-900">{stats?.offers || 0}</h3>
              <p className="text-gray-500 font-medium">Offers Received</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Funnel & Activity */}
          <div className="xl:col-span-2 space-y-8">
            {/* Application Funnel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Application Funnel</h2>
                  <p className="text-sm text-gray-500">Visualize your job search progress</p>
                </div>
                <Link to="/plugins/job-tracker/applications" className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline">
                  View All
                </Link>
              </div>
              <div className="p-6">
                <ApplicationFunnel statusCounts={stats?.statusCounts || {}} />
              </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/plugins/job-tracker/applications" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900">View All Jobs</h3>
                <p className="text-sm text-gray-500 mt-1">Manage applications</p>
              </Link>

              <Link to="/plugins/job-tracker/contacts" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-violet-200 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-5 h-5 text-violet-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900">Contacts</h3>
                <p className="text-sm text-gray-500 mt-1">Find & manage people</p>
              </Link>

              <Link to="/plugins/job-tracker/outreach" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-sky-200 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Send className="w-5 h-5 text-sky-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-sky-500 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900">Outreach</h3>
                <p className="text-sm text-gray-500 mt-1">Track sent emails</p>
              </Link>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              </div>

              {!recentActivity || recentActivity.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentActivity.slice(0, 5).map(activity => (
                    <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                      <div className="mt-1">
                        {activity.action === 'created' && <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Plus className="w-4 h-4 text-blue-600" /></div>}
                        {activity.action === 'updated' && <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center"><Filter className="w-4 h-4 text-orange-600" /></div>}
                        {activity.action === 'status_change' && <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-purple-600" /></div>}
                        {!['created', 'updated', 'status_change'].includes(activity.action) && <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><FileText className="w-4 h-4 text-gray-600" /></div>}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {activity.jobApplication?.company} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>

          {/* Right Column - Upcoming Deadlines */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-8 flex flex-col max-h-[calc(100vh-120px)]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Active Tasks</h2>
                  <p className="text-sm text-gray-500">All pending todos</p>
                </div>
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                </div>
              </div>

              {!upcomingTasks || upcomingTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No upcoming tasks</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddDialog(true)}>
                    Create a Job to add tasks
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 overflow-y-auto custom-scrollbar">
                  {upcomingTasks.map(task => { // Show all tasks
                    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                    const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
                    const isDueToday = dueDate && isToday(dueDate);

                    return (
                      <Link
                        key={task.id}
                        to={`/plugins/job-tracker/applications/${task.jobApplicationId}`}
                        className="block p-4 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-sky-500"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className={cn("font-semibold text-sm truncate", isOverdue ? "text-red-600" : "text-gray-900")}>
                              {task.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {task.jobApplication?.company} • {task.jobApplication?.jobTitle}
                            </p>
                          </div>
                          {dueDate && (
                            <div className={cn(
                              "flex flex-col items-center justify-center w-12 h-12 rounded-lg border text-xs font-bold leading-none shrink-0",
                              isOverdue
                                ? "bg-red-50 border-red-100 text-red-600"
                                : isDueToday
                                  ? "bg-orange-50 border-orange-100 text-orange-600"
                                  : "bg-gray-50 border-gray-100 text-gray-600"
                            )}>
                              <span className="text-[10px] uppercase opacity-70 mb-0.5">{format(dueDate, 'MMM')}</span>
                              <span className="text-lg">{format(dueDate, 'd')}</span>
                            </div>
                          )}
                        </div>
                        {isOverdue && (
                          <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
