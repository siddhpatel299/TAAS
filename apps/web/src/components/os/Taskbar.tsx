import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Wifi, Volume2, BatteryFull, Sun, Moon, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';
import { getAppById } from './appRegistry';

export function Taskbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    windows,
    activeWindowId,
    isStartMenuOpen,
    colorMode,
    toggleStartMenu,
    focusWindow,
    closeStartMenu,
    toggleColorMode,
    toggleOSStyle,
  } = useOSStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = time.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleTaskClick = (winId: string, route: string) => {
    const win = windows.find((w) => w.id === winId);
    if (!win) return;

    if (activeWindowId === winId && !win.isMinimized && location.pathname === route) {
      useOSStore.getState().minimizeWindow(winId);
      navigate('/');
    } else {
      focusWindow(winId);
      navigate(route);
    }
    closeStartMenu();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-11 z-[80] flex items-center select-none bg-gradient-to-r from-[rgba(15,23,36,0.85)] via-[rgba(17,29,51,0.85)] to-[rgba(12,18,32,0.85)] backdrop-blur-2xl border-t border-white/[0.06]">
      {/* Start Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggleStartMenu}
        className={`h-full px-4 flex items-center justify-center transition-colors ${
          isStartMenuOpen
            ? 'bg-white/[0.08] text-white'
            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
        }`}
      >
        <LayoutGrid className="w-[18px] h-[18px]" />
      </motion.button>

      {/* Separator */}
      <div className="w-px h-5 bg-white/[0.06]" />

      {/* Running App Tabs */}
      <div className="flex-1 flex items-center gap-px px-1 overflow-x-auto scrollbar-none">
        <AnimatePresence>
          {windows.map((win) => {
            const app = getAppById(win.appId);
            const Icon = app?.icon;
            const isActive = activeWindowId === win.id && !win.isMinimized;

            return (
              <motion.button
                key={win.id}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => handleTaskClick(win.id, win.route)}
                className={`relative h-8 px-3 rounded-md flex items-center gap-2 text-[12px] transition-all shrink-0 ${
                  isActive
                    ? 'bg-white/[0.1] text-white'
                    : win.isMinimized
                    ? 'text-white/25 hover:text-white/50 hover:bg-white/[0.03]'
                    : 'text-white/45 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                {Icon && (
                  <div
                    className="w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${app?.color}cc, ${app?.color}88)`,
                    }}
                  >
                    <Icon className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <span className="truncate max-w-[120px] font-medium">
                  {win.title}
                </span>

                {/* Active underline indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-task-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-blue-400"
                  />
                )}

                {/* Minimized dot */}
                {!isActive && !win.isMinimized && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/20" />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* System Tray */}
      <div className="flex items-center h-full">
        <div className="w-px h-5 bg-white/[0.06]" />

        {/* Tray Icons */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={toggleOSStyle}
            className="p-1.5 rounded-md hover:bg-white/[0.08] transition-colors"
            title="Switch to HUD Mode (Cyber Defense)"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400/70" />
          </button>
          <button
            onClick={toggleColorMode}
            className="p-1.5 rounded-md hover:bg-white/[0.08] transition-colors"
            title={colorMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {colorMode === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-white/50" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-yellow-300/80" />
            )}
          </button>
          <Wifi className="w-3.5 h-3.5 text-white/30 mx-1" />
          <Volume2 className="w-3.5 h-3.5 text-white/30" />
          <BatteryFull className="w-3.5 h-3.5 text-white/30" />
        </div>

        <div className="w-px h-5 bg-white/[0.06]" />

        {/* Clock */}
        <button
          className="h-full px-3 hover:bg-white/[0.04] transition-colors flex flex-col items-end justify-center"
          title={dateStr}
        >
          <span className="text-[11px] text-white/60 font-medium leading-tight tabular-nums">
            {timeStr}
          </span>
          <span className="text-[10px] text-white/30 leading-tight">
            {dateStr}
          </span>
        </button>

        {/* Show Desktop */}
        <button
          onClick={() => {
            closeStartMenu();
            navigate('/');
          }}
          className="w-[6px] h-full bg-transparent hover:bg-white/[0.08] transition-colors border-l border-white/[0.04]"
          title="Show Desktop"
        />
      </div>
    </div>
  );
}
