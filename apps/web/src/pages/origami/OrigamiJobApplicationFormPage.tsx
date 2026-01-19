import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiButton } from '@/components/origami/OrigamiComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function OrigamiJobApplicationFormPage() {
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
        return <OrigamiLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--origami-terracotta)] animate-spin" /></div></OrigamiLayout>;
    }

    return (
        <OrigamiLayout>
            <OrigamiHeader
                title="Edit Application"
                subtitle={form.company}
                actions={
                    <div className="flex items-center gap-3">
                        <Link to="/plugins/job-tracker/applications"><OrigamiButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</OrigamiButton></Link>
                        <OrigamiButton variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</OrigamiButton>
                        <OrigamiButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save</OrigamiButton>
                    </div>
                }
            />

            <OrigamiCard>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Company</label>
                        <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="origami-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Job Title</label>
                        <input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="origami-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="origami-input">
                            <option value="saved">Saved</option>
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offered">Offered</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="origami-input">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Job URL</label>
                        <input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="origami-input" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="origami-input" />
                    </div>
                </div>
            </OrigamiCard>
        </OrigamiLayout>
    );
}
