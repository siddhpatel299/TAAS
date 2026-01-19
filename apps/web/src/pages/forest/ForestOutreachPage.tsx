import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Search, RefreshCw, Calendar, CheckCircle, Clock, Loader2, Send } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestStatCard, ForestPageHeader, ForestButton, ForestBadge, ForestEmpty } from '@/components/forest/ForestComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { formatDate, cn } from '@/lib/utils';

interface SentEmail {
    id: string;
    recipientName: string;
    recipientEmail: string;
    company: string;
    status: string;
    sentAt: string;
}

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
    sent: 'default',
    replied: 'success',
    'meeting scheduled': 'success',
    'no response': 'warning',
    'not interested': 'danger',
};

export function ForestOutreachPage() {
    const [emails, setEmails] = useState<SentEmail[]>([]);
    const [stats, setStats] = useState({ total: 0, replied: 0, meetings: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [emailsRes, statsRes] = await Promise.all([
                jobTrackerApi.getSentEmails(),
                jobTrackerApi.getOutreachStats(),
            ]);
            setEmails(emailsRes.data?.data || []);
            const statsData = statsRes.data?.data;
            setStats({
                total: statsData?.totalSent || 0,
                replied: statsData?.totalReplied || 0,
                meetings: statsData?.totalMeetings || 0,
                pending: statsData?.totalNoResponse || 0,
            });
        } catch (error) {
            console.error('Failed to load outreach data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filtered = emails.filter(email => {
        const matchesSearch = !searchQuery ||
            email.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statuses = ['all', 'sent', 'replied', 'meeting scheduled', 'no response', 'not interested'];

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Outreach"
                subtitle="Track your email campaigns"
                icon={<Mail className="w-6 h-6" />}
                actions={
                    <ForestButton onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </ForestButton>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <ForestStatCard label="Total Sent" value={stats.total} icon={<Send className="w-5 h-5" />} />
                <ForestStatCard label="Replied" value={stats.replied} icon={<CheckCircle className="w-5 h-5" />} />
                <ForestStatCard label="Meetings" value={stats.meetings} icon={<Calendar className="w-5 h-5" />} />
                <ForestStatCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5" />} />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--forest-wood)]" />
                    <input
                        type="text"
                        placeholder="Search emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="forest-input pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {statuses.map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize",
                                statusFilter === status
                                    ? "bg-[var(--forest-gradient-primary)] text-white"
                                    : "bg-[rgba(74,124,89,0.1)] text-[var(--forest-moss)]"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Emails List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <ForestCard>
                    <ForestEmpty
                        icon={<Mail className="w-full h-full" />}
                        title="No emails found"
                        description="Sent emails will appear here"
                    />
                </ForestCard>
            ) : (
                <div className="space-y-3">
                    {filtered.map((email, index) => (
                        <motion.div
                            key={email.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <ForestCard className="!p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[rgba(74,124,89,0.1)] flex items-center justify-center text-[var(--forest-leaf)] font-semibold">
                                        {email.recipientName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[var(--forest-moss)]">{email.recipientName}</p>
                                        <p className="text-sm text-[var(--forest-wood)]">{email.company} • {email.recipientEmail}</p>
                                    </div>
                                    <div className="text-right">
                                        <ForestBadge variant={statusColors[email.status] || 'default'}>
                                            {email.status}
                                        </ForestBadge>
                                        <p className="text-xs text-[var(--forest-wood)] mt-1">{formatDate(email.sentAt)}</p>
                                    </div>
                                </div>
                            </ForestCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </ForestLayout>
    );
}
