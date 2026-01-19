import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Plus,
    Search,
    LayoutGrid,
    Columns,
    Trash2,
    Edit,
    Filter,
    Users,
    ExternalLink,
    Calendar,
    Building2,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton, HUDBadge } from '@/components/hud/HUDComponents';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { JobApplication, JOB_STATUSES } from '@/lib/plugins-api';
import { AddJobDialog } from '@/components/AddJobDialog';
import { CompanyContactsDialog } from '@/components/CompanyContactsDialog';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    wishlist: { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-400', glow: 'rgba(156,163,175,0.5)' },
    applied: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'rgba(59,130,246,0.5)' },
    interview: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'rgba(234,179,8,0.5)' },
    offer: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', glow: 'rgba(34,197,94,0.5)' },
    rejected: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', glow: 'rgba(239,68,68,0.5)' },
};

export function HUDJobApplicationsPage() {
    const navigate = useNavigate();
    const { applications, isLoading, fetchApplications, deleteApplication } = useJobTrackerStore();
    const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
    const [showContactsDialog, setShowContactsDialog] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleDelete = async (id: string) => {
        if (confirm('Delete this application?')) {
            await deleteApplication(id);
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <HUDLayout>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <Briefcase className="w-10 h-10 text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.5))' }} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                                APPLICATIONS
                            </h1>
                            <p className="text-cyan-600/70 mt-1 font-mono">
                                {applications.length} tracked applications
                            </p>
                        </div>
                    </div>

                    <HUDButton variant="primary" onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Application
                    </HUDButton>
                </div>

                <motion.div
                    className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1 }}
                />
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <HUDPanel className="p-4 mb-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                            <input
                                type="text"
                                placeholder="Search companies or roles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="hud-input pl-10 pr-4 py-2 w-full"
                            />
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-cyan-600" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="hud-input px-3 py-2"
                            >
                                <option value="all">All Status</option>
                                {JOB_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* View toggle */}
                        <div className="flex border border-cyan-500/30 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'grid' ? "bg-cyan-500/20 text-cyan-400" : "text-cyan-600 hover:bg-cyan-500/10"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'kanban' ? "bg-cyan-500/20 text-cyan-400" : "text-cyan-600 hover:bg-cyan-500/10"
                                )}
                            >
                                <Columns className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </HUDPanel>
            </motion.div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <motion.div
                        className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            ) : viewMode === 'grid' ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    <AnimatePresence>
                        {filteredApps.map((app, index) => {
                            const colors = statusColors[app.status] || statusColors.wishlist;
                            return (
                                <motion.div
                                    key={app.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div
                                        className={cn(
                                            "p-5 rounded-2xl border backdrop-blur-sm transition-all cursor-pointer group",
                                            "border-cyan-500/30 bg-gradient-to-br from-gray-900/80 to-cyan-900/10",
                                            "hover:border-cyan-400/50"
                                        )}
                                        style={{ boxShadow: `0 0 15px ${colors.glow}` }}
                                        onClick={() => navigate(`/plugins/job-tracker/applications/${app.id}`)}
                                    >
                                        {/* Status */}
                                        <div className="flex items-center justify-between mb-3">
                                            <HUDBadge className={cn(colors.bg, colors.border, colors.text)}>
                                                {JOB_STATUSES.find(s => s.value === app.status)?.label || app.status}
                                            </HUDBadge>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/plugins/job-tracker/applications/${app.id}`); }}
                                                    className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedJob(app); setShowContactsDialog(true); }}
                                                    className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                                >
                                                    <Users className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                                                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Company */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <Building2 className="w-4 h-4 text-cyan-500" />
                                            <h3 className="text-lg font-semibold text-cyan-200 truncate">{app.company}</h3>
                                        </div>

                                        {/* Title */}
                                        <p className="text-cyan-400 mb-3 truncate">{app.jobTitle}</p>

                                        {/* Meta */}
                                        <div className="flex items-center gap-4 text-xs text-cyan-600">
                                            {app.location && (
                                                <span className="truncate">{app.location}</span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>

                                        {/* Job URL */}
                                        {app.jobUrl && (
                                            <a
                                                href={app.jobUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View Posting
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            ) : (
                /* Kanban View */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4 overflow-x-auto pb-4"
                >
                    {JOB_STATUSES.map((status) => {
                        const statusApps = filteredApps.filter(a => a.status === status.value);
                        const colors = statusColors[status.value] || statusColors.wishlist;
                        return (
                            <div key={status.value} className="flex-shrink-0 w-72">
                                <HUDPanel className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <HUDBadge className={cn(colors.bg, colors.border, colors.text)}>
                                            {status.label}
                                        </HUDBadge>
                                        <span className="text-xs text-cyan-600 font-mono">{statusApps.length}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                        {statusApps.map((app) => (
                                            <motion.div
                                                key={app.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 cursor-pointer transition-all"
                                                onClick={() => navigate(`/plugins/job-tracker/applications/${app.id}`)}
                                            >
                                                <p className="font-medium text-cyan-200 truncate">{app.company}</p>
                                                <p className="text-sm text-cyan-500 truncate">{app.jobTitle}</p>
                                            </motion.div>
                                        ))}
                                        {statusApps.length === 0 && (
                                            <p className="text-center text-cyan-700 py-4 text-sm">No applications</p>
                                        )}
                                    </div>
                                </HUDPanel>
                            </div>
                        );
                    })}
                </motion.div>
            )}

            {filteredApps.length === 0 && !isLoading && (
                <HUDPanel className="p-8 text-center">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 text-cyan-600" />
                    <p className="text-cyan-400 mb-2">No applications found</p>
                    <p className="text-sm text-cyan-600 mb-4">Add your first job application to get started</p>
                    <HUDButton variant="primary" onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Application
                    </HUDButton>
                </HUDPanel>
            )}

            {/* Add Dialog */}
            <AddJobDialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSuccess={() => { setShowAddDialog(false); fetchApplications(); }}
            />

            {/* Contacts Dialog */}
            {selectedJob && (
                <CompanyContactsDialog
                    jobId={selectedJob.id}
                    company={selectedJob.company}
                    jobTitle={selectedJob.jobTitle}
                    isOpen={showContactsDialog}
                    onClose={() => { setShowContactsDialog(false); setSelectedJob(null); }}
                />
            )}
        </HUDLayout>
    );
}
