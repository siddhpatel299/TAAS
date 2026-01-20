import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistButton, BrutalistStat, BrutalistTable, BrutalistBadge, BrutalistEmpty, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function BrutalistOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadEmails = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadEmails(); }, [loadEmails]);

    const filteredEmails = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <BrutalistLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link to="/plugins/job-tracker"><BrutalistButton><ArrowLeft className="w-5 h-5" /></BrutalistButton></Link>
                <BrutalistTitle>Email Outreach</BrutalistTitle>
            </div>

            <div className="brutalist-grid brutalist-grid-4 mb-8">
                <BrutalistStat value={stats.total} label="Total Sent" inverted />
                <BrutalistStat value={stats.sent} label="Delivered" />
                <BrutalistStat value={stats.opened} label="Opened" />
                <BrutalistStat value={stats.replied} label="Replied" />
            </div>

            <BrutalistCard className="mb-4 flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emails..." className="brutalist-input !pl-12" />
                </div>
                <BrutalistButton variant="primary" onClick={loadEmails}><RefreshCw className="w-5 h-5" /> Refresh</BrutalistButton>
            </BrutalistCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin" /></div> :
                filteredEmails.length === 0 ? <BrutalistEmpty text="No emails sent yet" icon={<Mail />} /> :
                    <BrutalistCard className="!p-0">
                        <BrutalistTable headers={['Recipient', 'Subject', 'Status', 'Date']}>
                            {filteredEmails.map((e) => (<tr key={e.id}><td className="font-bold">{e.recipientEmail}</td><td>{e.subject}</td><td><BrutalistBadge variant={e.status === 'replied' ? 'inverted' : 'default'}>{e.status}</BrutalistBadge></td><td>{formatDate(e.createdAt)}</td></tr>))}
                        </BrutalistTable>
                    </BrutalistCard>}
        </BrutalistLayout>
    );
}
