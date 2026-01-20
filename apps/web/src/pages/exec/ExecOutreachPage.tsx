import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecStat, ExecTable, ExecBadge, ExecEmpty, ExecTitle } from '@/components/exec/ExecComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function ExecOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <ExecLayout>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><ExecButton><ArrowLeft className="w-4 h-4" /></ExecButton></Link><ExecTitle subtitle="Track your professional correspondence">Correspondence</ExecTitle></div>
                <ExecButton variant="primary" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</ExecButton>
            </div>

            <div className="exec-grid exec-grid-4 mb-10">
                <ExecCard><ExecStat value={stats.total} label="Total Sent" /></ExecCard>
                <ExecCard><ExecStat value={stats.sent} label="Delivered" /></ExecCard>
                <ExecCard><ExecStat value={stats.opened} label="Opened" /></ExecCard>
                <ExecCard><ExecStat value={stats.replied} label="Replied" /></ExecCard>
            </div>

            <ExecCard className="mb-8"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search correspondence..." className="exec-input max-w-md" /></ExecCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--exec-gold)]" /></div> :
                filtered.length === 0 ? <ExecEmpty text="No correspondence recorded" /> :
                    <ExecCard><ExecTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td>{e.recipientEmail}</td><td>{e.subject}</td><td><ExecBadge color={e.status === 'replied' ? 'green' : 'gold'}>{e.status}</ExecBadge></td><td className="text-[var(--exec-text-muted)]">{formatDate(e.createdAt)}</td></tr>))}</ExecTable></ExecCard>}
        </ExecLayout>
    );
}
