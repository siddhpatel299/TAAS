import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintButton } from '@/components/newsprint/NewsprintComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function NewsprintJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });

    const loadApp = useCallback(async () => { if (!id) return; setLoading(true); try { const r = await jobTrackerApi.getApplication(id); const a = r.data?.data; if (a) setForm({ company: a.company || '', jobTitle: a.jobTitle || '', status: a.status || 'saved', priority: a.priority || 'medium', jobUrl: a.jobUrl || '', notes: a.notes || '' }); } catch (e) { console.error(e); } finally { setLoading(false); } }, [id]);
    useEffect(() => { loadApp(); }, [loadApp]);

    const handleSave = async () => { if (!id) return; setSaving(true); try { await jobTrackerApi.updateApplication(id, form); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } finally { setSaving(false); } };
    const handleDelete = async () => { if (!id || !confirm('Delete?')) return; try { await jobTrackerApi.deleteApplication(id); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } };

    if (loading) return <NewsprintLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin" /></div></NewsprintLayout>;

    return (
        <NewsprintLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker/applications"><NewsprintButton><ArrowLeft className="w-4 h-4" /></NewsprintButton></Link>
                    <h1 className="text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Edit Application</h1>
                </div>
                <div className="flex gap-3">
                    <NewsprintButton variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</NewsprintButton>
                    <NewsprintButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save</NewsprintButton>
                </div>
            </div>

            <NewsprintCard>
                <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-sm uppercase tracking-wide text-[var(--newsprint-ink-muted)] mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Company</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="newsprint-input" /></div>
                    <div><label className="block text-sm uppercase tracking-wide text-[var(--newsprint-ink-muted)] mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Job Title</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="newsprint-input" /></div>
                    <div><label className="block text-sm uppercase tracking-wide text-[var(--newsprint-ink-muted)] mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="newsprint-input"><option value="saved">Saved</option><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="offered">Offered</option><option value="rejected">Rejected</option></select></div>
                    <div><label className="block text-sm uppercase tracking-wide text-[var(--newsprint-ink-muted)] mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="newsprint-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                    <div><label className="block text-sm uppercase tracking-wide text-[var(--newsprint-ink-muted)] mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Job URL</label><input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="newsprint-input" /></div>
                    <div className="col-span-2"><label className="block text-sm uppercase tracking-wide text-[var(--newsprint-ink-muted)] mb-2" style={{ fontFamily: 'var(--font-sans)' }}>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="newsprint-input" /></div>
                </div>
            </NewsprintCard>
        </NewsprintLayout>
    );
}
