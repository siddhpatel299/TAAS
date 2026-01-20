import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTButton, CRTStat, CRTTable, CRTBadge, CRTEmpty, CRTTitle } from '@/components/crt/CRTComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function CRTOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadEmails = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadEmails(); }, [loadEmails]);

    const filteredEmails = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <CRTLayout>
            <div className="flex items-center gap-4 mb-4">
                <Link to="/plugins/job-tracker"><CRTButton><ArrowLeft className="w-4 h-4" /></CRTButton></Link>
                <CRTTitle>Outreach Log</CRTTitle>
            </div>

            <div className="crt-panels crt-panels-2">
                <CRTPanel header="Stats">
                    <div className="grid grid-cols-2 gap-3">
                        <CRTStat value={stats.total} label="Sent" />
                        <CRTStat value={stats.sent} label="Delivered" />
                        <CRTStat value={stats.opened} label="Opened" />
                        <CRTStat value={stats.replied} label="Replied" />
                    </div>
                </CRTPanel>

                <CRTPanel header="Email Log">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--crt-green-dim)]" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH..." className="crt-input !pl-10" />
                        </div>
                        <CRTButton variant="primary" onClick={loadEmails}><RefreshCw className="w-4 h-4" /></CRTButton>
                    </div>
                    {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--crt-green)]" /></div> :
                        filteredEmails.length === 0 ? <CRTEmpty text="NO EMAILS SENT" /> :
                            <CRTTable headers={['Recipient', 'Subject', 'Status', 'Date']}>
                                {filteredEmails.map((e) => (<tr key={e.id}><td>{e.recipientEmail}</td><td>{e.subject}</td><td><CRTBadge color={e.status === 'replied' ? 'green' : 'amber'}>{e.status}</CRTBadge></td><td>{formatDate(e.createdAt)}</td></tr>))}
                            </CRTTable>}
                </CRTPanel>
            </div>
        </CRTLayout>
    );
}
