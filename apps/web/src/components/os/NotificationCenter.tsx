import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Info, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useOSStore } from '@/stores/os.store';
import { useHUDSounds } from '@/hooks/useHUDSounds';

const typeConfig = {
  info: { icon: Info, color: '#22d3ee', bg: 'rgba(0,255,255,0.08)' },
  success: { icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  warning: { icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  error: { icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationToasts() {
  const { notifications, markNotificationRead, osStyle } = useOSStore();
  const { play } = useHUDSounds();
  const isHUD = osStyle === 'hud';

  const recentUnread = notifications.filter((n) => !n.read && Date.now() - n.timestamp < 8000).slice(0, 3);

  useEffect(() => {
    if (recentUnread.length > 0) {
      play('notification');
      const timer = setTimeout(() => {
        recentUnread.forEach((n) => markNotificationRead(n.id));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [recentUnread.length]);

  return (
    <div className="fixed top-4 right-4 z-[250] flex flex-col gap-2 w-80 pointer-events-none">
      <AnimatePresence>
        {recentUnread.map((notif) => {
          const config = typeConfig[notif.type];
          const TypeIcon = config.icon;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 p-3 border"
              style={{
                background: isHUD ? 'rgba(3,8,14,0.92)' : 'rgba(15,20,30,0.92)',
                borderColor: isHUD ? `${config.color}44` : 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                boxShadow: isHUD
                  ? `0 4px 20px rgba(0,0,0,0.5), 0 0 10px ${config.color}22`
                  : '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div className="w-7 h-7 flex items-center justify-center shrink-0"
                style={{ background: config.bg, border: `1px solid ${config.color}33` }}>
                <TypeIcon className="w-3.5 h-3.5" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold tracking-wider truncate"
                  style={{ color: isHUD ? '#e0f7fa' : '#fff', fontFamily: isHUD ? "'Rajdhani', sans-serif" : undefined }}>
                  {notif.title.toUpperCase()}
                </p>
                <p className="text-[10px] mt-0.5 line-clamp-2"
                  style={{ color: isHUD ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.5)' }}>
                  {notif.message}
                </p>
              </div>
              <button
                onClick={() => markNotificationRead(notif.id)}
                className="p-0.5 hover:opacity-80 transition-opacity"
              >
                <X className="w-3 h-3" style={{ color: isHUD ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.3)' }} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function NotificationCenter() {
  const {
    notifications,
    showNotificationCenter,
    toggleNotificationCenter,
    markNotificationRead,
    clearNotifications,
    osStyle,
  } = useOSStore();
  const { play } = useHUDSounds();
  const isHUD = osStyle === 'hud';

  return (
    <AnimatePresence>
      {showNotificationCenter && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180]"
            onClick={toggleNotificationCenter}
          />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed right-2 bottom-14 top-2 w-80 z-[190] flex flex-col overflow-hidden border"
            style={{
              background: isHUD ? 'rgba(3,8,14,0.95)' : 'rgba(15,20,30,0.95)',
              borderColor: isHUD ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b shrink-0"
              style={{ borderColor: isHUD ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" style={{ color: isHUD ? '#22d3ee' : '#60a5fa' }} />
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase"
                  style={{ color: isHUD ? '#a5f3fc' : '#fff', fontFamily: isHUD ? "'Rajdhani', sans-serif" : undefined }}>
                  NOTIFICATIONS
                </span>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 font-bold"
                    style={{
                      background: isHUD ? 'rgba(0,255,255,0.15)' : 'rgba(96,165,250,0.15)',
                      color: isHUD ? '#22d3ee' : '#60a5fa',
                      border: `1px solid ${isHUD ? 'rgba(0,255,255,0.3)' : 'rgba(96,165,250,0.3)'}`,
                    }}>
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={() => { play('click'); clearNotifications(); }}
                    className="p-1 hover:opacity-80 transition-opacity"
                    title="Clear all"
                  >
                    <Trash2 className="w-3 h-3" style={{ color: isHUD ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.3)' }} />
                  </button>
                )}
                <button onClick={toggleNotificationCenter} className="p-1 hover:opacity-80 transition-opacity">
                  <X className="w-3.5 h-3.5" style={{ color: isHUD ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.4)' }} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Bell className="w-8 h-8 mb-2" style={{ color: isHUD ? 'rgba(0,255,255,0.1)' : 'rgba(255,255,255,0.1)' }} />
                  <p className="text-[11px] tracking-wider"
                    style={{ color: isHUD ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.3)' }}>
                    NO NOTIFICATIONS
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = typeConfig[notif.type];
                  const TypeIcon = config.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => { play('click'); markNotificationRead(notif.id); }}
                      className="w-full flex items-start gap-2.5 p-2.5 text-left transition-colors border"
                      style={{
                        background: notif.read ? 'transparent' : isHUD ? 'rgba(0,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                        borderColor: notif.read ? 'transparent' : isHUD ? 'rgba(0,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isHUD ? 'rgba(0,255,255,0.05)' : 'rgba(255,255,255,0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = notif.read ? 'transparent'
                          : isHUD ? 'rgba(0,255,255,0.03)' : 'rgba(255,255,255,0.02)';
                      }}
                    >
                      <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: config.bg }}>
                        <TypeIcon className="w-3 h-3" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold tracking-wider truncate"
                            style={{ color: isHUD ? '#e0f7fa' : '#fff' }}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: config.color, boxShadow: `0 0 4px ${config.color}` }} />
                          )}
                        </div>
                        <p className="text-[9px] mt-0.5 line-clamp-2"
                          style={{ color: isHUD ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.4)' }}>
                          {notif.message}
                        </p>
                        <span className="text-[8px] mt-1 block"
                          style={{ color: isHUD ? 'rgba(0,255,255,0.25)' : 'rgba(255,255,255,0.2)' }}>
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
