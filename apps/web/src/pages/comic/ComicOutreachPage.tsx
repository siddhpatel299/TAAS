import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicButton, ComicStat, ComicTable, ComicBadge, ComicEmpty, ComicTitle } from '@/components/comic/ComicComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function ComicOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <ComicLayout>
            <div className="flex items-center gap-3 mb-6"><Link to="/plugins/job-tracker"><ComicButton><ArrowLeft className="w-5 h-5" /></ComicButton></Link><ComicTitle>Outreach!</ComicTitle></div>
            <div className="comic-grid comic-grid-4 mb-8"><ComicStat value={stats.total} label="Sent" /><ComicStat value={stats.sent} label="Delivered" /><ComicStat value={stats.opened} label="Opened" /><ComicStat value={stats.replied} label="Replied" /></div>
            <ComicPanel title="Search!">
                <div className="flex items-center justify-between"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emails..." className="comic-input flex-1 mr-4" /><ComicButton variant="primary" onClick={load}><RefreshCw className="w-5 h-5" /> REFRESH!</ComicButton></div>
            </ComicPanel>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--comic-blue)]" /></div> :
                filtered.length === 0 ? <ComicEmpty text="No emails sent yet!" /> :
                    <ComicPanel title="Email Log!"><ComicTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td className="font-bold">{e.recipientEmail}</td><td>{e.subject}</td><td><ComicBadge color={e.status === 'replied' ? 'green' : 'yellow'}>{e.status.toUpperCase()}!</ComicBadge></td><td>{formatDate(e.createdAt)}</td></tr>))}</ComicTable></ComicPanel>}
        </ComicLayout>
    );
}
