import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicButton, ComicTitle } from '@/components/comic/ComicComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function ComicJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });
    const load = useCallback(async () => { if (!id || id === 'new') { setLoading(false); return; } setLoading(true); try { const r = await jobTrackerApi.getApplication(id); const a = r.data?.data; if (a) setForm({ company: a.company || '', jobTitle: a.jobTitle || '', status: a.status || 'saved', priority: a.priority || 'medium', jobUrl: a.jobUrl || '', notes: a.notes || '' }); } catch (e) { console.error(e); } finally { setLoading(false); } }, [id]);
    useEffect(() => { load(); }, [load]);
    const save = async () => { setSaving(true); try { if (id === 'new') { await jobTrackerApi.createApplication(form); } else { await jobTrackerApi.updateApplication(id!, form); } navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } finally { setSaving(false); } };
    const del = async () => { if (!id || id === 'new' || !confirm('DELETE?!')) return; try { await jobTrackerApi.deleteApplication(id); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } };

    if (loading) return <ComicLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--comic-blue)]" /></div></ComicLayout>;

    return (
        <ComicLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><Link to="/plugins/job-tracker/applications"><ComicButton><ArrowLeft className="w-5 h-5" /></ComicButton></Link><ComicTitle>{id === 'new' ? 'New Application!' : 'Edit Application!'}</ComicTitle></div>
                <div className="flex gap-2">{id !== 'new' && <ComicButton variant="danger" onClick={del}><Trash2 className="w-5 h-5" /> ZAP!</ComicButton>}<ComicButton variant="primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} SAVE!</ComicButton></div>
            </div>
            <ComicPanel title="Details!">
                <div className="grid grid-cols-2 gap-6">
                    <div><label className="block font-bold mb-2">COMPANY!</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="comic-input" /></div>
                    <div><label className="block font-bold mb-2">JOB TITLE!</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="comic-input" /></div>
                    <div><label className="block font-bold mb-2">STATUS!</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="comic-input"><option value="saved">Saved</option><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="offered">Offered</option><option value="rejected">Rejected</option></select></div>
                    <div><label className="block font-bold mb-2">PRIORITY!</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="comic-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                    <div><label className="block font-bold mb-2">JOB URL!</label><input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="comic-input" /></div>
                    <div className="col-span-2"><label className="block font-bold mb-2">NOTES!</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="comic-input" /></div>
                </div>
            </ComicPanel>
        </ComicLayout>
    );
}
