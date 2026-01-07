import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  TrendingUp,
  Calendar,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { JOB_STATUSES } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Funnel Chart Component
function ApplicationFunnel({ statusCounts }: { statusCounts: Record<string, number> }) {
  const stages = [
    { status: 'wishlist', label: 'Wishlist', color: 'bg-gray-400' },
    { status: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { status: 'interview', label: 'Interview', color: 'bg-yellow-500' },
    { status: 'offer', label: 'Offer', color: 'bg-green-500' },
    { status: 'rejected', label: 'Rejected', color: 'bg-red-400' },
  ];

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <div className="space-y-3">
      {stages.map(stage => {
        const count = statusCounts[stage.status] || 0;
        const percentage = Math.round((count / maxCount) * 100);
        
        return (
          <div key={stage.status} className="flex items-center gap-4">
            <div className="w-24 text-sm text-gray-600 text-right">{stage.label}</div>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn('h-full rounded-lg flex items-center justify-center', stage.color)}
                >
                  {count > 0 && (
                    <span className="text-white text-sm font-medium">{count}</span>
                  )}
                </motion.div>
              </div>
              <span className="w-12 text-sm text-gray-500 text-right">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function JobTrackerDashboardPage() {
  const navigate = useNavigate();
  const {
    dashboardStats,
    upcomingTasks,
    recentActivity,
    isLoading,
    error,
    fetchDashboard,
  } = useJobTrackerStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = dashboardStats;

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ModernSidebar />
        <main className="ml-20 p-8 flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ModernSidebar />
        <main className="ml-20 p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Link to="/plugins" className="text-purple-600 hover:text-purple-700 font-medium">
              Go to Plugins →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />
      
      <main className="ml-20 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Tracker</h1>
              <p className="text-gray-500 text-sm">Dashboard</p>
            </div>
          </div>

          <Link
            to="/plugins/job-tracker/applications/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm">Total Applications</span>
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalApplications || 0}</div>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4" />
              Active job search
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm">Response Rate</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.responseRate || 0}%</div>
            <p className="text-sm text-gray-500 mt-2">Interviews + Offers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm">Interviews</span>
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.interviews || 0}</div>
            <p className="text-sm text-gray-500 mt-2">
              {upcomingTasks.length} upcoming tasks
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm">Success Rate</span>
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.successRate || 0}%</div>
            <p className="text-sm text-gray-500 mt-2">{stats?.offers || 0} offers received</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Application Funnel</h2>
              </div>
              <Link
                to="/plugins/job-tracker/applications"
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <ApplicationFunnel statusCounts={stats?.statusCounts || {}} />
          </motion.div>

          {/* Right Column - Upcoming Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
              </div>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>No upcoming tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 5).map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                  
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "p-3 rounded-xl border transition-colors",
                        isOverdue 
                          ? "border-red-200 bg-red-50" 
                          : "border-gray-100 hover:border-gray-200 bg-gray-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          isOverdue ? "bg-red-500" : "bg-orange-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {task.jobApplication?.company} - {task.jobApplication?.jobTitle}
                          </p>
                          {task.dueDate && (
                            <p className={cn(
                              "text-xs mt-1",
                              isOverdue ? "text-red-600 font-medium" : "text-gray-400"
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
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
              <Link
                to="/plugins/job-tracker/applications/new"
                className="mt-4 inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add your first job application
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.jobApplication?.company} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/plugins/job-tracker/applications"
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Applications</h3>
              <p className="text-sm text-gray-500">View all jobs</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>

          <Link
            to="/plugins/job-tracker/tasks"
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Tasks</h3>
              <p className="text-sm text-gray-500">Manage follow-ups</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>

          <Link
            to="/plugins/job-tracker/referrals"
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Referrals</h3>
              <p className="text-sm text-gray-500">Track contacts</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>
        </div>
      </main>
    </div>
  );
}
