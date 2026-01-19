import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Search, Grid, List, Loader2, ExternalLink } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestButton, ForestBadge, ForestEmpty } from '@/components/forest/ForestComponents';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { AddJobDialog } from '@/components/AddJobDialog';
import { cn } from '@/lib/utils';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'wood'> = {
    wishlist: 'default',
    applied: 'wood',
    interviewing: 'warning',
    offer: 'success',
    rejected: 'danger',
    withdrawn: 'default',
};

export function ForestJobApplicationsPage() {
    const { applications, isLoading, fetchApplications } = useJobTrackerStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const filtered = applications.filter(app => {
        const matchesSearch = !searchQuery ||
            app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statuses = ['all', 'wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Applications"
                subtitle={`${applications.length} total applications`}
                icon={<Briefcase className="w-6 h-6" />}
                actions={
                    <ForestButton variant="primary" onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Application
                    </ForestButton>
                }
            />

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--forest-wood)]" />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="forest-input pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {statuses.map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize",
                                statusFilter === status
                                    ? "bg-[var(--forest-gradient-primary)] text-white"
                                    : "bg-[rgba(74,124,89,0.1)] text-[var(--forest-moss)] hover:bg-[rgba(74,124,89,0.2)]"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[rgba(74,124,89,0.1)]">
                    <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-md", viewMode === 'grid' && "bg-white shadow-sm")}>
                        <Grid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-md", viewMode === 'list' && "bg-white shadow-sm")}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <ForestCard>
                    <ForestEmpty
                        icon={<Briefcase className="w-full h-full" />}
                        title="No applications found"
                        description={searchQuery ? "Try a different search term" : "Add your first job application"}
                        action={
                            <ForestButton variant="primary" onClick={() => setShowAddDialog(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Application
                            </ForestButton>
                        }
                    />
                </ForestCard>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                    {filtered.map((app, index) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <Link to={`/plugins/job-tracker/applications/${app.id}`}>
                                <ForestCard className={viewMode === 'list' ? '!p-4 flex items-center gap-4' : ''}>
                                    <div className={viewMode === 'list' ? "w-12 h-12 rounded-lg bg-[rgba(74,124,89,0.1)] flex items-center justify-center" : "mb-3"}>
                                        {viewMode === 'grid' ? (
                                            <div className="w-12 h-12 rounded-lg bg-[rgba(74,124,89,0.1)] flex items-center justify-center text-[var(--forest-leaf)] font-semibold text-lg">
                                                {app.company.charAt(0)}
                                            </div>
                                        ) : (
                                            <span className="text-[var(--forest-leaf)] font-semibold">{app.company.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className={viewMode === 'list' ? "flex-1 min-w-0" : ""}>
                                        <p className="font-semibold text-[var(--forest-moss)] truncate">{app.company}</p>
                                        <p className="text-sm text-[var(--forest-wood)] truncate">{app.jobTitle}</p>
                                        {app.location && viewMode === 'grid' && (
                                            <p className="text-xs text-[var(--forest-wood)] mt-1">{app.location}</p>
                                        )}
                                    </div>
                                    <div className={viewMode === 'list' ? "flex items-center gap-3" : "mt-3 flex items-center justify-between"}>
                                        <ForestBadge variant={statusColors[app.status] || 'default'}>
                                            {app.status}
                                        </ForestBadge>
                                        {app.jobUrl && (
                                            <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                <ExternalLink className="w-4 h-4 text-[var(--forest-wood)] hover:text-[var(--forest-leaf)]" />
                                            </a>
                                        )}
                                    </div>
                                </ForestCard>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            <AddJobDialog isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} />
        </ForestLayout>
    );
}
