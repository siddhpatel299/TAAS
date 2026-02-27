import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, X, Square, Copy } from 'lucide-react';
import { useOSStore, type OSWindowState } from '@/stores/os.store';
import { useNavigate } from 'react-router-dom';
import { getAppById } from '../appRegistry';
import { useHUDSounds } from '@/hooks/useHUDSounds';

interface HUDWindowProps {
  window: OSWindowState;
  isActive: boolean;
  children: React.ReactNode;
}

export function HUDWindow({ window: win, isActive: _isActive, children }: HUDWindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    updateWindowPosition,
    bringToFront,
  } = useOSStore();
  const navigate = useNavigate();
  const { play } = useHUDSounds();
  const app = getAppById(win.appId);
  const Icon = app?.icon;
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);

  const handleClose = () => {
    play('close');
    const nextRoute = closeWindow(win.id);
    navigate(nextRoute || '/');
  };

  const handleMinimize = () => {
    play('windowMinimize');
    minimizeWindow(win.id);
    navigate('/');
  };

  const handleMaximizeToggle = () => {
    if (win.isMaximized) {
      play('windowMinimize');
      restoreWindow(win.id);
    } else {
      play('windowMaximize');
      maximizeWindow(win.id);
    }
  };

  const handleTitleBarDoubleClick = () => {
    handleMaximizeToggle();
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (win.isMaximized) return;
      bringToFront(win.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        winX: win.x,
        winY: win.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [win.isMaximized, win.id, win.x, win.y, bringToFront]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      updateWindowPosition(win.id, dragRef.current.winX + dx, dragRef.current.winY + dy);
    },
    [win.id, updateWindowPosition]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const windowStyle = win.isMaximized
    ? { inset: '0 0 48px 0' }
    : {
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}vw`,
        height: `calc(${win.height}vh - 48px)`,
      };

  return (
    <AnimatePresence>
      {!win.isMinimized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute flex flex-col overflow-hidden font-mono"
          style={{
            ...windowStyle,
            zIndex: win.zIndex,
          }}
          onClick={() => bringToFront(win.id)}
        >
          {/* Outer glow frame */}
          <div className="absolute inset-0 pointer-events-none z-40">
            <div className="absolute inset-0 border border-cyan-500/30 shadow-[0_0_40px_rgba(0,255,255,0.08)]" />
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/70" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400/70" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-400/70" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400/70" />
            {/* Top edge glow line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            {/* Bottom edge glow line */}
            <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          </div>

          {/* Title bar */}
          <div
            className="relative z-50 flex items-center h-10 shrink-0 border-b border-cyan-500/40 select-none cursor-grab active:cursor-grabbing"
            style={{ background: 'linear-gradient(180deg, rgba(8,20,30,0.95) 0%, rgba(4,12,20,0.98) 100%)' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleTitleBarDoubleClick}
          >
            {/* Shimmer effect on title bar */}
            <div className="absolute inset-0 hud-shimmer pointer-events-none opacity-40" />

            <div className="flex items-center gap-1.5 pl-3 relative z-10">
              <button
                onClick={handleClose}
                className="w-6 h-6 flex items-center justify-center bg-red-950/50 border border-red-500/40 hover:bg-red-500 hover:border-red-400 text-red-400 hover:text-white transition-all group"
                title="Close"
              >
                <X className="w-3 h-3 group-hover:drop-shadow-[0_0_6px_rgba(255,100,100,0.8)]" />
              </button>
              <button
                onClick={handleMinimize}
                className="w-5 h-5 flex items-center justify-center border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 text-amber-500/50 hover:text-amber-300 transition-colors"
                title="Minimize"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={handleMaximizeToggle}
                className="w-5 h-5 flex items-center justify-center border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-500/50 hover:text-emerald-300 transition-colors"
                title={win.isMaximized ? 'Restore' : 'Maximize'}
              >
                {win.isMaximized ? <Copy className="w-2.5 h-2.5" /> : <Square className="w-2.5 h-2.5" />}
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2 -ml-8 relative z-10">
              {Icon && (
                <div
                  className="w-4 h-4 flex items-center justify-center border border-cyan-500/30"
                  style={{ background: `${app?.color}22` }}
                >
                  <Icon className="w-2.5 h-2.5" style={{ color: app?.color }} />
                </div>
              )}
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                style={{ color: '#a5f3fc', textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>
                {win.title.toUpperCase()}
              </span>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 pr-3 relative z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-[8px] text-emerald-400/60 tracking-widest">ACTIVE</span>
            </div>
          </div>

          {/* Window body */}
          <div
            className="flex-1 overflow-auto os-window-content os-hud-window"
            style={{
              background: 'linear-gradient(180deg, rgba(5,12,20,0.98) 0%, rgba(3,8,14,0.99) 100%)',
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
