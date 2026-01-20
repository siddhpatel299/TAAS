import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasButton, CanvasStat, CanvasTable, CanvasBadge, CanvasEmpty, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function CanvasOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <CanvasLayout>
            <div className="flex items-center gap-3 mb-6"><Link to="/plugins/job-tracker"><CanvasButton><ArrowLeft className="w-4 h-4" /></CanvasButton></Link><CanvasTitle>Outreach</CanvasTitle></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
                <CanvasWindow title="Sent" icon={<Mail className="w-4 h-4" />} zLevel="mid"><CanvasStat value={stats.total} label="total" /></CanvasWindow>
                <CanvasWindow title="Delivered" icon={<Mail className="w-4 h-4" />} zLevel="far"><CanvasStat value={stats.sent} label="success" /></CanvasWindow>
                <CanvasWindow title="Opened" icon={<Mail className="w-4 h-4" />} zLevel="mid"><CanvasStat value={stats.opened} label="views" /></CanvasWindow>
                <CanvasWindow title="Replied" icon={<Mail className="w-4 h-4" />} zLevel="close"><CanvasStat value={stats.replied} label="responses" /></CanvasWindow>
            </div>
            <CanvasWindow title="Search" icon={<Search className="w-4 h-4" />} zLevel="far" className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--canvas-text-muted)]" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emails..." className="canvas-input !pl-10" /></div>
                    <CanvasButton variant="primary" onClick={load}><RefreshCw className="w-4 h-4" /></CanvasButton>
                </div>
            </CanvasWindow>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--canvas-accent)]" /></div> :
                filtered.length === 0 ? <CanvasEmpty text="No emails sent yet" icon={<Mail className="w-10 h-10" />} /> :
                    <CanvasWindow title="Email Log" icon={<Mail className="w-4 h-4" />} zLevel="mid"><CanvasTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td className="font-medium">{e.recipientEmail}</td><td>{e.subject}</td><td><CanvasBadge color={e.status === 'replied' ? 'blue' : 'pink'}>{e.status}</CanvasBadge></td><td>{formatDate(e.createdAt)}</td></tr>))}</CanvasTable></CanvasWindow>}
        </CanvasLayout>
    );
}
