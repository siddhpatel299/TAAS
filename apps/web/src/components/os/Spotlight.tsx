import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';
import { usePluginsStore } from '@/stores/plugins.store';
import { APP_REGISTRY, type OSAppDefinition } from './appRegistry';
import { useHUDSounds } from '@/hooks/useHUDSounds';

export function Spotlight() {
  const navigate = useNavigate();
  const { showSpotlight, closeSpotlight, openApp } = useOSStore();
  const { enabledPlugins } = usePluginsStore();
  const { play } = useHUDSounds();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const enabledPluginIds = enabledPlugins.map((p) => p.id);
  const visibleApps = APP_REGISTRY.filter(
    (app) => app.isSystem || !app.pluginId || enabledPluginIds.includes(app.pluginId)
  );

  const filteredApps = query.trim()
    ? visibleApps.filter(
        (app) =>
          app.name.toLowerCase().includes(query.toLowerCase()) ||
          app.description.toLowerCase().includes(query.toLowerCase()) ||
          app.category.toLowerCase().includes(query.toLowerCase())
      )
    : visibleApps;

  const results = filteredApps.map((app) => ({ type: 'app' as const, app }));

  useEffect(() => {
    if (showSpotlight) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showSpotlight]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!showSpotlight) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSpotlight();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        const item = results[selectedIndex];
        if (item.type === 'app') {
          play('open');
          openApp(item.app.id, item.app.route, item.app.name);
          navigate(item.app.route);
          closeSpotlight();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSpotlight, results, selectedIndex, closeSpotlight, openApp, navigate, play]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const child = el.children[selectedIndex] as HTMLElement;
    child?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  const handleSelect = (app: OSAppDefinition) => {
    play('open');
    openApp(app.id, app.route, app.name);
    navigate(app.route);
    closeSpotlight();
  };

  return (
    <AnimatePresence>
      {showSpotlight && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={closeSpotlight}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 z-[151] w-full max-w-xl"
          >
            <div
              className="border overflow-hidden"
              style={{
                background: 'rgba(3,8,14,0.95)',
                borderColor: 'rgba(0,255,255,0.3)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 0 40px rgba(0,255,255,0.15), 0 25px 50px rgba(0,0,0,0.5)',
              }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(0,255,255,0.2)' }}>
                <Search className="w-5 h-5 shrink-0" style={{ color: '#22d3ee' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search apps and files..."
                  className="flex-1 bg-transparent text-base font-mono focus:outline-none placeholder:opacity-50"
                  style={{ color: '#e0f7fa' }}
                />
                <kbd className="hidden sm:inline px-2 py-0.5 text-[10px] rounded border" style={{ color: 'rgba(0,255,255,0.5)', borderColor: 'rgba(0,255,255,0.2)' }}>
                  ⌘K
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-72 overflow-y-auto py-2"
              >
                {results.length === 0 ? (
                  <div className="px-4 py-8 text-center font-mono text-sm" style={{ color: 'rgba(0,255,255,0.4)' }}>
                    No results for "{query}"
                  </div>
                ) : (
                  results.map((item, i) => {
                    if (item.type !== 'app') return null;
                    const { app } = item;
                    const Icon = app.icon;
                    const isSelected = i === selectedIndex;

                    return (
                      <button
                        key={app.id}
                        onClick={() => handleSelect(app)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={{
                          background: isSelected ? 'rgba(0,255,255,0.08)' : 'transparent',
                        }}
                      >
                        <div
                          className="w-9 h-9 flex items-center justify-center shrink-0 border"
                          style={{
                            background: 'rgba(0,255,255,0.05)',
                            borderColor: isSelected ? 'rgba(0,255,255,0.4)' : 'rgba(0,255,255,0.15)',
                          }}
                        >
                          <Icon className="w-4 h-4" style={{ color: app.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-sm truncate" style={{ color: '#e0f7fa' }}>
                            {app.name}
                          </div>
                          <div className="font-mono text-[10px] truncate" style={{ color: 'rgba(0,255,255,0.4)' }}>
                            {app.description}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(0,255,255,0.3)' }} />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t flex gap-4 text-[10px] font-mono" style={{ borderColor: 'rgba(0,255,255,0.1)', color: 'rgba(0,255,255,0.35)' }}>
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>Esc Close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
