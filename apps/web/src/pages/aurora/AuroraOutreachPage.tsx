import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraStat, AuroraTable, AuroraBadge, AuroraEmpty, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function AuroraOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <AuroraLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><AuroraButton><ArrowLeft className="w-4 h-4" /></AuroraButton></Link><AuroraTitle subtitle="Email tracking">Outreach</AuroraTitle></div>
                <AuroraButton variant="primary" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</AuroraButton>
            </div>

            <div className="aurora-grid aurora-grid-4 mb-8">
                <AuroraStat value={stats.total} label="Sent" />
                <AuroraStat value={stats.sent} label="Delivered" />
                <AuroraStat value={stats.opened} label="Opened" />
                <AuroraStat value={stats.replied} label="Replied" />
            </div>

            <AuroraCard className="mb-6"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="aurora-input max-w-md" /></AuroraCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--aurora-gradient-1)]" /></div> :
                filtered.length === 0 ? <AuroraEmpty text="No outreach" /> :
                    <AuroraCard><AuroraTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td className="font-medium">{e.recipientEmail}</td><td>{e.subject}</td><td><AuroraBadge color={e.status === 'replied' ? 'teal' : 'default'}>{e.status}</AuroraBadge></td><td className="text-[var(--aurora-text-muted)]">{formatDate(e.createdAt)}</td></tr>))}</AuroraTable></AuroraCard>}
        </AuroraLayout>
    );
}
