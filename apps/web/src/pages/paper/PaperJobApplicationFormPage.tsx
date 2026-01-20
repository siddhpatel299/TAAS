import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperButton, PaperTitle } from '@/components/paper/PaperComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function PaperJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });
    const load = useCallback(async () => { if (!id || id === 'new') { setLoading(false); return; } setLoading(true); try { const r = await jobTrackerApi.getApplication(id); const a = r.data?.data; if (a) setForm({ company: a.company || '', jobTitle: a.jobTitle || '', status: a.status || 'saved', priority: a.priority || 'medium', jobUrl: a.jobUrl || '', notes: a.notes || '' }); } catch (e) { console.error(e); } finally { setLoading(false); } }, [id]);
    useEffect(() => { load(); }, [load]);
    const save = async () => { setSaving(true); try { if (id === 'new') { await jobTrackerApi.createApplication(form); } else { await jobTrackerApi.updateApplication(id!, form); } navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } finally { setSaving(false); } };
    const del = async () => { if (!id || id === 'new' || !confirm('Delete?')) return; try { await jobTrackerApi.deleteApplication(id); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } };

    if (loading) return <PaperLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--ink-blue)]" /></div></PaperLayout>;

    return (
        <PaperLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker/applications"><PaperButton><ArrowLeft className="w-4 h-4" /></PaperButton></Link><PaperTitle>{id === 'new' ? '✏️ New Application' : '✏️ Edit Application'}</PaperTitle></div>
                <div className="flex gap-2">{id !== 'new' && <PaperButton onClick={del}><Trash2 className="w-4 h-4" /> delete</PaperButton>}<PaperButton variant="primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} save</PaperButton></div>
            </div>
            <PaperCard>
                <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-sm mb-2 text-[var(--ink-blue)]">Company</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="paper-input" /></div>
                    <div><label className="block text-sm mb-2 text-[var(--ink-blue)]">Position</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="paper-input" /></div>
                    <div><label className="block text-sm mb-2 text-[var(--ink-blue)]">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="paper-input"><option value="saved">Saved</option><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="offered">Offered</option><option value="rejected">Rejected</option></select></div>
                    <div><label className="block text-sm mb-2 text-[var(--ink-blue)]">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="paper-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                    <div><label className="block text-sm mb-2 text-[var(--ink-blue)]">Job URL</label><input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="paper-input" /></div>
                    <div className="col-span-2"><label className="block text-sm mb-2 text-[var(--ink-blue)]">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="paper-input" style={{ borderBottom: 'none', background: 'var(--paper-cream)', border: '1px dashed var(--ink-black)', padding: '12px' }} /></div>
                </div>
            </PaperCard>
        </PaperLayout>
    );
}
