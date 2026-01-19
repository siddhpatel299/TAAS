import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Search, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton, MidnightStat, MidnightTable, MidnightBadge, MidnightInput, MidnightEmpty } from '@/components/midnight/MidnightComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function MidnightOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadEmails = useCallback(async () => {
        setLoading(true);
        try {
            const res = await jobTrackerApi.getSentEmails();
            setEmails(res.data?.data || []);
        } catch (error) {
            console.error('Failed to load emails:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadEmails(); }, [loadEmails]);

    const filteredEmails = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));

    const stats = {
        total: emails.length,
        sent: emails.filter(e => e.status === 'sent').length,
        opened: emails.filter(e => e.status === 'opened').length,
        replied: emails.filter(e => e.status === 'replied').length,
    };

    return (
        <MidnightLayout>
            <MidnightHeader
                title="Email Outreach"
                subtitle="Track your outreach emails"
                actions={<Link to="/plugins/job-tracker"><MidnightButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</MidnightButton></Link>}
            />

            {/* Stats */}
            <div className="midnight-grid midnight-grid-4 mb-8">
                <MidnightCard gold><MidnightStat value={stats.total} label="Total Sent" /></MidnightCard>
                <MidnightCard><MidnightStat value={stats.sent} label="Delivered" /></MidnightCard>
                <MidnightCard><MidnightStat value={stats.opened} label="Opened" /></MidnightCard>
                <MidnightCard><MidnightStat value={stats.replied} label="Replied" /></MidnightCard>
            </div>

            {/* Search */}
            <MidnightCard className="mb-6 !p-4">
                <div className="flex items-center justify-between">
                    <MidnightInput value={search} onChange={setSearch} placeholder="Search emails..." icon={<Search className="w-4 h-4" />} className="w-80" />
                    <MidnightButton onClick={loadEmails}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</MidnightButton>
                </div>
            </MidnightCard>

            {/* Emails */}
            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div>
            ) : filteredEmails.length === 0 ? (
                <MidnightEmpty icon={<Mail className="w-8 h-8" />} text="No outreach emails yet" />
            ) : (
                <MidnightCard className="!p-0 overflow-hidden">
                    <MidnightTable headers={['Recipient', 'Subject', 'Status', 'Date']}>
                        {filteredEmails.map((email) => (
                            <tr key={email.id}>
                                <td className="font-medium">{email.recipientEmail}</td>
                                <td className="text-[var(--midnight-text-dim)]">{email.subject}</td>
                                <td><MidnightBadge variant={email.status === 'replied' ? 'success' : email.status === 'opened' ? 'gold' : 'default'}>{email.status}</MidnightBadge></td>
                                <td className="text-[var(--midnight-text-dim)]">{formatDate(email.createdAt)}</td>
                            </tr>
                        ))}
                    </MidnightTable>
                </MidnightCard>
            )}
        </MidnightLayout>
    );
}
