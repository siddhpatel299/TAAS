import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    Send,
    Calendar,
    Clock,
    XCircle,
    MessageSquare,
    Search,
    Trash2,
    Download,
    Building2,
    AlertCircle,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton, HUDBadge } from '@/components/hud/HUDComponents';
import { jobTrackerApi, SentEmail, OutreachStats, FollowUpStats } from '@/lib/plugins-api';
import { EmailRepliesSection } from '@/components/job-tracker/EmailRepliesSection';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    sent: { label: 'Sent', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
    replied: { label: 'Replied', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/50' },
    meeting_scheduled: { label: 'Meeting', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    no_response: { label: 'No Response', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50' },
    not_interested: { label: 'Not Interested', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/50' },
};

export function HUDOutreachPage() {
    const [emails, setEmails] = useState<SentEmail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [stats, setStats] = useState<OutreachStats | null>(null);
    const [followUpStats, setFollowUpStats] = useState<FollowUpStats | null>(null);
    const [updatingEmailId, setUpdatingEmailId] = useState<string | null>(null);

    const loadEmails = async () => {
        setIsLoading(true);
        try {
            const response = await jobTrackerApi.getSentEmails({
                status: statusFilter || undefined,
                search: searchQuery || undefined,
            });
            setEmails(response.data.data || []);
        } catch (error) {
            console.error('Failed to load emails:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const [statsRes, followUpRes] = await Promise.all([
                jobTrackerApi.getOutreachStats(),
                jobTrackerApi.getFollowUpStats(),
            ]);
            setStats(statsRes.data.data);
            setFollowUpStats(followUpRes.data.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    useEffect(() => {
        loadEmails();
        loadStats();
    }, [statusFilter, searchQuery]);

    const handleStatusUpdate = async (emailId: string, status: string) => {
        setUpdatingEmailId(emailId);
        try {
            let response;
            switch (status) {
                case 'replied':
                    response = await jobTrackerApi.markEmailAsReplied(emailId);
                    break;
                case 'meeting_scheduled':
                    response = await jobTrackerApi.markEmailAsMeetingScheduled(emailId);
                    break;
                case 'no_response':
                    response = await jobTrackerApi.markEmailAsNoResponse(emailId);
                    break;
                default:
                    response = await jobTrackerApi.updateSentEmail(emailId, { status });
            }
            setEmails(prev => prev.map(e => e.id === emailId ? response.data.data : e));
            loadStats();
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setUpdatingEmailId(null);
        }
    };

    const handleDelete = async (emailId: string) => {
        if (!confirm('Delete this email record?')) return;
        setUpdatingEmailId(emailId);
        try {
            await jobTrackerApi.deleteSentEmail(emailId);
            setEmails(prev => prev.filter(e => e.id !== emailId));
            loadStats();
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setUpdatingEmailId(null);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await jobTrackerApi.exportSentEmailsCSV({
                status: statusFilter || undefined,
            });
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sent-emails.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export CSV:', error);
        }
    };

    const isOverdue = (email: SentEmail) => {
        if (!email.followUpDate || email.status !== 'sent') return false;
        return new Date(email.followUpDate) < new Date();
    };

    return (
        <HUDLayout>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Send className="w-10 h-10 text-emerald-400" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' }} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                                OUTREACH TRACKER
                            </h1>
                            <p className="text-cyan-600/70 mt-1 font-mono">
                                Track and manage email campaigns
                            </p>
                        </div>
                    </div>

                    <HUDButton onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </HUDButton>
                </div>

                <motion.div
                    className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1 }}
                />
            </motion.div>

            {/* Email Replies - dedicated section */}
            <EmailRepliesSection variant="hud" limit={5} className="mb-6" />
            {/* Stats */}
            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <div className="grid grid-cols-4 gap-4">
                        <HUDPanel className="p-4 text-center">
                            <p className="text-2xl font-bold text-cyan-400 font-mono">{stats.totalSent}</p>
                            <p className="text-xs text-cyan-600 uppercase tracking-wider">Total Sent</p>
                        </HUDPanel>
                        <HUDPanel className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-400 font-mono">{stats.responseRate}%</p>
                            <p className="text-xs text-cyan-600 uppercase tracking-wider">Response Rate</p>
                        </HUDPanel>
                        <HUDPanel className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-400 font-mono">{stats.totalMeetings}</p>
                            <p className="text-xs text-cyan-600 uppercase tracking-wider">Meetings</p>
                        </HUDPanel>
                        <HUDPanel className="p-4 text-center">
                            <p className="text-2xl font-bold text-amber-400 font-mono">
                                {(followUpStats?.dueToday || 0) + (followUpStats?.overdue || 0)}
                            </p>
                            <p className="text-xs text-cyan-600 uppercase tracking-wider">Follow-ups Due</p>
                        </HUDPanel>
                    </div>
                </motion.div>
            )}

            {/* Follow-up Alert */}
            {followUpStats && (followUpStats.overdue > 0 || followUpStats.dueToday > 0) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <HUDPanel className="p-4 border-amber-500/50">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-400">
                                <strong>{followUpStats.overdue}</strong> overdue and <strong>{followUpStats.dueToday}</strong> follow-ups due today
                            </span>
                        </div>
                    </HUDPanel>
                </motion.div>
            )}

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <HUDPanel className="p-4 mb-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="hud-input pl-10 pr-4 py-2 w-full"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="hud-input px-3 py-2"
                            >
                                <option value="">All Status</option>
                                <option value="sent">Sent</option>
                                <option value="replied">Replied</option>
                                <option value="no_response">No Response</option>
                                <option value="meeting_scheduled">Meeting Scheduled</option>
                            </select>

                            <button
                                onClick={() => { loadEmails(); loadStats(); }}
                                className="p-2 text-cyan-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            >
                                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                            </button>
                        </div>
                    </div>
                </HUDPanel>
            </motion.div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <motion.div
                        className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            ) : emails.length === 0 ? (
                <HUDPanel className="p-8 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-cyan-600" />
                    <p className="text-cyan-400 mb-2">No emails found</p>
                    <p className="text-sm text-cyan-600">Send emails from Job Applications to track them here</p>
                </HUDPanel>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                >
                    <AnimatePresence>
                        {emails.map((email, index) => {
                            const config = statusConfig[email.status] || statusConfig.sent;
                            const overdue = isOverdue(email);

                            return (
                                <motion.div
                                    key={email.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <HUDPanel className={cn(
                                        "p-4 transition-all",
                                        overdue && "border-red-500/50"
                                    )}>
                                        <div className="flex items-start gap-4">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0">
                                                <span className="text-cyan-400 font-bold text-sm">
                                                    {email.recipientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-cyan-200 truncate">{email.recipientName}</h3>
                                                    <HUDBadge className={cn(config.bg, config.border, config.color)}>
                                                        {config.label}
                                                    </HUDBadge>
                                                    {overdue && (
                                                        <HUDBadge className="bg-red-500/20 border-red-500/50 text-red-400">
                                                            Overdue
                                                        </HUDBadge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-cyan-500 truncate">{email.recipientEmail}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-cyan-600">
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" />
                                                        {email.company}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(email.sentAt), 'MMM d, yyyy')}
                                                    </span>
                                                    {email.followUpDate && (
                                                        <span className={cn("flex items-center gap-1", overdue && "text-red-400")}>
                                                            <Clock className="w-3 h-3" />
                                                            Follow-up: {formatDistanceToNow(new Date(email.followUpDate), { addSuffix: true })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1">
                                                {updatingEmailId === email.id ? (
                                                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(email.id, 'replied')}
                                                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                                                            title="Mark as replied"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(email.id, 'no_response')}
                                                            className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
                                                            title="Mark as no response"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(email.id)}
                                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </HUDPanel>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </HUDLayout>
    );
}
