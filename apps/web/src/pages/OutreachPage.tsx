import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  Calendar,
  Clock,
  XCircle,
  MessageSquare,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  CalendarPlus,
  Download,
  Building2,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { useOSStore } from '@/stores/os.store';
import { HUDAppLayout, HUDCard, HUDDataTable, HUDStatBlock } from '@/components/hud';
import { cn } from '@/lib/utils';
import { jobTrackerApi, SentEmail, OutreachStats, FollowUpStats } from '@/lib/plugins-api';
import { EmailPreviewModal } from '@/components/EmailPreviewModal';
import { EmailRepliesSection } from '@/components/job-tracker/EmailRepliesSection';

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  sent: { label: 'Sent', color: 'text-blue-600', icon: <Send className="w-4 h-4" />, bgColor: 'bg-blue-50' },
  replied: { label: 'Replied', color: 'text-green-600', icon: <MessageSquare className="w-4 h-4" />, bgColor: 'bg-green-50' },
  meeting_scheduled: { label: 'Meeting Scheduled', color: 'text-purple-600', icon: <Calendar className="w-4 h-4" />, bgColor: 'bg-purple-50' },
  not_interested: { label: 'Not Interested', color: 'text-gray-600', icon: <XCircle className="w-4 h-4" />, bgColor: 'bg-gray-50' },
  no_response: { label: 'No Response', color: 'text-amber-600', icon: <Clock className="w-4 h-4" />, bgColor: 'bg-amber-50' },
};

export function OutreachPage() {
  // Data state
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [followUpStats, setFollowUpStats] = useState<FollowUpStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFollowUpsDue, setShowFollowUpsDue] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Modal state
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Loading states for actions
  const [updatingEmailId, setUpdatingEmailId] = useState<string | null>(null);

  // Load data on mount and filter changes
  useEffect(() => {
    loadEmails();
    loadStats();
  }, [page, statusFilter, showFollowUpsDue, searchQuery]);

  const loadEmails = async () => {
    try {
      setIsLoading(true);
      const response = await jobTrackerApi.getSentEmails({
        status: statusFilter || undefined,
        followUpDue: showFollowUpsDue,
        search: searchQuery || undefined,
        page,
        limit: 20,
        sortBy: 'sentAt',
        sortOrder: 'desc',
      });
      setEmails(response.data.data);
      setTotal(response.data.meta.total);
      setHasMore(response.data.meta.hasMore);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load emails');
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
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleStatusUpdate = async (emailId: string, status: string) => {
    setUpdatingEmailId(emailId);
    setActionMenuId(null);
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
      
      // Update local state
      setEmails(prev => prev.map(e => e.id === emailId ? response.data.data : e));
      loadStats(); // Refresh stats
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingEmailId(null);
    }
  };

  const handleScheduleFollowUp = async (emailId: string) => {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7);
    
    setUpdatingEmailId(emailId);
    setActionMenuId(null);
    try {
      const response = await jobTrackerApi.scheduleFollowUp(emailId, followUpDate.toISOString());
      setEmails(prev => prev.map(e => e.id === emailId ? response.data.data : e));
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule follow-up');
    } finally {
      setUpdatingEmailId(null);
    }
  };

  const handleDelete = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email record?')) return;
    
    setUpdatingEmailId(emailId);
    setActionMenuId(null);
    try {
      await jobTrackerApi.deleteSentEmail(emailId);
      setEmails(prev => prev.filter(e => e.id !== emailId));
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete email');
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
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isFollowUpOverdue = (email: SentEmail) => {
    if (!email.followUpDate || email.followedUp || email.status !== 'sent') return false;
    return new Date(email.followUpDate) < new Date();
  };

  const isFollowUpDueToday = (email: SentEmail) => {
    if (!email.followUpDate || email.followedUp || email.status !== 'sent') return false;
    const today = new Date();
    const followUp = new Date(email.followUpDate);
    return followUp.toDateString() === today.toDateString();
  };

  const osStyle = useOSStore((s) => s.osStyle);
  const isHUD = osStyle === 'hud';

  if (isHUD) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <HUDAppLayout
          title="OUTREACH"
          searchPlaceholder="Search emails..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        >
          <div className="space-y-6">
            <EmailRepliesSection variant="hud" limit={5} className="mb-4" />
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <HUDCard accent>
                  <div className="p-4">
                    <HUDStatBlock label="SENT" value={stats.totalSent} />
                  </div>
                </HUDCard>
                <HUDCard>
                  <div className="p-4">
                    <HUDStatBlock label="REPLIED" value={stats.totalReplied} />
                  </div>
                </HUDCard>
                <HUDCard>
                  <div className="p-4">
                    <HUDStatBlock label="MEETINGS" value={stats.totalMeetings} />
                  </div>
                </HUDCard>
                <HUDCard>
                  <div className="p-4">
                    <HUDStatBlock label="NO RESPONSE" value={stats.totalNoResponse} />
                  </div>
                </HUDCard>
              </div>
            )}
            <HUDCard accent>
              <div className="p-4">
                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(0,255,255,0.9)' }}>
                  SENT EMAILS
                </h3>
                {isLoading ? (
                  <div className="py-12 text-center text-xs tracking-widest" style={{ color: 'rgba(0,255,255,0.5)' }}>LOADING...</div>
                ) : (
                  <HUDDataTable
                    columns={[
                      {
                        key: 'to',
                        header: 'TO',
                        render: (e) => (
                          <button
                            type="button"
                            onClick={() => { setSelectedEmail(e); setShowPreviewModal(true); }}
                            className="hover:underline text-left"
                          >
                            {e.recipientName || e.recipientEmail}
                          </button>
                        ),
                      },
                      { key: 'subject', header: 'SUBJECT', render: (e) => <span className="truncate max-w-[180px] block">{e.subject}</span> },
                      { key: 'status', header: 'STATUS', render: (e) => STATUS_CONFIG[e.status]?.label || e.status },
                      { key: 'sent', header: 'SENT', render: (e) => formatDate(e.sentAt) },
                      {
                        key: 'actions',
                        header: '',
                        render: (e) => (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => { setSelectedEmail(e); setShowPreviewModal(true); }} className="p-1 hover:bg-cyan-500/20" title="View">
                              <Eye className="w-3 h-3" style={{ color: '#22d3ee' }} />
                            </button>
                          </div>
                        ),
                      },
                    ]}
                    data={emails}
                    keyExtractor={(e) => e.id}
                    emptyMessage="NO EMAILS"
                  />
                )}
              </div>
            </HUDCard>
          </div>
        </HUDAppLayout>
        {showPreviewModal && selectedEmail && (
          <EmailPreviewModal
            email={selectedEmail}
            onClose={() => { setShowPreviewModal(false); setSelectedEmail(null); }}
            onStatusUpdate={(status) => handleStatusUpdate(selectedEmail.id, status)}
            onScheduleFollowUp={() => handleScheduleFollowUp(selectedEmail.id)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email Outreach</h1>
                <p className="text-gray-500">Track and manage your cold email campaigns</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => { loadEmails(); loadStats(); }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Replies - dedicated section */}
        <EmailRepliesSection variant="default" limit={5} className="mb-8" />
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
                  <p className="text-sm text-gray-500">Emails Sent</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
                  <p className="text-sm text-gray-500">Response Rate</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMeetings}</p>
                  <p className="text-sm text-gray-500">Meetings Scheduled</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(followUpStats?.dueToday || 0) + (followUpStats?.overdue || 0)}
                  </p>
                  <p className="text-sm text-gray-500">Follow-ups Due</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Follow-up Alert Banner */}
        {followUpStats && (followUpStats.overdue > 0 || followUpStats.dueToday > 0) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800">
                  <strong>{followUpStats.overdue}</strong> overdue and <strong>{followUpStats.dueToday}</strong> follow-ups due today
                </span>
              </div>
              <button
                onClick={() => setShowFollowUpsDue(true)}
                className="text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                View All
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, company..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="replied">Replied</option>
              <option value="meeting_scheduled">Meeting Scheduled</option>
              <option value="no_response">No Response</option>
              <option value="not_interested">Not Interested</option>
            </select>

            {/* Follow-ups Due Toggle */}
            <button
              onClick={() => { setShowFollowUpsDue(!showFollowUpsDue); setPage(1); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                showFollowUpsDue
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Clock className="w-4 h-4" />
              Follow-ups Due
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Email List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
              <p className="text-gray-500">
                {showFollowUpsDue
                  ? "No follow-ups due. You're all caught up!"
                  : 'Start sending emails to track them here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {emails.map((email) => {
                const statusConfig = STATUS_CONFIG[email.status] || STATUS_CONFIG.sent;
                const overdue = isFollowUpOverdue(email);
                const dueToday = isFollowUpDueToday(email);

                return (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      'p-4 hover:bg-gray-50 transition-colors',
                      overdue && 'bg-red-50/50',
                      dueToday && !overdue && 'bg-amber-50/50'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-700">
                          {email.recipientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {email.recipientName}
                          </h4>
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            statusConfig.bgColor,
                            statusConfig.color
                          )}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                          {overdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                          {dueToday && !overdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              <Clock className="w-3 h-3" />
                              Due Today
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate mb-1">
                          {email.recipientEmail} • {email.recipientPosition}
                        </p>
                        <p className="text-sm text-gray-900 font-medium truncate mb-2">
                          {email.subject}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {email.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Sent {formatDate(email.sentAt)}
                          </span>
                          {email.followUpDate && email.status === 'sent' && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Follow-up: {formatDate(email.followUpDate)}
                            </span>
                          )}
                          {email.followUpCount > 0 && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              {email.followUpCount} follow-up(s)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmail(email);
                            setShowPreviewModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Email"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Quick Actions Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === email.id ? null : email.id)}
                            disabled={updatingEmailId === email.id}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {updatingEmailId === email.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </button>

                          {actionMenuId === email.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
                              {email.status === 'sent' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(email.id, 'replied')}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50"
                                  >
                                    <MessageSquare className="w-4 h-4 text-green-500" />
                                    Mark as Replied
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(email.id, 'meeting_scheduled')}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50"
                                  >
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    Meeting Scheduled
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(email.id, 'no_response')}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50"
                                  >
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    Mark No Response
                                  </button>
                                  <button
                                    onClick={() => handleScheduleFollowUp(email.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50"
                                  >
                                    <CalendarPlus className="w-4 h-4 text-blue-500" />
                                    Schedule Follow-up
                                  </button>
                                  <div className="border-t border-gray-100 my-1" />
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(email.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Record
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && emails.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total} emails
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Preview Modal */}
      {showPreviewModal && selectedEmail && (
        <EmailPreviewModal
          email={selectedEmail}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedEmail(null);
          }}
          onStatusUpdate={(status: string) => handleStatusUpdate(selectedEmail.id, status)}
          onScheduleFollowUp={() => handleScheduleFollowUp(selectedEmail.id)}
        />
      )}

      {/* Click outside to close action menu */}
      {actionMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuId(null)}
        />
      )}
    </div>
  );
}
