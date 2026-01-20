import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveButton, ArchiveStat, ArchiveTable, ArchiveBadge, ArchiveEmpty, ArchiveTitle } from '@/components/archive/ArchiveComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function ArchiveOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const load = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <ArchiveLayout>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><ArchiveButton><ArrowLeft className="w-4 h-4" /></ArchiveButton></Link><ArchiveTitle>Outreach Log</ArchiveTitle></div>
                <ArchiveButton variant="primary" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</ArchiveButton>
            </div>

            <ArchiveSection title="Statistics" className="mb-12">
                <div className="archive-columns archive-columns-4"><ArchiveStat value={stats.total} label="Total Sent" /><ArchiveStat value={stats.sent} label="Delivered" /><ArchiveStat value={stats.opened} label="Opened" /><ArchiveStat value={stats.replied} label="Replied" /></div>
            </ArchiveSection>

            <ArchiveSection title="Search"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emails..." className="archive-input max-w-md" /></ArchiveSection>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--archive-accent)]" /></div> :
                filtered.length === 0 ? <ArchiveEmpty title="No outreach recorded" text="Sent emails will appear here." /> :
                    <ArchiveSection title="Email Log" count={filtered.length}><ArchiveTable headers={['Recipient', 'Subject', 'Status', 'Date']}>{filtered.map((e) => (<tr key={e.id}><td className="font-medium">{e.recipientEmail}</td><td>{e.subject}</td><td><ArchiveBadge variant={e.status === 'replied' ? 'accent' : 'default'}>{e.status}</ArchiveBadge></td><td className="text-[var(--archive-text-muted)]">{formatDate(e.createdAt)}</td></tr>))}</ArchiveTable></ArchiveSection>}
        </ArchiveLayout>
    );
}
