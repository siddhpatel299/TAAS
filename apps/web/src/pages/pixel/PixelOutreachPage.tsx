import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelStat, PixelTable, PixelBadge, PixelEmpty, PixelTitle } from '@/components/pixel/PixelComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function PixelOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <PixelLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><PixelButton><ArrowLeft className="w-4 h-4" /></PixelButton></Link><PixelTitle subtitle="> MESSAGES SENT">✉ OUTREACH</PixelTitle></div>
                <PixelButton variant="primary" onClick={load}><RefreshCw className="w-4 h-4" /> REFRESH</PixelButton>
            </div>

            <div className="pixel-grid pixel-grid-4 mb-8">
                <PixelCard><PixelStat value={stats.total} label="Sent" /></PixelCard>
                <PixelCard><PixelStat value={stats.sent} label="Delivered" /></PixelCard>
                <PixelCard><PixelStat value={stats.opened} label="Opened" /></PixelCard>
                <PixelCard><PixelStat value={stats.replied} label="Replied" /></PixelCard>
            </div>

            <PixelCard className="mb-6"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="> SEARCH..." className="pixel-input max-w-md" /></PixelCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--pixel-cyan)]" /></div> :
                filtered.length === 0 ? <PixelEmpty text="NO MESSAGES" /> :
                    <PixelCard><PixelTable headers={['To', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td>{e.recipientEmail}</td><td>{e.subject}</td><td><PixelBadge color={e.status === 'replied' ? 'green' : 'blue'}>{e.status.toUpperCase()}</PixelBadge></td><td className="text-[var(--pixel-text-dim)]">{formatDate(e.createdAt)}</td></tr>))}</PixelTable></PixelCard>}
        </PixelLayout>
    );
}
