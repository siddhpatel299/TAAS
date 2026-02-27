import { Bell, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { useOSStore } from '@/stores/os.store';
import { useHUDSounds } from '@/hooks/useHUDSounds';
import { cn } from '@/lib/utils';

interface HUDAppHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  actions?: React.ReactNode;
}

export function HUDAppHeader({
  title,
  backHref,
  backLabel,
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  actions,
}: HUDAppHeaderProps) {
  const { user } = useAuthStore();
  const { toggleNotificationCenter, notifications } = useOSStore();
  const { play } = useHUDSounds();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const userName = user?.firstName || user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <header
      className="h-12 shrink-0 flex items-center justify-between px-4 border-b"
      style={{
        background: 'linear-gradient(180deg, rgba(8,20,30,0.95) 0%, rgba(4,12,20,0.98) 100%)',
        borderColor: 'rgba(0,255,255,0.3)',
      }}
    >
      {/* Back + App title */}
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            to={backHref}
            className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:bg-cyan-500/15 transition-colors group"
            title={backLabel || 'Back'}
          >
            <ChevronLeft className="w-4 h-4" style={{ color: '#22d3ee' }} />
            <span
              className="text-[10px] font-bold tracking-wider uppercase hidden sm:inline"
              style={{ color: 'rgba(0,255,255,0.85)' }}
            >
              {backLabel || 'BACK'}
            </span>
          </Link>
        )}
        {backHref && <div className="w-px h-5" style={{ background: 'rgba(0,255,255,0.2)' }} />}
        <span
          className="text-sm font-bold tracking-[0.2em] uppercase"
          style={{ color: '#a5f3fc', textShadow: '0 0 10px rgba(0,255,255,0.3)' }}
        >
          {title}
        </span>
        <div className="w-px h-5" style={{ background: 'rgba(0,255,255,0.2)' }} />
      </div>

      {/* Search or spacer */}
      {searchPlaceholder != null ? (
        <div className="flex-1 max-w-md mx-4 relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
            className={cn(
              'w-full h-8 px-3 text-xs font-mono bg-transparent border rounded-lg',
              'placeholder:opacity-50 focus:outline-none focus:ring-1'
            )}
            style={{
              color: '#22d3ee',
              borderColor: 'rgba(0,255,255,0.25)',
              fontFamily: 'var(--hud-font-mono)',
            }}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right: actions, notifications, user */}
      <div className="flex items-center gap-2">
        {actions}
        {actions && <div className="w-px h-5" style={{ background: 'rgba(0,255,255,0.2)' }} />}
        <button
          type="button"
          onClick={() => {
            play('click');
            toggleNotificationCenter();
          }}
          className="relative p-1.5 hover:bg-cyan-500/10 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" style={{ color: unreadCount > 0 ? '#fbbf24' : '#22d3ee' }} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full text-[7px] font-bold flex items-center justify-center"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'rgba(0,255,255,0.2)' }}>
          <Avatar className="w-7 h-7">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="text-xs" style={{ background: 'rgba(0,255,255,0.2)', color: '#22d3ee' }}>
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-bold tracking-wider hidden sm:inline" style={{ color: 'rgba(0,255,255,0.8)' }}>
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
