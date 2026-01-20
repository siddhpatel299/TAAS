import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoButton, DecoStat, DecoTable, DecoBadge, DecoEmpty, DecoTitle, DecoDivider } from '@/components/artdeco/ArtDecoComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function ArtDecoOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <ArtDecoLayout>
            <div className="flex items-center gap-4 mb-6"><Link to="/plugins/job-tracker"><DecoButton><ArrowLeft className="w-5 h-5" /></DecoButton></Link><DecoTitle>Outreach</DecoTitle></div>
            <div className="deco-grid deco-grid-4 mb-8"><DecoStat value={stats.total} label="Sent" /><DecoStat value={stats.sent} label="Delivered" /><DecoStat value={stats.opened} label="Opened" /><DecoStat value={stats.replied} label="Replied" /></div>
            <DecoDivider text="Email Log" />
            <DecoCard className="!p-4 mb-4 flex items-center justify-between">
                <div className="relative flex-1 max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--deco-gold-dark)]" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="deco-input !pl-12" /></div>
                <DecoButton variant="primary" onClick={load}><RefreshCw className="w-5 h-5" /></DecoButton>
            </DecoCard>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--deco-gold)]" /></div> :
                filtered.length === 0 ? <DecoEmpty text="No emails sent yet" /> :
                    <DecoCard><DecoTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td className="font-medium">{e.recipientEmail}</td><td>{e.subject}</td><td><DecoBadge color={e.status === 'replied' ? 'sage' : 'gold'}>{e.status}</DecoBadge></td><td>{formatDate(e.createdAt)}</td></tr>))}</DecoTable></DecoCard>}
        </ArtDecoLayout>
    );
}
