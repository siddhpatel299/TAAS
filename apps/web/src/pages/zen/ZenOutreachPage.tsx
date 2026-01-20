import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenStat, ZenTable, ZenBadge, ZenEmpty, ZenTitle, ZenSection, ZenDivider } from '@/components/zen/ZenComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function ZenOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <ZenLayout>
            <div className="flex items-center justify-between" style={{ marginBottom: '64px' }}>
                <div className="flex items-center gap-6"><Link to="/plugins/job-tracker"><ZenButton><ArrowLeft className="w-3 h-3" /></ZenButton></Link><ZenTitle subtitle="Email tracking">Outreach</ZenTitle></div>
                <ZenButton variant="primary" onClick={load}><RefreshCw className="w-3 h-3" /></ZenButton>
            </div>

            <ZenSection>
                <div className="zen-grid zen-grid-4">
                    <ZenStat value={stats.total} label="Sent" />
                    <ZenStat value={stats.sent} label="Delivered" />
                    <ZenStat value={stats.opened} label="Opened" />
                    <ZenStat value={stats.replied} label="Replied" />
                </div>
            </ZenSection>

            <ZenDivider />

            <ZenSection>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="zen-input" style={{ maxWidth: '300px', marginBottom: '40px' }} />
            </ZenSection>

            {loading ? <div className="flex items-center justify-center" style={{ minHeight: '30vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div> :
                filtered.length === 0 ? <ZenEmpty text="No outreach" /> :
                    <ZenSection><ZenCard><ZenTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td>{e.recipientEmail}</td><td>{e.subject}</td><td><ZenBadge color={e.status === 'replied' ? 'sage' : 'default'}>{e.status}</ZenBadge></td><td className="text-[var(--zen-text-light)]">{formatDate(e.createdAt)}</td></tr>))}</ZenTable></ZenCard></ZenSection>}
        </ZenLayout>
    );
}
