import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Maximize2, X, Copy } from 'lucide-react';
import { useOSStore, type OSWindowState } from '@/stores/os.store';
import { useNavigate } from 'react-router-dom';
import { getAppById } from './appRegistry';

interface OSWindowProps {
  window: OSWindowState;
  isActive: boolean;
  children: React.ReactNode;
}

export function OSWindow({ window: win, isActive: _isActive, children }: OSWindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    updateWindowPosition,
    bringToFront,
    colorMode,
  } = useOSStore();
  const navigate = useNavigate();
  const app = getAppById(win.appId);
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);

  const handleClose = () => {
    const nextRoute = closeWindow(win.id);
    navigate(nextRoute || '/');
  };

  const handleMinimize = () => {
    minimizeWindow(win.id);
    navigate('/');
  };

  const handleMaximizeToggle = () => {
    if (win.isMaximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (win.isMaximized) return;
      bringToFront(win.id);
      dragRef.current = { startX: e.clientX, startY: e.clientY, winX: win.x, winY: win.y };
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

  const Icon = app?.icon;
  const isDark = colorMode === 'dark';

  const windowStyle = win.isMaximized
    ? { inset: '0 0 44px 0' }
    : {
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}vw`,
        height: `calc(${win.height}vh - 44px)`,
      };

  return (
    <AnimatePresence>
      {!win.isMinimized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
          className="absolute flex flex-col overflow-hidden rounded-lg shadow-2xl"
          style={{ ...windowStyle, zIndex: win.zIndex }}
          onClick={() => bringToFront(win.id)}
        >
          {/* Title Bar */}
          <div
            className={`flex items-center h-9 shrink-0 select-none border-b cursor-grab active:cursor-grabbing ${
              isDark
                ? 'bg-[#0d1525] border-white/[0.06]'
                : 'bg-white/80 backdrop-blur-xl border-black/[0.06]'
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleMaximizeToggle}
          >
            <div className="flex items-center gap-[6px] pl-3 pr-4">
              <button
                onClick={handleClose}
                className="group w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all flex items-center justify-center"
                title="Close"
              >
                <X className="w-[7px] h-[7px] text-[#4a0002] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={handleMinimize}
                className="group w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all flex items-center justify-center"
                title="Minimize"
              >
                <Minus className="w-[7px] h-[7px] text-[#5a3e00] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={handleMaximizeToggle}
                className="group w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all flex items-center justify-center"
                title={win.isMaximized ? 'Restore' : 'Maximize'}
              >
                {win.isMaximized ? (
                  <Copy className="w-[6px] h-[6px] text-[#0a4a00] opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Maximize2 className="w-[6px] h-[6px] text-[#0a4a00] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2 -ml-12">
              {Icon && (
                <div
                  className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${app?.color}cc, ${app?.color}88)` }}
                >
                  <Icon className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <span className={`text-[13px] font-medium ${isDark ? 'text-white/70' : 'text-black/60'}`}>
                {win.title}
              </span>
            </div>
          </div>

          {/* Window Body */}
          <div
            className={`flex-1 overflow-auto os-window-content ${isDark ? 'os-window-dark' : 'os-window-light'}`}
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #0f1724 0%, #111d33 40%, #0e1628 70%, #0c1220 100%)'
                : 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 40%, #f0f9ff 70%, #f8fafc 100%)',
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
