import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintButton, NewsprintStat, NewsprintTable, NewsprintBadge, NewsprintInput, NewsprintEmpty } from '@/components/newsprint/NewsprintComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function NewsprintOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadEmails = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadEmails(); }, [loadEmails]);

    const filteredEmails = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <NewsprintLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link to="/plugins/job-tracker"><NewsprintButton><ArrowLeft className="w-4 h-4" /></NewsprintButton></Link>
                <h1 className="text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Email Outreach</h1>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <NewsprintStat value={stats.total} label="Total Sent" />
                <NewsprintStat value={stats.sent} label="Delivered" />
                <NewsprintStat value={stats.opened} label="Opened" />
                <NewsprintStat value={stats.replied} label="Replied" />
            </div>

            <NewsprintCard className="mb-4 !p-4">
                <div className="flex items-center justify-between">
                    <NewsprintInput value={search} onChange={setSearch} placeholder="Search emails..." icon={<Search className="w-4 h-4" />} className="flex-1 max-w-md" />
                    <NewsprintButton onClick={loadEmails}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</NewsprintButton>
                </div>
            </NewsprintCard>

            <NewsprintSection title={`${filteredEmails.length} Emails`}>
                {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div> :
                    filteredEmails.length === 0 ? <NewsprintEmpty text="No emails sent yet" /> :
                        <NewsprintCard className="!p-0">
                            <NewsprintTable headers={['Recipient', 'Subject', 'Status', 'Date']}>
                                {filteredEmails.map((e) => (<tr key={e.id}><td>{e.recipientEmail}</td><td className="text-[var(--newsprint-ink-muted)]">{e.subject}</td><td><NewsprintBadge variant={e.status === 'replied' ? 'blue' : 'default'}>{e.status}</NewsprintBadge></td><td className="text-[var(--newsprint-ink-muted)]">{formatDate(e.createdAt)}</td></tr>))}
                            </NewsprintTable>
                        </NewsprintCard>}
            </NewsprintSection>
        </NewsprintLayout>
    );
}
