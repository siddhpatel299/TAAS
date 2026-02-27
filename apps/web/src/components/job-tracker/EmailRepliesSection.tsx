import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ChevronRight, Check, Loader2 } from 'lucide-react';
import { notificationsApi, AppNotification } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';
import { useOSStore } from '@/stores/os.store';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface EmailRepliesSectionProps {
  /** HUD mode styling */
  variant?: 'default' | 'hud';
  /** Max items to show */
  limit?: number;
  className?: string;
}

export function EmailRepliesSection({ variant = 'default', limit = 5, className }: EmailRepliesSectionProps) {
  const navigate = useNavigate();
  const osStyle = useOSStore((s) => s.osStyle);
  const isHUD = variant === 'hud' || osStyle === 'hud';

  const [replies, setReplies] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchReplies = useCallback(async () => {
    try {
      const res = await notificationsApi.getEmailReplies({ limit });
      setReplies(res.data.data);
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchReplies();
    const interval = setInterval(fetchReplies, 60_000);
    return () => clearInterval(interval);
  }, [fetchReplies]);

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMarkingId(id);
    try {
      await notificationsApi.markAsRead(id);
      setReplies((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } finally {
      setMarkingId(null);
    }
  };

  const handleClick = (n: AppNotification) => {
    if (!n.read) notificationsApi.markAsRead(n.id).then(() => fetchReplies());
    navigate('/plugins/job-tracker/outreach');
  };

  if (loading && replies.length === 0) {
    return (
      <div
        className={cn('rounded-xl border p-4', className)}
        style={
          isHUD
            ? { background: 'rgba(10,24,38,0.6)', borderColor: 'rgba(0,255,255,0.25)' }
            : undefined
        }
      >
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin" style={isHUD ? { color: '#22d3ee' } : undefined} />
        </div>
      </div>
    );
  }

  if (replies.length === 0) return null;

  return (
    <div
      className={cn('rounded-xl border', className)}
      style={
        isHUD
          ? { background: 'rgba(10,24,38,0.6)', borderColor: 'rgba(0,255,255,0.25)' }
          : { background: 'white', borderColor: 'rgb(229, 231, 235)' }
      }
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={
          isHUD
            ? { borderColor: 'rgba(0,255,255,0.2)' }
            : { borderColor: 'rgb(243, 244, 246)' }
        }
      >
        <div className="flex items-center gap-2">
          <Mail
            className="w-4 h-4"
            style={isHUD ? { color: '#22d3ee' } : { color: 'rgb(34, 197, 94)' }}
          />
          <h3
            className="text-sm font-bold tracking-wider"
            style={isHUD ? { color: '#a5f3fc' } : { color: 'rgb(17, 24, 39)' }}
          >
            EMAIL REPLIES
          </h3>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-bold"
            style={
              isHUD
                ? { background: 'rgba(0,255,255,0.15)', color: '#22d3ee' }
                : { background: 'rgb(220, 252, 231)', color: 'rgb(22, 163, 74)' }
            }
          >
            {replies.filter((r) => !r.read).length} NEW
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/plugins/job-tracker/outreach')}
          className="text-[10px] font-bold tracking-wider flex items-center gap-1 hover:opacity-80"
          style={isHUD ? { color: 'rgba(0,255,255,0.8)' } : { color: 'rgb(14, 165, 233)' }}
        >
          VIEW ALL <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className={cn('divide-y', isHUD ? 'divide-cyan-500/10' : 'divide-gray-100')}>
        {replies.map((n) => (
          <motion.button
            key={n.id}
            type="button"
            onClick={() => handleClick(n)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-opacity-80"
            style={{
              background: !n.read && isHUD ? 'rgba(0,255,255,0.05)' : !n.read ? 'rgb(240, 253, 244)' : 'transparent',
              borderColor: isHUD ? 'rgba(0,255,255,0.1)' : 'rgb(243, 244, 246)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={
                isHUD
                  ? { background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.2)' }
                  : { background: 'rgb(220, 252, 231)' }
              }
            >
              <Mail
                className="w-4 h-4"
                style={isHUD ? { color: '#22d3ee' } : { color: 'rgb(34, 197, 94)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn('text-sm leading-snug', !n.read && 'font-medium')}
                style={isHUD ? { color: '#e0f7fa' } : { color: 'rgb(17, 24, 39)' }}
              >
                {n.title}
              </p>
              <p
                className="text-xs mt-0.5 truncate"
                style={isHUD ? { color: 'rgba(0,255,255,0.6)' } : { color: 'rgb(107, 114, 128)' }}
              >
                {n.message}
              </p>
              <p
                className="text-[10px] mt-1"
                style={isHUD ? { color: 'rgba(0,255,255,0.4)' } : { color: 'rgb(156, 163, 175)' }}
              >
                {timeAgo(n.createdAt)}
              </p>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={(e) => handleMarkRead(e, n.id)}
                disabled={markingId === n.id}
                className="p-1.5 rounded hover:opacity-80 flex-shrink-0"
                style={isHUD ? { color: 'rgba(0,255,255,0.5)' } : { color: 'rgb(156, 163, 175)' }}
                title="Mark as read"
              >
                {markingId === n.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
