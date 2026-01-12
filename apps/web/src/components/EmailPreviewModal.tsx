import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  User,
  Building2,
  Calendar,
  Clock,
  MessageSquare,
  CalendarPlus,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SentEmail } from '@/lib/plugins-api';

interface EmailPreviewModalProps {
  email: SentEmail;
  onClose: () => void;
  onStatusUpdate: (status: string) => void;
  onScheduleFollowUp: () => void;
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  sent: { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  replied: { label: 'Replied', color: 'text-green-600', bgColor: 'bg-green-50' },
  meeting_scheduled: { label: 'Meeting Scheduled', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  not_interested: { label: 'Not Interested', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  no_response: { label: 'No Response', color: 'text-amber-600', bgColor: 'bg-amber-50' },
};

export function EmailPreviewModal({
  email,
  onClose,
  onStatusUpdate,
  onScheduleFollowUp,
}: EmailPreviewModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const statusConfig = STATUS_CONFIG[email.status] || STATUS_CONFIG.sent;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isOverdue = () => {
    if (!email.followUpDate || email.followedUp || email.status !== 'sent') return false;
    return new Date(email.followUpDate) < new Date();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Preview</h2>
                <p className="text-sm text-gray-500">
                  Sent {formatShortDate(email.sentAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                statusConfig.bgColor,
                statusConfig.color
              )}>
                {statusConfig.label}
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/80 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Follow-up Alert */}
            {email.status === 'sent' && email.followUpDate && (
              <div className={cn(
                'mb-6 p-4 rounded-xl border',
                isOverdue()
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              )}>
                <div className="flex items-center gap-2">
                  {isOverdue() ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                  <span className={isOverdue() ? 'text-red-800' : 'text-amber-800'}>
                    <strong>Follow-up {isOverdue() ? 'was due' : 'scheduled for'}:</strong>{' '}
                    {formatShortDate(email.followUpDate)}
                    {email.followUpCount > 0 && (
                      <span className="ml-2 text-sm opacity-75">
                        ({email.followUpCount} follow-up{email.followUpCount > 1 ? 's' : ''} sent)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Recipient Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recipient</h3>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-emerald-700">
                    {email.recipientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{email.recipientName}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{email.recipientEmail}</span>
                    <button
                      onClick={() => copyToClipboard(email.recipientEmail, 'email')}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {email.recipientPosition && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-4 h-4 text-gray-400 text-xs flex items-center justify-center">💼</span>
                      <span className="text-gray-600">{email.recipientPosition}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{email.company}</span>
                  </div>
                </div>
              </div>

              {/* Job Application Link */}
              {email.jobApplication && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Linked to:</span>
                    <a
                      href={`/plugins/job-tracker/applications/${email.jobApplication.id}`}
                      className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                    >
                      {email.jobApplication.jobTitle} at {email.jobApplication.company}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Email Content */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Subject</h3>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {email.subject}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Message</h3>
              <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {email.body}
              </div>
            </div>

            {/* Notes */}
            {email.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-gray-700">
                  {email.notes}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Sent: {formatDate(email.sentAt)}
                </span>
                {email.gmailMessageId && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Gmail ID: {email.gmailMessageId.slice(0, 12)}...
                  </span>
                )}
                {email.followUpCount > 0 && (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    {email.followUpCount} follow-up{email.followUpCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          {email.status === 'sent' && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Quick Actions</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStatusUpdate('replied')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Replied
                  </button>
                  <button
                    onClick={() => onStatusUpdate('meeting_scheduled')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Meeting Scheduled
                  </button>
                  <button
                    onClick={onScheduleFollowUp}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Schedule Follow-up
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
