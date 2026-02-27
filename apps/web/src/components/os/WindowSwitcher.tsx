import { motion, AnimatePresence } from 'framer-motion';
import { getAppById } from './appRegistry';
import { useOSStore } from '@/stores/os.store';

interface WindowSwitcherProps {
  visible: boolean;
  selectedIndex: number;
}

export function WindowSwitcher({ visible, selectedIndex }: WindowSwitcherProps) {
  const { windows, osStyle } = useOSStore();
  const openWindows = windows.filter((w) => !w.isMinimized);
  const isHUD = osStyle === 'hud';

  return (
    <AnimatePresence>
      {visible && openWindows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="flex gap-4 p-6 max-w-[80vw] overflow-x-auto"
            style={{
              background: isHUD ? 'rgba(3,8,14,0.9)' : 'rgba(15,20,30,0.9)',
              border: `1px solid ${isHUD ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            {openWindows.map((win, i) => {
              const app = getAppById(win.appId);
              const Icon = app?.icon;
              const isSelected = i === selectedIndex;

              return (
                <motion.div
                  key={win.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-col items-center gap-2 p-4 min-w-[120px] transition-all"
                  style={{
                    border: isSelected
                      ? `2px solid ${isHUD ? '#22d3ee' : '#60a5fa'}`
                      : '2px solid transparent',
                    background: isSelected
                      ? isHUD ? 'rgba(0,255,255,0.1)' : 'rgba(96,165,250,0.1)'
                      : 'transparent',
                    boxShadow: isSelected
                      ? `0 0 20px ${isHUD ? 'rgba(0,255,255,0.2)' : 'rgba(96,165,250,0.2)'}`
                      : undefined,
                  }}
                >
                  {Icon && (
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ background: `${app?.color}22`, border: `1px solid ${app?.color}44` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: app?.color }} />
                    </div>
                  )}
                  <span
                    className="text-[10px] font-mono font-bold tracking-wider truncate max-w-[100px]"
                    style={{
                      color: isSelected
                        ? isHUD ? '#e0f7fa' : '#fff'
                        : isHUD ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {win.title.toUpperCase()}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <div
            className="absolute bottom-8 text-[10px] font-mono tracking-wider"
            style={{ color: isHUD ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.4)' }}
          >
            ALT+TAB to switch • Release ALT to select
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
