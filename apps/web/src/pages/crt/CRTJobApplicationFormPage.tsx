import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTButton, CRTTitle } from '@/components/crt/CRTComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function CRTJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });

    const loadApp = useCallback(async () => { if (!id || id === 'new') { setLoading(false); return; } setLoading(true); try { const r = await jobTrackerApi.getApplication(id); const a = r.data?.data; if (a) setForm({ company: a.company || '', jobTitle: a.jobTitle || '', status: a.status || 'saved', priority: a.priority || 'medium', jobUrl: a.jobUrl || '', notes: a.notes || '' }); } catch (e) { console.error(e); } finally { setLoading(false); } }, [id]);
    useEffect(() => { loadApp(); }, [loadApp]);

    const handleSave = async () => { setSaving(true); try { if (id === 'new') { await jobTrackerApi.createApplication(form); } else { await jobTrackerApi.updateApplication(id!, form); } navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } finally { setSaving(false); } };
    const handleDelete = async () => { if (!id || id === 'new' || !confirm('DELETE?')) return; try { await jobTrackerApi.deleteApplication(id); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } };

    if (loading) return <CRTLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--crt-green)]" /></div></CRTLayout>;

    return (
        <CRTLayout>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Link to="/plugins/job-tracker/applications"><CRTButton><ArrowLeft className="w-4 h-4" /></CRTButton></Link>
                    <CRTTitle>{id === 'new' ? 'New Application' : 'Edit Application'}</CRTTitle>
                </div>
                <div className="flex gap-3">
                    {id !== 'new' && <CRTButton variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4" /> [DEL]</CRTButton>}
                    <CRTButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} [SAVE]</CRTButton>
                </div>
            </div>

            <CRTPanel header="Application Data">
                <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-[var(--crt-amber)] text-sm mb-1">COMPANY</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="crt-input" /></div>
                    <div><label className="block text-[var(--crt-amber)] text-sm mb-1">JOB_TITLE</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="crt-input" /></div>
                    <div><label className="block text-[var(--crt-amber)] text-sm mb-1">STATUS</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="crt-input"><option value="saved">SAVED</option><option value="applied">APPLIED</option><option value="interviewing">INTERVIEWING</option><option value="offered">OFFERED</option><option value="rejected">REJECTED</option></select></div>
                    <div><label className="block text-[var(--crt-amber)] text-sm mb-1">PRIORITY</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="crt-input"><option value="low">LOW</option><option value="medium">MEDIUM</option><option value="high">HIGH</option></select></div>
                    <div><label className="block text-[var(--crt-amber)] text-sm mb-1">JOB_URL</label><input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="crt-input" /></div>
                    <div className="col-span-2"><label className="block text-[var(--crt-amber)] text-sm mb-1">NOTES</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="crt-input" /></div>
                </div>
            </CRTPanel>
        </CRTLayout>
    );
}
