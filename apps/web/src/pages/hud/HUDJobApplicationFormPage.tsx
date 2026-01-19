import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Briefcase,
    ArrowLeft,
    Save,
    Trash2,
    MapPin,
    DollarSign,
    ExternalLink,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton } from '@/components/hud/HUDComponents';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { JOB_STATUSES, JOB_PRIORITIES, EMPLOYMENT_TYPES, JobApplication } from '@/lib/plugins-api';

export function HUDJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { applications, isLoading, fetchApplications, updateApplication, deleteApplication } = useJobTrackerStore();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<JobApplication>>({
        company: '',
        jobTitle: '',
        status: 'wishlist',
        priority: 'medium',
        location: '',
        jobUrl: '',
        salaryMin: undefined,
        salaryMax: undefined,
        employmentType: 'full-time',
        notes: '',
    });

    useEffect(() => {
        if (applications.length === 0) fetchApplications();
    }, [applications.length, fetchApplications]);

    useEffect(() => {
        if (id && applications.length > 0) {
            const app = applications.find(a => a.id === id);
            if (app) {
                setFormData({
                    company: app.company,
                    jobTitle: app.jobTitle,
                    status: app.status,
                    priority: app.priority,
                    location: app.location || '',
                    jobUrl: app.jobUrl || '',
                    salaryMin: app.salaryMin,
                    salaryMax: app.salaryMax,
                    employmentType: app.employmentType || 'full-time',
                    notes: app.notes || '',
                });
            }
        }
    }, [id, applications]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setIsSaving(true);
        setError(null);
        try {
            await updateApplication(id, formData);
            navigate('/plugins/job-tracker/applications');
        } catch (err: any) {
            setError(err.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Delete this application?')) return;
        try {
            await deleteApplication(id);
            navigate('/plugins/job-tracker/applications');
        } catch (err: any) {
            setError(err.message || 'Failed to delete');
        }
    };

    const application = id ? applications.find(a => a.id === id) : null;

    if (isLoading && !application) {
        return (
            <HUDLayout>
                <div className="flex items-center justify-center py-20">
                    <motion.div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                </div>
            </HUDLayout>
        );
    }

    return (
        <HUDLayout>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker/applications" className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                        <Briefcase className="w-10 h-10 text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.5))' }} />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                            {application ? 'EDIT APPLICATION' : 'APPLICATION'}
                        </h1>
                        {application && (
                            <p className="text-cyan-600/70 font-mono">{application.company} - {application.jobTitle}</p>
                        )}
                    </div>
                </div>
                <motion.div className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1 }} />
            </motion.div>

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                    <HUDPanel className="p-4 border-red-500/50">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400">{error}</p>
                        </div>
                    </HUDPanel>
                </motion.div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <HUDPanel className="p-6">
                            <h3 className="text-lg font-bold text-cyan-400 mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-cyan-600 mb-1">Company *</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="hud-input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-cyan-600 mb-1">Job Title *</label>
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                        className="hud-input w-full"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-cyan-600 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="hud-input w-full"
                                        >
                                            {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-cyan-600 mb-1">Priority</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="hud-input w-full"
                                        >
                                            {JOB_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </HUDPanel>
                    </motion.div>

                    {/* Details */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <HUDPanel className="p-6">
                            <h3 className="text-lg font-bold text-cyan-400 mb-4">Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-cyan-600 mb-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="hud-input w-full"
                                        placeholder="e.g., Remote, San Francisco"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-cyan-600 mb-1 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> Min Salary
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.salaryMin || ''}
                                            onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value ? parseInt(e.target.value) : undefined })}
                                            className="hud-input w-full"
                                            placeholder="100000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-cyan-600 mb-1 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> Max Salary
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.salaryMax || ''}
                                            onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value ? parseInt(e.target.value) : undefined })}
                                            className="hud-input w-full"
                                            placeholder="150000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-cyan-600 mb-1">Employment Type</label>
                                    <select
                                        value={formData.employmentType}
                                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                                        className="hud-input w-full"
                                    >
                                        {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-cyan-600 mb-1 flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" /> Job URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.jobUrl}
                                        onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                                        className="hud-input w-full"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </HUDPanel>
                    </motion.div>

                    {/* Notes */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                        <HUDPanel className="p-6">
                            <h3 className="text-lg font-bold text-cyan-400 mb-4">Notes</h3>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="hud-input w-full h-32 resize-none"
                                placeholder="Add any notes about this application..."
                            />
                        </HUDPanel>
                    </motion.div>
                </div>

                {/* Actions */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 flex justify-between">
                    <HUDButton type="button" onClick={handleDelete} className="text-red-400 border-red-500/50 hover:bg-red-500/20">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </HUDButton>
                    <HUDButton type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </HUDButton>
                </motion.div>
            </form>
        </HUDLayout>
    );
}
