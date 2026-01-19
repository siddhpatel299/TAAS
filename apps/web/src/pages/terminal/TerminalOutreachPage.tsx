import { useState, useEffect, useCallback } from 'react';
import { Mail, Search, RefreshCw, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalStat, TerminalButton, TerminalBadge, TerminalTable, TerminalEmpty } from '@/components/terminal/TerminalComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate, cn } from '@/lib/utils';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
    sent: 'default', replied: 'success', 'meeting scheduled': 'success', 'no response': 'warning', 'not interested': 'danger',
};

export function TerminalOutreachPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, replied: 0, meetings: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [emailsRes, statsRes] = await Promise.all([jobTrackerApi.getSentEmails(), jobTrackerApi.getOutreachStats()]);
            setEmails(emailsRes.data?.data || []);
            const s = statsRes.data?.data;
            setStats({ total: s?.totalSent || 0, replied: s?.totalReplied || 0, meetings: s?.totalMeetings || 0, pending: s?.totalNoResponse || 0 });
        } catch (error) {
            console.error('Failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const filtered = emails.filter(e => !search || e.recipientName?.toLowerCase().includes(search.toLowerCase()) || e.company?.toLowerCase().includes(search.toLowerCase()));

    return (
        <TerminalLayout>
            <TerminalHeader title="Outreach" subtitle="Email tracking" actions={<TerminalButton onClick={loadData} disabled={isLoading}><RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} /> Refresh</TerminalButton>} />

            {/* Stats */}
            <TerminalPanel title="Statistics" className="mb-4">
                <div className="terminal-grid-4">
                    <TerminalStat label="Sent" value={stats.total} />
                    <TerminalStat label="Replied" value={stats.replied} />
                    <TerminalStat label="Meetings" value={stats.meetings} />
                    <TerminalStat label="Pending" value={stats.pending} />
                </div>
            </TerminalPanel>

            {/* Search */}
            <TerminalPanel className="mb-4 !p-2">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--terminal-text-dim)]" />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="terminal-input pl-7 !py-1" />
                </div>
            </TerminalPanel>

            {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <TerminalEmpty icon={<Mail className="w-full h-full" />} text="No emails" />
            ) : (
                <TerminalPanel>
                    <TerminalTable headers={['Recipient', 'Company', 'Status', 'Date']}>
                        {filtered.map((email) => (
                            <tr key={email.id}>
                                <td className="font-bold">{email.recipientName}</td>
                                <td>{email.company}</td>
                                <td><TerminalBadge variant={statusColors[email.status]}>{email.status?.toUpperCase()}</TerminalBadge></td>
                                <td className="text-[var(--terminal-text-dim)]">{formatDate(email.sentAt)}</td>
                            </tr>
                        ))}
                    </TerminalTable>
                </TerminalPanel>
            )}
        </TerminalLayout>
    );
}
