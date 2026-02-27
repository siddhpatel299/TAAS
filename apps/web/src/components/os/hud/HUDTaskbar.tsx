import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, BatteryCharging, Volume2, VolumeX, Bell, ChevronUp, ChevronDown, Calendar, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';
import { getAppById } from '../appRegistry';
import { useHUDSounds } from '@/hooks/useHUDSounds';

export function HUDTaskbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    windows,
    activeWindowId,
    isStartMenuOpen,
    toggleStartMenu,
    focusWindow,
    closeStartMenu,
    toggleOSStyle,
    minimizeAllWindows,
    notifications,
    toggleNotificationCenter,
    toggleSpotlight,
    hudSoundMuted,
    toggleHudSoundMuted,
  } = useOSStore();
  const { play } = useHUDSounds();
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTaskClick = useCallback(
    (winId: string, route: string) => {
      const win = windows.find((w) => w.id === winId);
      if (!win) return;
      play('click');

      if (activeWindowId === winId && !win.isMinimized && location.pathname === route) {
        useOSStore.getState().minimizeWindow(winId);
        navigate('/');
      } else {
        focusWindow(winId);
        navigate(route);
      }
      closeStartMenu();
    },
    [windows, activeWindowId, location.pathname, play, focusWindow, navigate, closeStartMenu]
  );

  const handleShowDesktop = () => {
    play('windowMinimize');
    minimizeAllWindows();
    navigate('/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 z-[80] flex items-center select-none font-mono px-1">
      {/* Background */}
      <div
        className="absolute inset-0 border-t border-cyan-500/30"
        style={{ background: 'rgba(3,8,14,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      <div className="flex w-full h-full items-center justify-between relative z-10">
        {/* Left: Start + App tabs */}
        <div className="flex items-center h-full gap-1">
          {/* Start button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { play('click'); toggleStartMenu(); }}
            className={`relative w-12 h-10 flex items-center justify-center border-r border-cyan-500/20 transition-all ${
              isStartMenuOpen ? 'text-amber-400' : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {isStartMenuOpen && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            )}
          </motion.button>

          {/* Spotlight button */}
          <button
            onClick={() => { play('click'); toggleSpotlight(); }}
            className="h-8 px-3 flex items-center gap-2 border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition-all"
            title="Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5" style={{ color: '#22d3ee' }} />
            <span className="text-[9px] font-mono hidden sm:inline" style={{ color: 'rgba(0,255,255,0.6)' }}>Search</span>
          </button>

          <div className="w-px h-6 bg-cyan-500/20 mx-1" />

          {/* App tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-[45vw]">
            <AnimatePresence>
              {windows.map((win) => {
                const app = getAppById(win.appId);
                const WinIcon = app?.icon;
                const isActive = activeWindowId === win.id && !win.isMinimized;

                return (
                  <motion.button
                    key={win.id}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleTaskClick(win.id, win.route)}
                    className={`relative h-8 px-3 flex items-center gap-2 shrink-0 border transition-all ${
                      isActive
                        ? 'border-cyan-400/60 shadow-[0_0_12px_rgba(0,255,255,0.2)]'
                        : win.isMinimized
                          ? 'border-cyan-900/40 text-cyan-600/40 hover:border-cyan-700/60'
                          : 'border-cyan-800/40 hover:border-cyan-600/40'
                    }`}
                    style={{
                      background: isActive ? 'rgba(0,255,255,0.08)' : 'rgba(0,10,20,0.5)',
                    }}
                  >
                    {WinIcon && <WinIcon className="w-3 h-3 shrink-0" style={{ color: isActive ? '#67e8f9' : '#0e7490' }} />}
                    <span className="text-[9px] font-bold tracking-[0.1em] uppercase truncate max-w-[80px]"
                      style={{ color: isActive ? '#e0f7fa' : '#155e75' }}>
                      {win.title}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-0 left-2 right-2 h-px bg-cyan-400 shadow-[0_0_6px_rgba(0,255,255,0.6)]" />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: System tray */}
        <div className="flex items-center h-full gap-1 pr-1">
          {/* Show Desktop */}
          <button
            onClick={handleShowDesktop}
            className="hidden sm:flex items-center justify-center w-7 h-8 border border-cyan-500/15 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition-all"
            title="Show Desktop"
          >
            <div className="w-3.5 h-2.5 border border-cyan-500/40" />
          </button>

          <div className="w-px h-6 bg-cyan-500/15 mx-1" />

          {/* Audio wave indicator */}
          <div className="hidden md:flex items-end gap-[2px] h-3 px-1">
            {[30, 70, 45, 90, 55].map((h, i) => (
              <div key={i} className="w-0.5 bg-cyan-500/50 animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }} />
            ))}
          </div>

          {/* System icons */}
          <div className="flex items-center gap-2 px-2">
            <button
              onClick={() => { play('click'); toggleNotificationCenter(); }}
              className="relative p-1 hover:bg-cyan-500/10 transition-colors"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" style={{ color: unreadCount > 0 ? '#fbbf24' : '#0e7490' }} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full text-[7px] font-bold flex items-center justify-center"
                  style={{ background: '#ef4444', color: '#fff', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { play('click'); toggleHudSoundMuted(); }}
              className="p-1 hover:bg-cyan-500/10 transition-colors hidden md:flex"
              title={hudSoundMuted ? 'Unmute HUD sounds' : 'Mute HUD sounds'}
            >
              {hudSoundMuted ? (
                <VolumeX className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              ) : (
                <Volume2 className="w-3.5 h-3.5" style={{ color: '#22d3ee' }} />
              )}
            </button>
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5" style={{ color: '#22d3ee' }} />
            ) : (
              <WifiOff className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
            )}
            <BatteryCharging className="w-3.5 h-3.5 hidden md:block" style={{ color: '#34d399' }} />
          </div>

          <div className="w-px h-6 bg-cyan-500/15" />

          {/* Clock */}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex flex-col items-end px-2 hover:bg-cyan-500/5 transition-colors h-full justify-center"
          >
            <span className="text-[11px] font-bold tracking-[0.15em]" style={{ color: '#a5f3fc' }}>{timeStr}</span>
            <span className="text-[8px] tracking-[0.1em] uppercase" style={{ color: 'rgba(0,255,255,0.35)' }}>{dateStr}</span>
          </button>

          {/* Calendar popup */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-14 right-2 w-52 p-3 border border-cyan-500/30 z-[100] font-mono"
                style={{ background: 'rgba(3,8,14,0.95)', backdropFilter: 'blur(16px)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5" style={{ color: '#22d3ee' }} />
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: '#67e8f9' }}>
                    {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="text-[9px] space-y-1" style={{ color: 'rgba(0,255,255,0.4)' }}>
                  <div>LOCAL TIME: {time.toLocaleTimeString()}</div>
                  <div>UTC: {time.toUTCString().split(' ')[4]}</div>
                  <div>UPTIME: {Math.floor(performance.now() / 60000)}min</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OS Style toggle */}
          <button
            onClick={() => { play('click'); toggleOSStyle(); }}
            className="h-7 w-7 flex items-center justify-center border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 transition-colors"
            title="Switch to Normal OS"
          >
            <ChevronUp className="w-2.5 h-2.5 -mb-0.5" style={{ color: '#f59e0b' }} />
            <ChevronDown className="w-2.5 h-2.5 -mt-0.5" style={{ color: '#f59e0b' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
