import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';
import {
  APP_REGISTRY,
  type OSAppDefinition,
} from './appRegistry';
import { usePluginsStore } from '@/stores/plugins.store';

export function Desktop() {
  const navigate = useNavigate();
  const { openApp, closeStartMenu } = useOSStore();
  const { enabledPlugins } = usePluginsStore();

  const enabledPluginIds = enabledPlugins.map((p) => p.id);

  const visibleApps = APP_REGISTRY.filter(
    (app) =>
      app.isSystem || !app.pluginId || enabledPluginIds.includes(app.pluginId)
  );

  const handleOpenApp = useCallback(
    (app: OSAppDefinition) => {
      openApp(app.id, app.route, app.name);
      navigate(app.route);
      closeStartMenu();
    },
    [openApp, navigate, closeStartMenu]
  );

  return (
    <div
      className="absolute inset-0 bottom-11 overflow-hidden select-none"
      onClick={() => closeStartMenu()}
    >
      {/* Wallpaper — matches lock screen gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />

      {/* Radial glows — matching lock screen aesthetic */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.10),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(6,182,212,0.06),transparent_40%)]" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,1) 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Desktop Icons - Vertical columns from top-left, like a real desktop */}
      <div className="relative z-10 h-full p-4 md:p-6">
        <div className="flex flex-wrap gap-1 content-start h-full" style={{ flexDirection: 'column' }}>
          {visibleApps.map((app, idx) => (
            <DesktopIcon
              key={app.id}
              app={app}
              index={idx}
              onOpen={() => handleOpenApp(app)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopIcon({
  app,
  index,
  onOpen,
}: {
  app: OSAppDefinition;
  index: number;
  onOpen: () => void;
}) {
  const Icon = app.icon;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, type: 'spring', stiffness: 400, damping: 25 }}
      onDoubleClick={(e) => { e.stopPropagation(); onOpen(); }}
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      className="group flex flex-col items-center gap-1 w-[76px] py-2 px-1 rounded-lg hover:bg-white/[0.07] active:bg-white/[0.12] transition-all duration-150 cursor-default"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-105 group-active:scale-95"
        style={{
          background: `linear-gradient(145deg, ${app.color}, ${app.color}bb)`,
          boxShadow: `0 2px 8px ${app.color}30`,
        }}
      >
        <Icon className="w-5 h-5 text-white drop-shadow-sm" />
      </div>
      <span className="text-[10px] text-white/80 font-medium text-center leading-tight w-full truncate group-hover:text-white transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {app.name}
      </span>
    </motion.button>
  );
}
