import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenTitle, ZenSection } from '@/components/zen/ZenComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function ZenJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });
    const load = useCallback(async () => { if (!id || id === 'new') { setLoading(false); return; } setLoading(true); try { const r = await jobTrackerApi.getApplication(id); const a = r.data?.data; if (a) setForm({ company: a.company || '', jobTitle: a.jobTitle || '', status: a.status || 'saved', priority: a.priority || 'medium', jobUrl: a.jobUrl || '', notes: a.notes || '' }); } catch (e) { console.error(e); } finally { setLoading(false); } }, [id]);
    useEffect(() => { load(); }, [load]);
    const save = async () => { setSaving(true); try { if (id === 'new') { await jobTrackerApi.createApplication(form); } else { await jobTrackerApi.updateApplication(id!, form); } navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } finally { setSaving(false); } };
    const del = async () => { if (!id || id === 'new' || !confirm('Delete?')) return; try { await jobTrackerApi.deleteApplication(id); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } };

    if (loading) return <ZenLayout><div className="flex items-center justify-center" style={{ minHeight: '50vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div></ZenLayout>;

    return (
        <ZenLayout>
            <div className="flex items-center justify-between" style={{ marginBottom: '64px' }}>
                <div className="flex items-center gap-6"><Link to="/plugins/job-tracker/applications"><ZenButton><ArrowLeft className="w-3 h-3" /></ZenButton></Link><ZenTitle>{id === 'new' ? 'New' : 'Edit'}</ZenTitle></div>
                <div className="flex gap-4">{id !== 'new' && <ZenButton onClick={del}><Trash2 className="w-3 h-3" /> Delete</ZenButton>}<ZenButton variant="primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save</ZenButton></div>
            </div>
            <ZenSection>
                <ZenCard>
                    <div className="grid grid-cols-2 gap-10">
                        <div><label className="zen-section-header">Company</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="zen-input" /></div>
                        <div><label className="zen-section-header">Position</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="zen-input" /></div>
                        <div><label className="zen-section-header">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="zen-input"><option value="saved">Saved</option><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="offered">Offered</option><option value="rejected">Rejected</option></select></div>
                        <div><label className="zen-section-header">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="zen-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                        <div><label className="zen-section-header">URL</label><input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="zen-input" /></div>
                        <div className="col-span-2"><label className="zen-section-header">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="zen-input" /></div>
                    </div>
                </ZenCard>
            </ZenSection>
        </ZenLayout>
    );
}
