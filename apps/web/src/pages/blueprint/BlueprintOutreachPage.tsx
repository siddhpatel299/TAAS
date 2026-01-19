import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Search, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton, BlueprintStat, BlueprintTable, BlueprintBadge, BlueprintInput, BlueprintEmpty } from '@/components/blueprint/BlueprintComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate } from '@/lib/utils';

export function BlueprintOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadEmails = useCallback(async () => { setLoading(true); try { const r = await jobTrackerApi.getSentEmails(); setEmails(r.data?.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } }, []);
    useEffect(() => { loadEmails(); }, [loadEmails]);

    const filteredEmails = emails.filter(e => !search || e.recipientEmail?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()));
    const stats = { total: emails.length, sent: emails.filter(e => e.status === 'sent').length, opened: emails.filter(e => e.status === 'opened').length, replied: emails.filter(e => e.status === 'replied').length };

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Outreach" subtitle="Email tracking" actions={<Link to="/plugins/job-tracker"><BlueprintButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</BlueprintButton></Link>} />
            <div className="blueprint-grid blueprint-grid-4 mb-6">
                <BlueprintCard corners><BlueprintStat value={stats.total} label="Total" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={stats.sent} label="Delivered" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={stats.opened} label="Opened" /></BlueprintCard>
                <BlueprintCard><BlueprintStat value={stats.replied} label="Replied" /></BlueprintCard>
            </div>
            <BlueprintCard className="mb-4 !p-3">
                <div className="flex items-center justify-between">
                    <BlueprintInput value={search} onChange={setSearch} placeholder="Search..." icon={<Search className="w-4 h-4" />} className="w-72" />
                    <BlueprintButton onClick={loadEmails}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</BlueprintButton>
                </div>
            </BlueprintCard>
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div> :
                filteredEmails.length === 0 ? <BlueprintEmpty icon={<Mail className="w-8 h-8" />} text="No emails" /> :
                    <BlueprintCard className="!p-0 overflow-hidden">
                        <BlueprintTable headers={['Recipient', 'Subject', 'Status', 'Date']}>
                            {filteredEmails.map((e) => (<tr key={e.id}><td className="font-medium">{e.recipientEmail}</td><td className="text-[var(--blueprint-text-dim)]">{e.subject}</td><td><BlueprintBadge variant={e.status === 'replied' ? 'green' : e.status === 'opened' ? 'cyan' : 'default'}>{e.status}</BlueprintBadge></td><td className="text-[var(--blueprint-text-dim)]">{formatDate(e.createdAt)}</td></tr>))}
                        </BlueprintTable>
                    </BlueprintCard>}
        </BlueprintLayout>
    );
}
