import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { useOSStore } from '@/stores/os.store';
import { getAppByRoute } from './appRegistry';
import { BootScreen } from './BootScreen';
import { Desktop } from './Desktop';
import { OSWindow } from './OSWindow';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { HUDBootScreen } from './hud/HUDBootScreen';
import { HUDDesktop } from './hud/HUDDesktop';
import { HUDWindow } from './hud/HUDWindow';
import { HUDTaskbar } from './hud/HUDTaskbar';
import { HUDStartMenu } from './hud/HUDStartMenu';
import { WindowSwitcher } from './WindowSwitcher';
import { Spotlight } from './Spotlight';
import { ContextMenuOverlay, useDesktopContextMenu } from './ContextMenu';
import { NotificationToasts, NotificationCenter } from './NotificationCenter';
import { useOSKeyboardShortcuts } from '@/hooks/useOSKeyboardShortcuts';
import '@/styles/hud-theme.css';

interface OSShellProps {
  children: React.ReactNode;
}

export function OSShell({ children }: OSShellProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    windows,
    activeWindowId,
    bootComplete,
    setBootComplete,
    openApp,
    colorMode,
    osStyle,
  } = useOSStore();

  const [showBoot, setShowBoot] = useState(!bootComplete);
  const isHUD = osStyle === 'hud';

  const { showSwitcher, switcherIndex } = useOSKeyboardShortcuts();
  const { menu: desktopMenu, hideContextMenu: hideDesktopMenu, handleDesktopRightClick } = useDesktopContextMenu();

  useEffect(() => {
    if (bootComplete) setShowBoot(false);
  }, [bootComplete]);

  useEffect(() => {
    if (isHUD) {
      document.body.classList.remove('os-dark');
      document.body.classList.add('os-hud');
    } else {
      document.body.classList.remove('os-hud');
      if (colorMode === 'dark') {
        document.body.classList.add('os-dark');
      } else {
        document.body.classList.remove('os-dark');
      }
    }
  }, [colorMode, isHUD]);

  const handleBootComplete = useCallback(() => {
    setShowBoot(false);
    setBootComplete(true);
  }, [setBootComplete]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    const path = location.pathname;
    if (path === '/' || path === '/login' || path === '/register') return;

    const app = getAppByRoute(path);
    if (app) {
      const existingWindow = windows.find((w) => w.appId === app.id);
      if (!existingWindow) {
        openApp(app.id, path, app.name);
      }
    }
  }, [location.pathname, isAuthenticated, authLoading]);

  const isDesktop = location.pathname === '/';
  const activeWindow = windows.find((w) => w.id === activeWindowId);

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${isHUD ? 'bg-black' : 'bg-[hsl(220,20%,6%)]'}`}
      onContextMenu={isDesktop ? handleDesktopRightClick : undefined}
    >
      {/* Boot Screen */}
      <AnimatePresence>
        {showBoot &&
          (isHUD ? (
            <HUDBootScreen onComplete={handleBootComplete} />
          ) : (
            <BootScreen onComplete={handleBootComplete} />
          ))}
      </AnimatePresence>

      {/* Desktop */}
      {isAuthenticated && !showBoot && (isHUD ? <HUDDesktop isDesktop={isDesktop} /> : <Desktop />)}

      {/* Active window */}
      {isAuthenticated &&
        !isDesktop &&
        activeWindow &&
        !activeWindow.isMinimized &&
        (isHUD ? (
          <HUDWindow window={activeWindow} isActive={true}>
            {children}
          </HUDWindow>
        ) : (
          <OSWindow window={activeWindow} isActive={true}>
            {children}
          </OSWindow>
        ))}

      {/* Start Menu */}
      {isAuthenticated && (isHUD ? <HUDStartMenu /> : <StartMenu />)}

      {/* Taskbar */}
      {isAuthenticated && !showBoot && (isHUD ? <HUDTaskbar /> : <Taskbar />)}

      {/* Window Switcher (Alt+Tab) */}
      <WindowSwitcher visible={showSwitcher} selectedIndex={switcherIndex} />

      {/* Spotlight (Cmd/Ctrl+Space) */}
      {isHUD && <Spotlight />}

      {/* Notifications */}
      <NotificationToasts />
      <NotificationCenter />

      {/* Context Menu */}
      <ContextMenuOverlay menu={desktopMenu} onClose={hideDesktopMenu} />
    </div>
  );
}
