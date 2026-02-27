import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Power, Settings, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePluginsStore } from '@/stores/plugins.store';
import {
  APP_REGISTRY,
  CATEGORY_LABELS,
  type OSAppDefinition,
  type AppCategory,
} from './appRegistry';

export function StartMenu() {
  const navigate = useNavigate();
  const { isStartMenuOpen, closeStartMenu, openApp } = useOSStore();
  const { user, logout } = useAuthStore();
  const { enabledPlugins } = usePluginsStore();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const enabledPluginIds = enabledPlugins.map((p) => p.id);

  const visibleApps = APP_REGISTRY.filter(
    (app) =>
      app.isSystem || !app.pluginId || enabledPluginIds.includes(app.pluginId)
  );

  const filteredApps = search
    ? visibleApps.filter(
        (app) =>
          app.name.toLowerCase().includes(search.toLowerCase()) ||
          app.description.toLowerCase().includes(search.toLowerCase())
      )
    : visibleApps;

  const pinnedApps = visibleApps.slice(0, 8);
  const allCategories = [
    ...new Set(filteredApps.map((a) => a.category)),
  ] as AppCategory[];

  useEffect(() => {
    if (isStartMenuOpen) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [isStartMenuOpen]);

  const handleOpenApp = (app: OSAppDefinition) => {
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
    : user?.username || 'User';

  return (
    <AnimatePresence>
      {isStartMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[90]"
            onClick={closeStartMenu}
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className="fixed bottom-12 left-1 z-[91] w-[340px] md:w-[400px] bg-[rgba(15,23,42,0.80)] backdrop-blur-2xl backdrop-saturate-150 rounded-xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            {/* Search */}
            <div className="p-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search apps..."
                  className="w-full pl-9 pr-4 py-2 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-blue-400/30 focus:bg-white/[0.09] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-all"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
              {!search ? (
                <>
                  {/* Pinned Section */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                        Pinned
                      </span>
                      <button className="flex items-center gap-0.5 text-[10px] text-white/25 hover:text-white/50 transition-colors">
                        All apps <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-0.5">
                      {pinnedApps.map((app) => (
                        <AppTile
                          key={app.id}
                          app={app}
                          onOpen={() => handleOpenApp(app)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* All Apps by category */}
                  {allCategories
                    .filter((c) => filteredApps.some((a) => a.category === c))
                    .map((category) => (
                      <div key={category} className="mb-2">
                        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider block mb-1.5 px-1">
                          {CATEGORY_LABELS[category]}
                        </span>
                        {filteredApps
                          .filter((a) => a.category === category)
                          .map((app) => (
                            <AppListItem
                              key={app.id}
                              app={app}
                              onOpen={() => handleOpenApp(app)}
                            />
                          ))}
                      </div>
                    ))}
                </>
              ) : (
                // Search Results
                <div>
                  {filteredApps.length > 0 ? (
                    filteredApps.map((app) => (
                      <AppListItem
                        key={app.id}
                        app={app}
                        onOpen={() => handleOpenApp(app)}
                      />
                    ))
                  ) : (
                    <p className="text-center text-white/20 text-[13px] py-10">
                      No apps found
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                  {displayName[0]?.toUpperCase()}
                </div>
                <span className="text-[12px] text-white/50 font-medium truncate">
                  {displayName}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    closeStartMenu();
                    openApp('settings', '/settings', 'Settings');
                    navigate('/settings');
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Sign out"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AppTile({ app, onOpen }: { app: OSAppDefinition; onOpen: () => void }) {
  const Icon = app.icon;
  return (
    <button
      onClick={onOpen}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors group"
    >
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95"
        style={{
          background: `linear-gradient(145deg, ${app.color}, ${app.color}bb)`,
          boxShadow: `0 2px 6px ${app.color}25`,
        }}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-[10px] text-white/60 font-medium truncate w-full text-center group-hover:text-white/80 transition-colors">
        {app.name}
      </span>
    </button>
  );
}

function AppListItem({
  app,
  onOpen,
}: {
  app: OSAppDefinition;
  onOpen: () => void;
}) {
  const Icon = app.icon;
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors group text-left"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(145deg, ${app.color}cc, ${app.color}88)`,
        }}
      >
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-white/70 font-medium truncate group-hover:text-white/90 transition-colors">
          {app.name}
        </p>
        <p className="text-[10px] text-white/25 truncate">{app.description}</p>
      </div>
    </button>
  );
}
