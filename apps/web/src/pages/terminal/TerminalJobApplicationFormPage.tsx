import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton } from '@/components/terminal/TerminalComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

export function TerminalJobApplicationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadApp = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const res = await jobTrackerApi.getApplication(id);
            setApp(res.data?.data);
        } catch (error) {
            console.error('Failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { loadApp(); }, [loadApp]);

    const handleSave = async () => {
        if (!app || !id) return;
        setIsSaving(true);
        try {
            await jobTrackerApi.updateApplication(id, app);
            navigate('/plugins/job-tracker/applications');
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Delete this application?')) return;
        try {
            await jobTrackerApi.deleteApplication(id);
            navigate('/plugins/job-tracker/applications');
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const updateField = (field: string, value: any) => setApp({ ...app, [field]: value });

    if (isLoading) return <TerminalLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div></TerminalLayout>;
    if (!app) return <TerminalLayout><p className="text-center text-[var(--terminal-text-dim)] py-20">NOT FOUND</p></TerminalLayout>;

    const statuses = ['wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];
    const priorities = ['low', 'medium', 'high'];

    return (
        <TerminalLayout>
            <TerminalHeader
                title={app.company}
                subtitle={app.jobTitle}
                actions={
                    <div className="flex items-center gap-2">
                        <TerminalButton onClick={() => navigate('/plugins/job-tracker/applications')}><ArrowLeft className="w-3 h-3 mr-1" /> Back</TerminalButton>
                        <TerminalButton variant="danger" onClick={handleDelete}><Trash2 className="w-3 h-3" /></TerminalButton>
                        <TerminalButton variant="primary" onClick={handleSave} disabled={isSaving}><Save className="w-3 h-3 mr-1" /> Save</TerminalButton>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TerminalPanel title="Details">
                    <div className="space-y-3">
                        <div><label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">Company</label><input type="text" value={app.company || ''} onChange={(e) => updateField('company', e.target.value)} className="terminal-input" /></div>
                        <div><label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">Position</label><input type="text" value={app.jobTitle || ''} onChange={(e) => updateField('jobTitle', e.target.value)} className="terminal-input" /></div>
                        <div><label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">Location</label><input type="text" value={app.location || ''} onChange={(e) => updateField('location', e.target.value)} className="terminal-input" /></div>
                        <div><label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">URL</label><input type="text" value={app.jobUrl || ''} onChange={(e) => updateField('jobUrl', e.target.value)} className="terminal-input" /></div>
                    </div>
                </TerminalPanel>

                <TerminalPanel title="Status">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">Status</label>
                            <div className="flex flex-wrap gap-1">
                                {statuses.map(s => (<button key={s} onClick={() => updateField('status', s)} className={`px-2 py-1 text-[10px] uppercase ${app.status === s ? 'bg-[var(--terminal-amber)] text-black' : 'bg-[var(--terminal-dark)] border border-[var(--terminal-border)]'}`}>{s}</button>))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">Priority</label>
                            <div className="flex gap-1">
                                {priorities.map(p => (<button key={p} onClick={() => updateField('priority', p)} className={`px-2 py-1 text-[10px] uppercase ${app.priority === p ? 'bg-[var(--terminal-amber)] text-black' : 'bg-[var(--terminal-dark)] border border-[var(--terminal-border)]'}`}>{p}</button>))}
                            </div>
                        </div>
                        <div><label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">Salary Min</label><input type="number" value={app.salaryMin || ''} onChange={(e) => updateField('salaryMin', parseInt(e.target.value) || 0)} className="terminal-input" /></div>
                        <div><label className="block text-[10px] uppercase text-[var(--terminal-text-dim)] mb-1">Salary Max</label><input type="number" value={app.salaryMax || ''} onChange={(e) => updateField('salaryMax', parseInt(e.target.value) || 0)} className="terminal-input" /></div>
                    </div>
                </TerminalPanel>

                <div className="lg:col-span-2">
                    <TerminalPanel title="Notes">
                        <textarea value={app.notes || ''} onChange={(e) => updateField('notes', e.target.value)} rows={6} className="terminal-input resize-none" placeholder="Notes..." />
                    </TerminalPanel>
                </div>
            </div>
        </TerminalLayout>
    );
}
