import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2, FileEdit } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasButton, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function CanvasJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });
    const load = useCallback(async () => { if (!id || id === 'new') { setLoading(false); return; } setLoading(true); try { const r = await jobTrackerApi.getApplication(id); const a = r.data?.data; if (a) setForm({ company: a.company || '', jobTitle: a.jobTitle || '', status: a.status || 'saved', priority: a.priority || 'medium', jobUrl: a.jobUrl || '', notes: a.notes || '' }); } catch (e) { console.error(e); } finally { setLoading(false); } }, [id]);
    useEffect(() => { load(); }, [load]);
    const save = async () => { setSaving(true); try { if (id === 'new') { await jobTrackerApi.createApplication(form); } else { await jobTrackerApi.updateApplication(id!, form); } navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } finally { setSaving(false); } };
    const del = async () => { if (!id || id === 'new' || !confirm('Delete?')) return; try { await jobTrackerApi.deleteApplication(id); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } };

    if (loading) return <CanvasLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--canvas-accent)]" /></div></CanvasLayout>;

    return (
        <CanvasLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><Link to="/plugins/job-tracker/applications"><CanvasButton><ArrowLeft className="w-4 h-4" /></CanvasButton></Link><CanvasTitle>{id === 'new' ? 'New Application' : 'Edit Application'}</CanvasTitle></div>
                <div className="flex gap-2">{id !== 'new' && <CanvasButton variant="danger" onClick={del}><Trash2 className="w-4 h-4" /></CanvasButton>}<CanvasButton variant="primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</CanvasButton></div>
            </div>
            <CanvasWindow title="Application Details" icon={<FileEdit className="w-4 h-4" />} zLevel="mid">
                <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-sm text-[var(--canvas-text-muted)] mb-2">Company</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="canvas-input" /></div>
                    <div><label className="block text-sm text-[var(--canvas-text-muted)] mb-2">Job Title</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="canvas-input" /></div>
                    <div><label className="block text-sm text-[var(--canvas-text-muted)] mb-2">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="canvas-input"><option value="saved">Saved</option><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="offered">Offered</option><option value="rejected">Rejected</option></select></div>
                    <div><label className="block text-sm text-[var(--canvas-text-muted)] mb-2">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="canvas-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                    <div><label className="block text-sm text-[var(--canvas-text-muted)] mb-2">Job URL</label><input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="canvas-input" /></div>
                    <div className="col-span-2"><label className="block text-sm text-[var(--canvas-text-muted)] mb-2">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="canvas-input" /></div>
                </div>
            </CanvasWindow>
        </CanvasLayout>
    );
}
