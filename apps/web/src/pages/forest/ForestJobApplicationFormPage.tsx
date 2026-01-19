import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, ArrowLeft, Save, Trash2, MapPin, DollarSign, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestButton } from '@/components/forest/ForestComponents';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { JOB_STATUSES, JOB_PRIORITIES, EMPLOYMENT_TYPES, JobApplication } from '@/lib/plugins-api';

export function ForestJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { applications, isLoading, fetchApplications, updateApplication, deleteApplication } = useJobTrackerStore();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<JobApplication>>({
        company: '', jobTitle: '', status: 'wishlist', priority: 'medium',
        location: '', jobUrl: '', salaryMin: undefined, salaryMax: undefined,
        employmentType: 'full-time', notes: '',
    });

    useEffect(() => {
        if (applications.length === 0) fetchApplications();
    }, [applications.length, fetchApplications]);

    useEffect(() => {
        if (id && applications.length > 0) {
            const app = applications.find(a => a.id === id);
            if (app) {
                setFormData({
                    company: app.company, jobTitle: app.jobTitle, status: app.status, priority: app.priority,
                    location: app.location || '', jobUrl: app.jobUrl || '',
                    salaryMin: app.salaryMin, salaryMax: app.salaryMax,
                    employmentType: app.employmentType || 'full-time', notes: app.notes || '',
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
            <ForestLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            </ForestLayout>
        );
    }

    return (
        <ForestLayout>
            <ForestPageHeader
                title={application ? 'Edit Application' : 'Application'}
                subtitle={application ? `${application.company} - ${application.jobTitle}` : undefined}
                icon={<Briefcase className="w-6 h-6" />}
                actions={
                    <Link to="/plugins/job-tracker/applications">
                        <ForestButton><ArrowLeft className="w-4 h-4 mr-2" /> Back</ForestButton>
                    </Link>
                }
            />

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                    <ForestCard className="!p-4 !border-[var(--forest-danger)]">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-[var(--forest-danger)]" />
                            <p className="text-[var(--forest-danger)]">{error}</p>
                        </div>
                    </ForestCard>
                </motion.div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <ForestCard>
                        <h3 className="text-lg font-semibold text-[var(--forest-moss)] mb-4">Basic Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--forest-wood)] mb-1">Company *</label>
                                <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="forest-input" required />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--forest-wood)] mb-1">Job Title *</label>
                                <input type="text" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="forest-input" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-[var(--forest-wood)] mb-1">Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="forest-input">
                                        {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--forest-wood)] mb-1">Priority</label>
                                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="forest-input">
                                        {JOB_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </ForestCard>

                    {/* Details */}
                    <ForestCard>
                        <h3 className="text-lg font-semibold text-[var(--forest-moss)] mb-4">Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--forest-wood)] mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</label>
                                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="forest-input" placeholder="Remote, San Francisco, etc." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-[var(--forest-wood)] mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Min Salary</label>
                                    <input type="number" value={formData.salaryMin || ''} onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value ? parseInt(e.target.value) : undefined })} className="forest-input" />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--forest-wood)] mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Max Salary</label>
                                    <input type="number" value={formData.salaryMax || ''} onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value ? parseInt(e.target.value) : undefined })} className="forest-input" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--forest-wood)] mb-1">Employment Type</label>
                                <select value={formData.employmentType} onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })} className="forest-input">
                                    {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--forest-wood)] mb-1 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Job URL</label>
                                <input type="url" value={formData.jobUrl} onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })} className="forest-input" />
                            </div>
                        </div>
                    </ForestCard>

                    {/* Notes */}
                    <ForestCard className="lg:col-span-2">
                        <h3 className="text-lg font-semibold text-[var(--forest-moss)] mb-4">Notes</h3>
                        <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="forest-input h-32 resize-none" placeholder="Add notes..." />
                    </ForestCard>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-between">
                    <ForestButton type="button" onClick={handleDelete} className="!border-[var(--forest-danger)] !text-[var(--forest-danger)]">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </ForestButton>
                    <ForestButton type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </ForestButton>
                </div>
            </form>
        </ForestLayout>
    );
}
