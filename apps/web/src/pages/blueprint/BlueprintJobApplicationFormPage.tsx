import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton } from '@/components/blueprint/BlueprintComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function BlueprintJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });

    const loadApp = useCallback(async () => { if (!id) return; setLoading(true); try { const r = await jobTrackerApi.getApplication(id); const a = r.data?.data; if (a) setForm({ company: a.company || '', jobTitle: a.jobTitle || '', status: a.status || 'saved', priority: a.priority || 'medium', jobUrl: a.jobUrl || '', notes: a.notes || '' }); } catch (e) { console.error(e); } finally { setLoading(false); } }, [id]);
    useEffect(() => { loadApp(); }, [loadApp]);

    const handleSave = async () => { if (!id) return; setSaving(true); try { await jobTrackerApi.updateApplication(id, form); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } finally { setSaving(false); } };
    const handleDelete = async () => { if (!id || !confirm('Delete?')) return; try { await jobTrackerApi.deleteApplication(id); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } };

    if (loading) return <BlueprintLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div></BlueprintLayout>;

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Edit Application" subtitle={form.company} actions={<div className="flex items-center gap-3"><Link to="/plugins/job-tracker/applications"><BlueprintButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</BlueprintButton></Link><BlueprintButton variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</BlueprintButton><BlueprintButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save</BlueprintButton></div>} />
            <BlueprintCard>
                <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-xs uppercase tracking-wide text-[var(--blueprint-text-dim)] mb-2">Company</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="blueprint-input" /></div>
                    <div><label className="block text-xs uppercase tracking-wide text-[var(--blueprint-text-dim)] mb-2">Job Title</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="blueprint-input" /></div>
                    <div><label className="block text-xs uppercase tracking-wide text-[var(--blueprint-text-dim)] mb-2">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="blueprint-input"><option value="saved">Saved</option><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="offered">Offered</option><option value="rejected">Rejected</option></select></div>
                    <div><label className="block text-xs uppercase tracking-wide text-[var(--blueprint-text-dim)] mb-2">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="blueprint-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                    <div><label className="block text-xs uppercase tracking-wide text-[var(--blueprint-text-dim)] mb-2">Job URL</label><input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="blueprint-input" /></div>
                    <div className="col-span-2"><label className="block text-xs uppercase tracking-wide text-[var(--blueprint-text-dim)] mb-2">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="blueprint-input" /></div>
                </div>
            </BlueprintCard>
        </BlueprintLayout>
    );
}
