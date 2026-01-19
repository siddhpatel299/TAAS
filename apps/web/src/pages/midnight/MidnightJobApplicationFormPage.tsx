import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton } from '@/components/midnight/MidnightComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function MidnightJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });

    const loadApp = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await jobTrackerApi.getApplication(id);
            const app = res.data?.data;
            if (app) setForm({ company: app.company || '', jobTitle: app.jobTitle || '', status: app.status || 'saved', priority: app.priority || 'medium', jobUrl: app.jobUrl || '', notes: app.notes || '' });
        } catch (error) {
            console.error('Failed to load application:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadApp(); }, [loadApp]);

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            await jobTrackerApi.updateApplication(id, form);
            navigate('/plugins/job-tracker/applications');
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Delete this application?')) return;
        try {
            await jobTrackerApi.deleteApplication(id);
            navigate('/plugins/job-tracker/applications');
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    if (loading) {
        return <MidnightLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div></MidnightLayout>;
    }

    return (
        <MidnightLayout>
            <MidnightHeader
                title="Edit Application"
                subtitle={form.company}
                actions={
                    <div className="flex items-center gap-3">
                        <Link to="/plugins/job-tracker/applications"><MidnightButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</MidnightButton></Link>
                        <MidnightButton variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</MidnightButton>
                        <MidnightButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save</MidnightButton>
                    </div>
                }
            />

            <MidnightCard>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Company</label>
                        <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="midnight-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Job Title</label>
                        <input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="midnight-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="midnight-input">
                            <option value="saved">Saved</option>
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offered">Offered</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="midnight-input">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Job URL</label>
                        <input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="midnight-input" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="midnight-input" />
                    </div>
                </div>
            </MidnightCard>
        </MidnightLayout>
    );
}
