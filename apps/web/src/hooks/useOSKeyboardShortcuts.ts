import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';

export function useOSKeyboardShortcuts() {
  const navigate = useNavigate();
  const {
    windows,
    activeWindowId,
    isStartMenuOpen,
    toggleStartMenu,
    closeStartMenu,
    focusWindow,
    minimizeAllWindows,
    closeWindow,
    toggleSpotlight,
    closeSpotlight,
  } = useOSStore();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Alt+Tab: Window Switcher
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const openWindows = windows.filter((w) => !w.isMinimized);
        if (openWindows.length === 0) return;

        if (!showSwitcher) {
          setShowSwitcher(true);
          const currentIdx = openWindows.findIndex((w) => w.id === activeWindowId);
          setSwitcherIndex((currentIdx + 1) % openWindows.length);
        } else {
          setSwitcherIndex((prev) => (prev + 1) % openWindows.length);
        }
      }

      // Cmd+Space / Ctrl+Space / Cmd+K: Spotlight
      if ((e.metaKey || e.ctrlKey) && (e.key === ' ' || e.key === 'k')) {
        e.preventDefault();
        toggleSpotlight();
        return;
      }

      // Escape: close spotlight, start menu, dialogs, or switcher
      if (e.key === 'Escape') {
        if (showSwitcher) {
          setShowSwitcher(false);
          return;
        }
        closeSpotlight();
        if (isStartMenuOpen) {
          closeStartMenu();
          return;
        }
      }

      // Meta/Win key: Toggle start menu
      if (e.key === 'Meta') {
        e.preventDefault();
        toggleStartMenu();
      }

      // Super+D: Show desktop
      if (e.metaKey && e.key === 'd') {
        e.preventDefault();
        minimizeAllWindows();
        navigate('/');
      }

      // Ctrl+W: Close active window
      if (e.ctrlKey && e.key === 'w') {
        if (activeWindowId) {
          e.preventDefault();
          const nextRoute = closeWindow(activeWindowId);
          navigate(nextRoute || '/');
        }
      }
    },
    [windows, activeWindowId, isStartMenuOpen, showSwitcher, toggleStartMenu, closeStartMenu, minimizeAllWindows, closeWindow, navigate, toggleSpotlight, closeSpotlight]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Alt' && showSwitcher) {
        setShowSwitcher(false);
        const openWindows = windows.filter((w) => !w.isMinimized);
        if (openWindows[switcherIndex]) {
          const target = openWindows[switcherIndex];
          focusWindow(target.id);
          navigate(target.route);
        }
      }
    },
    [showSwitcher, switcherIndex, windows, focusWindow, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { showSwitcher, switcherIndex, openWindows: windows.filter((w) => !w.isMinimized) };
}
