import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '@/stores/os.store';
import { useNavigate } from 'react-router-dom';
import { useHUDSounds } from '@/hooks/useHUDSounds';
import { Image, Settings, RefreshCw, X, Minus, Pin } from 'lucide-react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ElementType;
  action: () => void;
  separator?: boolean;
  danger?: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const showContextMenu = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const hideContextMenu = useCallback(() => setMenu(null), []);

  return { menu, showContextMenu, hideContextMenu };
}

interface ContextMenuOverlayProps {
  menu: ContextMenuState | null;
  onClose: () => void;
}

export function ContextMenuOverlay({ menu, onClose }: ContextMenuOverlayProps) {
  const { osStyle } = useOSStore();
  const { play } = useHUDSounds();
  const isHUD = osStyle === 'hud';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menu, onClose]);

  if (!menu) return null;

  const maxY = window.innerHeight - 300;
  const maxX = window.innerWidth - 200;
  const posX = Math.min(menu.x, maxX);
  const posY = Math.min(menu.y, maxY);

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[300] min-w-[180px] py-1 overflow-hidden"
        style={{
          left: posX,
          top: posY,
          background: isHUD ? 'rgba(3,8,14,0.95)' : 'rgba(20,25,35,0.95)',
          border: `1px solid ${isHUD ? 'rgba(0,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(20px)',
          boxShadow: isHUD
            ? '0 8px 30px rgba(0,0,0,0.5), 0 0 15px rgba(0,255,255,0.1)'
            : '0 8px 30px rgba(0,0,0,0.5)',
        }}
      >
        {menu.items.map((item, i) => (
          <div key={i}>
            {item.separator && (
              <div className="my-1 mx-2 h-px" style={{ background: isHUD ? 'rgba(0,255,255,0.12)' : 'rgba(255,255,255,0.06)' }} />
            )}
            <button
              onClick={() => {
                play('click');
                item.action();
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left transition-colors"
              style={{
                color: item.danger
                  ? '#f87171'
                  : isHUD ? '#a5f3fc' : 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                fontFamily: isHUD ? "'Rajdhani', sans-serif" : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isHUD ? 'rgba(0,255,255,0.08)' : 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" style={{ opacity: 0.6 }} />}
              <span className="tracking-wider">{item.label}</span>
            </button>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export function useDesktopContextMenu() {
  const navigate = useNavigate();
  const { menu, showContextMenu, hideContextMenu } = useContextMenu();

  const handleDesktopRightClick = useCallback(
    (e: React.MouseEvent) => {
      showContextMenu(e, [
        {
          label: 'Change Wallpaper',
          icon: Image,
          action: () => navigate('/settings'),
        },
        {
          label: 'Display Settings',
          icon: Settings,
          action: () => navigate('/settings'),
        },
        {
          label: 'Refresh',
          icon: RefreshCw,
          action: () => window.location.reload(),
          separator: true,
        },
      ]);
    },
    [showContextMenu, navigate]
  );

  return { menu, hideContextMenu, handleDesktopRightClick };
}

export function useTaskbarContextMenu() {
  const navigate = useNavigate();
  const { closeWindow, minimizeWindow } = useOSStore();
  const { menu, showContextMenu, hideContextMenu } = useContextMenu();

  const handleTaskbarItemRightClick = useCallback(
    (e: React.MouseEvent, windowId: string) => {
      showContextMenu(e, [
        {
          label: 'Minimize',
          icon: Minus,
          action: () => {
            minimizeWindow(windowId);
            navigate('/');
          },
        },
        {
          label: 'Close',
          icon: X,
          action: () => {
            const next = closeWindow(windowId);
            navigate(next || '/');
          },
          separator: true,
          danger: true,
        },
      ]);
    },
    [showContextMenu, closeWindow, minimizeWindow, navigate]
  );

  return { menu, hideContextMenu, handleTaskbarItemRightClick };
}

export function useDesktopIconContextMenu() {
  const { openApp } = useOSStore();
  const navigate = useNavigate();
  const { menu, showContextMenu, hideContextMenu } = useContextMenu();

  const handleIconRightClick = useCallback(
    (e: React.MouseEvent, appId: string, route: string, name: string) => {
      showContextMenu(e, [
        {
          label: 'Open',
          action: () => {
            openApp(appId, route, name);
            navigate(route);
          },
        },
        {
          label: 'Pin to Taskbar',
          icon: Pin,
          action: () => {},
          separator: true,
        },
      ]);
    },
    [showContextMenu, openApp, navigate]
  );

  return { menu, hideContextMenu, handleIconRightClick };
}
