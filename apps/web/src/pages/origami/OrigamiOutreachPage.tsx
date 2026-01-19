import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Search, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiButton, OrigamiStat, OrigamiTable, OrigamiBadge, OrigamiInput, OrigamiEmpty } from '@/components/origami/OrigamiComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function OrigamiOutreachPage() {
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
        <OrigamiLayout>
            <OrigamiHeader
                title="Email Outreach"
                subtitle="Track your outreach"
                actions={<Link to="/plugins/job-tracker"><OrigamiButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</OrigamiButton></Link>}
            />

            <div className="origami-grid origami-grid-4 mb-8">
                <OrigamiCard folded><OrigamiStat value={stats.total} label="Total Sent" /></OrigamiCard>
                <OrigamiCard><OrigamiStat value={stats.sent} label="Delivered" /></OrigamiCard>
                <OrigamiCard><OrigamiStat value={stats.opened} label="Opened" /></OrigamiCard>
                <OrigamiCard><OrigamiStat value={stats.replied} label="Replied" /></OrigamiCard>
            </div>

            <OrigamiCard className="mb-6 !p-4">
                <div className="flex items-center justify-between">
                    <OrigamiInput value={search} onChange={setSearch} placeholder="Search emails..." icon={<Search className="w-4 h-4" />} className="w-80" />
                    <OrigamiButton onClick={loadEmails}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</OrigamiButton>
                </div>
            </OrigamiCard>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--origami-terracotta)] animate-spin" /></div>
            ) : filteredEmails.length === 0 ? (
                <OrigamiEmpty icon={<Mail className="w-8 h-8" />} text="No outreach emails yet" />
            ) : (
                <OrigamiCard className="!p-0 overflow-hidden">
                    <OrigamiTable headers={['Recipient', 'Subject', 'Status', 'Date']}>
                        {filteredEmails.map((email) => (
                            <tr key={email.id}>
                                <td className="font-medium">{email.recipientEmail}</td>
                                <td className="text-[var(--origami-text-dim)]">{email.subject}</td>
                                <td><OrigamiBadge variant={email.status === 'replied' ? 'sage' : email.status === 'opened' ? 'terracotta' : 'default'}>{email.status}</OrigamiBadge></td>
                                <td className="text-[var(--origami-text-dim)]">{formatDate(email.createdAt)}</td>
                            </tr>
                        ))}
                    </OrigamiTable>
                </OrigamiCard>
            )}
        </OrigamiLayout>
    );
}
