import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamButton, SteamGauge, SteamTable, SteamBadge, SteamEmpty, SteamTitle, SteamDivider } from '@/components/steam/SteamComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function SteamOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <SteamLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><SteamButton><ArrowLeft className="w-4 h-4" /></SteamButton></Link><SteamTitle>Correspondence Log</SteamTitle></div>
                <SteamButton variant="primary" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</SteamButton>
            </div>

            <div className="flex justify-center gap-8 mb-8">
                <SteamGauge value={stats.total} label="Sent" />
                <SteamGauge value={stats.sent} label="Delivered" />
                <SteamGauge value={stats.opened} label="Opened" />
                <SteamGauge value={stats.replied} label="Replied" />
            </div>

            <SteamDivider />

            <SteamPanel title="Search" className="mb-6"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transmissions..." className="steam-input max-w-md" /></SteamPanel>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--steam-brass)]" /></div> :
                filtered.length === 0 ? <SteamEmpty text="No correspondence recorded" /> :
                    <SteamPanel title="Transmission Log"><SteamTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td>{e.recipientEmail}</td><td>{e.subject}</td><td><SteamBadge color={e.status === 'replied' ? 'brass' : 'copper'}>{e.status}</SteamBadge></td><td className="text-[var(--steam-text-muted)]">{formatDate(e.createdAt)}</td></tr>))}</SteamTable></SteamPanel>}
        </SteamLayout>
    );
}
