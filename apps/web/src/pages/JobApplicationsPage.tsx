import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Plus,
  Search,
  Table,
  LayoutGrid,
  Columns,
  Trash2,
  Edit,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  X,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { AddJobDialog } from '@/components/AddJobDialog';
import { CompanyContactsDialog } from '@/components/CompanyContactsDialog';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { JOB_STATUSES, JOB_PRIORITIES, JobApplication } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';
import { JobApplicationTimelineRow } from '@/components/job-tracker/JobApplicationTimelineRow';
import { CompanyLogo } from '@/components/job-tracker/CompanyLogo';

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig = JOB_STATUSES.find(s => s.value === status);
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={cn(
      'px-2.5 py-1 rounded-full text-xs font-medium',
      colors[statusConfig?.color || 'gray']
    )}>
      {statusConfig?.label || status}
    </span>
  );
}





// Card View Component
function CardView({
  applications,
  onEdit,
  onDelete,
  onFindContacts,
}: {
  applications: JobApplication[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onFindContacts: (job: JobApplication) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.map((job, idx) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-purple-200 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <CompanyLogo
              company={job.company}
              companyLogo={job.companyLogo}
              size="md"
            />
            <StatusBadge status={job.status} />
          </div>

          <Link
            to={`/plugins/job-tracker/applications/${job.id}`}
            className="block"
          >
            <h3 className="font-semibold text-gray-900 mb-1 hover:text-sky-600 transition-colors">
              {job.jobTitle}
            </h3>
            <p className="text-gray-600 mb-4">{job.company}</p>
          </Link>

          <div className="space-y-2 text-sm text-gray-500 mb-4">
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            )}
            {job.salaryMin && job.salaryMax && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>
                  {job.salaryCurrency || '$'}{job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                </span>
              </div>
            )}
            {job.appliedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(job.appliedDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {job.rating && (
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= job.rating!
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-200'
                  )}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {job._count && (
                <>
                  <span>{job._count.documents} docs</span>
                  <span>•</span>
                  <span>{job._count.tasks} tasks</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFindContacts(job)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Find Contacts"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(job.id)}
                className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(job.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Kanban View Component
function KanbanView({
  applications,
  onEdit,
  onAddJob,
}: {
  applications: JobApplication[];
  onEdit: (id: string) => void;
  onAddJob: () => void;
}) {
  const columns = JOB_STATUSES.filter(s =>
    ['wishlist', 'applied', 'interview', 'offer', 'rejected'].includes(s.value)
  );

  const columnColors: Record<string, string> = {
    wishlist: 'border-t-gray-400',
    applied: 'border-t-blue-500',
    interview: 'border-t-yellow-500',
    offer: 'border-t-green-500',
    rejected: 'border-t-red-500',
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {columns.map(column => {
        const columnJobs = applications.filter(j => j.status === column.value);

        return (
          <div
            key={column.value}
            className="flex-shrink-0 w-80"
          >
            <div className={cn(
              "bg-white rounded-2xl border border-gray-200 border-t-4 overflow-hidden",
              columnColors[column.value]
            )}>
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.label}</h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {columnJobs.length}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 min-h-[200px] max-h-[60vh] overflow-y-auto">
                {columnJobs.map((job, idx) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onEdit(job.id)}
                  >
                    <div className="flex items-start gap-3">
                      <CompanyLogo
                        company={job.company}
                        companyLogo={job.companyLogo}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{job.jobTitle}</h4>
                        <p className="text-sm text-gray-500 truncate">{job.company}</p>
                        {job.location && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {job.appliedDate && (
                      <p className="text-xs text-gray-400 mt-3">
                        {new Date(job.appliedDate).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))}

                {columnJobs.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No applications
                  </div>
                )}
              </div>

              <Link
                to="/plugins/job-tracker/applications/new"
                className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 text-gray-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  onAddJob();
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Job</span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function JobApplicationsPage() {
  const navigate = useNavigate();
  const {
    applications,
    totalApplications,
    isLoading,
    error,
    filters,
    viewMode,
    fetchApplications,
    deleteApplication,
    setFilters,
    setViewMode,
    exportCSV,
    clearError,
  } = useJobTrackerStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [contactsDialog, setContactsDialog] = useState<{ isOpen: boolean; job: JobApplication | null }>({
    isOpen: false,
    job: null,
  });

  const handleFindContacts = (job: JobApplication) => {
    setContactsDialog({ isOpen: true, job });
  };

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleEdit = (id: string) => {
    navigate(`/plugins/job-tracker/applications/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleExport = async () => {
    try {
      await exportCSV();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />

      <main className="ml-20 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/plugins/job-tracker"
              className="p-2 hover:bg-white rounded-xl transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
              <p className="text-gray-500 text-sm">Track and manage your job search journey</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/25"
          >
            <Plus className="w-4 h-4" />
            New Job
          </button>
        </div>

        {/* Pipeline Stats */}
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Your Job Pipeline</h2>
            <span className="text-sm text-gray-500">{totalApplications} opportunities tracked</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters & View Toggle */}
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ status: e.target.value || undefined })}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {JOB_STATUSES.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters({ priority: e.target.value || undefined })}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              {JOB_PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              title="Export to CSV"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'table'
                    ? "bg-sky-100 text-sky-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Table className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'cards'
                    ? "bg-sky-100 text-sky-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'kanban'
                    ? "bg-sky-100 text-sky-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Columns className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && applications.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500 mb-6">Start tracking your job search by adding your first application</p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Your First Job
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'table' && (
              <div className="space-y-4">
                {applications.map((job) => (
                  <JobApplicationTimelineRow
                    key={job.id}
                    application={job}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteConfirm(id)}
                    onFindContacts={handleFindContacts}
                  />
                ))}
              </div>
            )}
            {viewMode === 'cards' && (
              <CardView
                applications={applications}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteConfirm(id)}
                onFindContacts={handleFindContacts}
              />
            )}
            {viewMode === 'kanban' && (
              <KanbanView
                applications={applications}
                onEdit={handleEdit}
                onAddJob={() => setShowAddDialog(true)}
              />
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setDeleteConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Application?</h3>
                <p className="text-gray-500 mb-6">
                  This will permanently delete this job application and all associated tasks, documents, and referrals. This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Job Dialog */}
        <AddJobDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => fetchApplications()}
        />

        {/* Company Contacts Dialog */}
        {contactsDialog.job && (
          <CompanyContactsDialog
            isOpen={contactsDialog.isOpen}
            onClose={() => setContactsDialog({ isOpen: false, job: null })}
            jobId={contactsDialog.job.id}
            company={contactsDialog.job.company}
            jobTitle={contactsDialog.job.jobTitle}
            jobDescription={contactsDialog.job.jobDescription}
          />
        )}
      </main>
    </div>
  );
}
