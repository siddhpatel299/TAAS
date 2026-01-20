import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassButton, GlassStat, GlassTable, GlassBadge, GlassEmpty, GlassTitle } from '@/components/glass/GlassComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function GlassOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadEmails = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadEmails(); }, [loadEmails]);

    const filteredEmails = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <GlassLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link to="/plugins/job-tracker"><GlassButton><ArrowLeft className="w-5 h-5" /></GlassButton></Link>
                <GlassTitle>Email Outreach</GlassTitle>
            </div>

            <div className="glass-grid glass-grid-4 mb-8">
                <GlassStat value={stats.total} label="Total Sent" />
                <GlassStat value={stats.sent} label="Delivered" />
                <GlassStat value={stats.opened} label="Opened" />
                <GlassStat value={stats.replied} label="Replied" />
            </div>

            <GlassCard flat className="mb-4 flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--glass-text-muted)]" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emails..." className="glass-input !pl-12" />
                </div>
                <GlassButton variant="primary" onClick={loadEmails}><RefreshCw className="w-5 h-5" /> Refresh</GlassButton>
            </GlassCard>

            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[var(--glass-accent)]" /></div> :
                filteredEmails.length === 0 ? <GlassEmpty text="No emails sent yet" icon={<Mail className="w-12 h-12" />} /> :
                    <GlassCard flat>
                        <GlassTable headers={['Recipient', 'Subject', 'Status', 'Date']}>
                            {filteredEmails.map((e) => (<tr key={e.id}><td className="font-medium">{e.recipientEmail}</td><td>{e.subject}</td><td><GlassBadge color={e.status === 'replied' ? 'cyan' : 'pink'}>{e.status}</GlassBadge></td><td>{formatDate(e.createdAt)}</td></tr>))}
                        </GlassTable>
                    </GlassCard>}
        </GlassLayout>
    );
}
