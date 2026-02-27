import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Power, Settings, ChevronRight, Shield, Terminal, Cpu, Target, Network, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePluginsStore } from '@/stores/plugins.store';
import {
  APP_REGISTRY,
  CATEGORY_LABELS,
  type OSAppDefinition,
  type AppCategory,
} from '../appRegistry';
import { useHUDSounds } from '@/hooks/useHUDSounds';

export function HUDStartMenu() {
  const navigate = useNavigate();
  const { isStartMenuOpen, closeStartMenu, openApp } = useOSStore();
  const { user, logout } = useAuthStore();
  const { enabledPlugins } = usePluginsStore();
  const { play } = useHUDSounds();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const enabledPluginIds = enabledPlugins.map((p) => p.id);
  const visibleApps = APP_REGISTRY.filter(
    (app) => app.isSystem || !app.pluginId || enabledPluginIds.includes(app.pluginId)
  );

  const filteredApps = search
    ? visibleApps.filter(
        (app) =>
          app.name.toLowerCase().includes(search.toLowerCase()) ||
          app.description.toLowerCase().includes(search.toLowerCase())
      )
    : visibleApps;

  const pinnedApps = visibleApps.slice(0, 10);
  const allCategories = [...new Set(filteredApps.map((a) => a.category))] as AppCategory[];

  useEffect(() => {
    if (isStartMenuOpen) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [isStartMenuOpen]);

  const handleOpenApp = (app: OSAppDefinition) => {
    play('open');
    openApp(app.id, app.route, app.name);
    navigate(app.route);
    closeStartMenu();
  };

  const handleLogout = () => {
    logout();
    closeStartMenu();
    navigate('/login');
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || 'OPERATIVE';

  return (
    <AnimatePresence>
      {isStartMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={closeStartMenu}
          />

          {/* Menu panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-[56px] mx-auto z-[91] w-[92vw] max-w-[960px] h-[78vh] max-h-[680px] font-tech flex flex-col border border-cyan-500/30 overflow-hidden"
            style={{ background: 'rgba(3,8,14,0.92)', backdropFilter: 'blur(24px)' }}
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/50 pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/50 pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/50 pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/50 pointer-events-none z-10" />

            {/* Top glow line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

            {/* Subtle scan line */}
            <motion.div
              className="absolute left-0 right-0 h-[2px] pointer-events-none z-50 opacity-30"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.3), transparent)' }}
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            {/* Search Header */}
            <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between gap-4 shrink-0"
              style={{ background: 'linear-gradient(180deg, rgba(0,255,255,0.03), transparent)' }}>
              <div className="flex-1 max-w-2xl relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4" style={{ color: '#22d3ee' }} />
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); if (e.target.value) play('hover'); }}
                  placeholder="QUERY MODULES..."
                  className="w-full pl-10 pr-4 py-3 border text-sm font-mono focus:outline-none transition-all"
                  style={{
                    background: 'rgba(0,255,255,0.03)',
                    borderColor: 'rgba(0,255,255,0.25)',
                    color: '#e0f7fa',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.5)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,255,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,255,255,0.25)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-2 px-2 py-1 border font-mono text-[10px] tracking-[0.15em]"
                  style={{ borderColor: 'rgba(0,255,255,0.25)', color: '#22d3ee', background: 'rgba(0,255,255,0.05)' }}>
                  <Shield className="w-3 h-3" />
                  AUTHORIZED
                </div>
                <span className="text-[9px] mt-1 font-mono tracking-[0.1em] uppercase" style={{ color: 'rgba(0,255,255,0.4)' }}>
                  {displayName}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Apps grid */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-none border-r border-cyan-500/15">
                {!search ? (
                  <div className="space-y-6">
                    {/* Pinned apps */}
                    <div>
                      <SectionHeader icon={Target} label="PRIMARY_MODULES" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                        {pinnedApps.map((app, i) => (
                          <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <AppGridItem app={app} onOpen={() => handleOpenApp(app)} />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    {allCategories
                      .filter((c) => filteredApps.some((a) => a.category === c))
                      .map((category) => (
                        <div key={category}>
                          <SectionHeader icon={Network} label={CATEGORY_LABELS[category]} small />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {filteredApps
                              .filter((a) => a.category === category)
                              .map((app) => (
                                <AppListItem key={app.id} app={app} onOpen={() => handleOpenApp(app)} />
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <SectionHeader icon={Terminal} label="SEARCH_RESULTS" />
                    {filteredApps.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {filteredApps.map((app) => (
                          <AppListItem key={app.id} app={app} onOpen={() => handleOpenApp(app)} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center">
                        <Zap className="w-10 h-10 mb-3" style={{ color: 'rgba(0,255,255,0.15)' }} />
                        <p className="font-mono tracking-[0.15em] text-sm" style={{ color: 'rgba(0,255,255,0.4)' }}>ERR_QUERY_NOT_FOUND</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* System panel */}
              <div className="hidden md:flex w-64 flex-col p-5"
                style={{ background: 'linear-gradient(180deg, rgba(0,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-1.5 mb-4">
                  <Cpu className="w-3 h-3" style={{ color: '#0891b2' }} />
                  <span className="text-[9px] font-bold tracking-[0.2em] font-mono uppercase" style={{ color: 'rgba(0,255,255,0.5)' }}>
                    SYSTEM_OVERVIEW
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  <SystemBar label="CORE_LOAD" value="42%" width={42} color="#22d3ee" />
                  <SystemBar label="MEM_ALLOC" value="16.4 / 32 GB" width={51} color="#22d3ee" />
                  <SystemBar label="NET_UPLINK" value="885 MB/s" width={78} color="#a78bfa" />
                  <SystemBar label="DISK_IO" value="2.1 GB/s" width={35} color="#34d399" />
                </div>

                <div className="mt-auto pt-4 border-t border-cyan-500/15">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { closeStartMenu(); navigate('/settings'); play('click'); }}
                      className="flex-1 py-2 flex items-center justify-center gap-1.5 border text-[9px] font-mono tracking-[0.15em] transition-all hover:bg-cyan-500/10"
                      style={{ borderColor: 'rgba(0,255,255,0.2)', color: '#22d3ee' }}
                    >
                      <Settings className="w-3 h-3" /> CONFIG
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-2 flex items-center justify-center gap-1.5 border text-[9px] font-mono tracking-[0.15em] transition-all hover:bg-red-500/10"
                      style={{ borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
                    >
                      <Power className="w-3 h-3" /> LOGOUT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionHeader({ icon: Icon, label, small }: { icon: typeof Target; label: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} style={{ color: '#0891b2' }} />
      <h3 className={`font-bold font-mono tracking-[0.2em] uppercase ${small ? 'text-[10px]' : 'text-[11px]'}`}
        style={{ color: small ? 'rgba(0,255,255,0.45)' : '#22d3ee' }}>
        {label}
      </h3>
      <div className="flex-1 h-px ml-3" style={{ background: 'linear-gradient(90deg, rgba(0,255,255,0.2), transparent)' }} />
    </div>
  );
}

function SystemBar({ label, value, width, color }: { label: string; value: string; width: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] font-mono mb-1">
        <span style={{ color: 'rgba(0,255,255,0.4)' }}>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-1 w-full overflow-hidden" style={{ background: 'rgba(0,255,255,0.08)' }}>
        <motion.div
          className="h-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

function AppGridItem({ app, onOpen }: { app: OSAppDefinition; onOpen: () => void }) {
  const Icon = app.icon;
  const { play } = useHUDSounds();

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => play('hover')}
      className="flex flex-col items-center gap-2.5 p-3 border border-cyan-500/10 hover:border-cyan-400/50 hover:shadow-[0_0_12px_rgba(0,255,255,0.1)] transition-all group"
      style={{ background: 'rgba(0,255,255,0.02)' }}
    >
      <div className="w-10 h-10 flex items-center justify-center relative">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-500/30 group-hover:border-cyan-300/60 transition-colors" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-500/30 group-hover:border-cyan-300/60 transition-colors" />
        <Icon className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_currentColor] transition-all" style={{ color: app.color }} />
      </div>
      <span className="text-[9px] font-mono font-bold tracking-[0.12em] truncate w-full text-center"
        style={{ color: '#e0f7fa' }}>
        {app.name.toUpperCase()}
      </span>
    </button>
  );
}

function AppListItem({ app, onOpen }: { app: OSAppDefinition; onOpen: () => void }) {
  const Icon = app.icon;
  const { play } = useHUDSounds();

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => play('hover')}
      className="w-full flex items-center gap-3 px-3 py-2 border-l-2 border-transparent hover:border-cyan-400 hover:bg-cyan-500/5 transition-all group text-left"
    >
      <div className="w-7 h-7 flex items-center justify-center shrink-0 border border-cyan-500/15 group-hover:border-cyan-400/40"
        style={{ background: 'rgba(0,255,255,0.03)' }}>
        <Icon className="w-3.5 h-3.5" style={{ color: app.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono font-bold tracking-[0.12em] truncate" style={{ color: '#e0f7fa' }}>
          {app.name.toUpperCase()}
        </p>
        <p className="text-[8px] font-mono truncate" style={{ color: 'rgba(0,255,255,0.35)' }}>
          {app.description.toUpperCase()}
        </p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform"
        style={{ color: 'rgba(0,255,255,0.2)' }} />
    </button>
  );
}
