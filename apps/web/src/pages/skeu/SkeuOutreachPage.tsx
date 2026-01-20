import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuButton, SkeuGauge, SkeuTable, SkeuBadge, SkeuEmpty, SkeuTitle } from '@/components/skeu/SkeuComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function SkeuOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <SkeuLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><SkeuButton><ArrowLeft className="w-4 h-4" /></SkeuButton></Link><SkeuTitle subtitle="Email tracking system">Outreach Monitor</SkeuTitle></div>
                <SkeuButton variant="primary" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</SkeuButton>
            </div>

            <div className="skeu-grid skeu-grid-4 mb-8">
                <SkeuCard className="flex items-center justify-center py-6"><SkeuGauge value={stats.total} label="Sent" color="blue" /></SkeuCard>
                <SkeuCard className="flex items-center justify-center py-6"><SkeuGauge value={stats.sent} label="Delivered" color="green" /></SkeuCard>
                <SkeuCard className="flex items-center justify-center py-6"><SkeuGauge value={stats.opened} label="Opened" color="purple" /></SkeuCard>
                <SkeuCard className="flex items-center justify-center py-6"><SkeuGauge value={stats.replied} label="Replied" color="orange" /></SkeuCard>
            </div>

            <SkeuCard className="mb-6"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search outreach..." className="skeu-input max-w-md" /></SkeuCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--skeu-led-blue)]" /></div> :
                filtered.length === 0 ? <SkeuEmpty text="No outreach recorded" /> :
                    <SkeuCard><SkeuTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td className="font-medium">{e.recipientEmail}</td><td>{e.subject}</td><td><SkeuBadge color={e.status === 'replied' ? 'green' : 'blue'}>{e.status}</SkeuBadge></td><td className="text-[var(--skeu-text-muted)]">{formatDate(e.createdAt)}</td></tr>))}</SkeuTable></SkeuCard>}
        </SkeuLayout>
    );
}
