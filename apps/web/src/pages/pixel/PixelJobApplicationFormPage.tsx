import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelTitle } from '@/components/pixel/PixelComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function PixelJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ company: '', jobTitle: '', status: 'saved', priority: 'medium', jobUrl: '', notes: '' });
    const load = useCallback(async () => { if (!id || id === 'new') { setLoading(false); return; } setLoading(true); try { const r = await jobTrackerApi.getApplication(id); const a = r.data?.data; if (a) setForm({ company: a.company || '', jobTitle: a.jobTitle || '', status: a.status || 'saved', priority: a.priority || 'medium', jobUrl: a.jobUrl || '', notes: a.notes || '' }); } catch (e) { console.error(e); } finally { setLoading(false); } }, [id]);
    useEffect(() => { load(); }, [load]);
    const save = async () => { setSaving(true); try { if (id === 'new') { await jobTrackerApi.createApplication(form); } else { await jobTrackerApi.updateApplication(id!, form); } navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } finally { setSaving(false); } };
    const del = async () => { if (!id || id === 'new' || !confirm('DELETE?')) return; try { await jobTrackerApi.deleteApplication(id); navigate('/plugins/job-tracker/applications'); } catch (e) { console.error(e); } };

    if (loading) return <PixelLayout><div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[var(--pixel-cyan)]" /></div></PixelLayout>;

    return (
        <PixelLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker/applications"><PixelButton><ArrowLeft className="w-4 h-4" /></PixelButton></Link><PixelTitle>{id === 'new' ? 'NEW APP' : 'EDIT APP'}</PixelTitle></div>
                <div className="flex gap-2">{id !== 'new' && <PixelButton onClick={del}><Trash2 className="w-4 h-4" /></PixelButton>}<PixelButton variant="primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} SAVE</PixelButton></div>
            </div>
            <PixelCard>
                <div className="grid grid-cols-2 gap-6">
                    <div><label style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>COMPANY</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="pixel-input mt-2" /></div>
                    <div><label style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>ROLE</label><input type="text" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="pixel-input mt-2" /></div>
                    <div><label style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>STATUS</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="pixel-input mt-2"><option value="saved">SAVED</option><option value="applied">APPLIED</option><option value="interviewing">INTERVIEWING</option><option value="offered">OFFERED</option><option value="rejected">REJECTED</option></select></div>
                    <div><label style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>PRIORITY</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="pixel-input mt-2"><option value="low">LOW</option><option value="medium">MEDIUM</option><option value="high">HIGH</option></select></div>
                    <div className="col-span-2"><label style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>URL</label><input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="pixel-input mt-2" /></div>
                    <div className="col-span-2"><label style={{ fontFamily: 'var(--font-pixel-heading)', fontSize: '0.375rem', color: 'var(--pixel-cyan)' }}>NOTES</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="pixel-input mt-2" /></div>
                </div>
            </PixelCard>
        </PixelLayout>
    );
}
