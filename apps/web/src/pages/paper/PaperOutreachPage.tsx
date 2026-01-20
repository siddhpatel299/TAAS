import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperSticky, PaperButton, PaperStat, PaperTable, PaperBadge, PaperEmpty, PaperTitle } from '@/components/paper/PaperComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function PaperOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <PaperLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><PaperButton><ArrowLeft className="w-4 h-4" /></PaperButton></Link><PaperTitle subtitle="emails you've sent">✉️ Outreach</PaperTitle></div>
                <PaperButton variant="primary" onClick={load}><RefreshCw className="w-4 h-4" /> refresh</PaperButton>
            </div>

            <div className="paper-grid paper-grid-4 mb-8">
                <PaperSticky color="yellow"><PaperStat value={stats.total} label="Sent" /></PaperSticky>
                <PaperSticky color="blue"><PaperStat value={stats.sent} label="Delivered" /></PaperSticky>
                <PaperSticky color="green"><PaperStat value={stats.opened} label="Opened" /></PaperSticky>
                <PaperSticky color="pink"><PaperStat value={stats.replied} label="Replied" /></PaperSticky>
            </div>

            <PaperCard className="mb-6"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search emails..." className="paper-input max-w-md" /></PaperCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--ink-blue)]" /></div> :
                filtered.length === 0 ? <PaperEmpty text="no outreach yet..." /> :
                    <PaperCard><PaperTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td>{e.recipientEmail}</td><td>{e.subject}</td><td><PaperBadge color={e.status === 'replied' ? 'green' : 'blue'}>{e.status}</PaperBadge></td><td className="text-[var(--ink-blue)]">{formatDate(e.createdAt)}</td></tr>))}</PaperTable></PaperCard>}
        </PaperLayout>
    );
}
