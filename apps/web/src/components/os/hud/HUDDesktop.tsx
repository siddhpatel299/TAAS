import { useCallback, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOSStore } from '@/stores/os.store';
import { useTodoStore } from '@/stores/todo.store';
import { useNotesStore } from '@/stores/notes.store';
import { APP_REGISTRY, type OSAppDefinition } from '../appRegistry';
import { usePluginsStore } from '@/stores/plugins.store';
import { useHUDSounds } from '@/hooks/useHUDSounds';
import { Shield } from 'lucide-react';
import { ContextMenuOverlay, useDesktopIconContextMenu } from '../ContextMenu';
import { PointCloudGlobe } from './PointCloudGlobe';

function CornerStatusPanels() {
  return (
    <div
      className="absolute top-4 left-4 w-44 border border-cyan-500/30 p-2 font-mono text-[9px] pointer-events-none z-0"
      style={{
        background: 'rgba(3,8,14,0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: 'rgba(0,255,255,0.9)' }}>
        MISSION STATUS
      </div>
      <div className="space-y-0.5" style={{ color: 'rgba(0,255,255,0.7)' }}>
        <div>SYSTEMS: NOMINAL</div>
        <div>UPLINK: ACTIVE</div>
        <div>CONN: SECURE</div>
      </div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-500/50" />
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-500/50" />
    </div>
  );
}

function CornerClockPanel() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div
      className="absolute top-4 right-4 w-40 border border-cyan-500/30 p-2 font-mono text-[9px] text-right pointer-events-none z-0"
      style={{
        background: 'rgba(3,8,14,0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="font-bold tracking-wider" style={{ color: 'rgba(0,255,255,0.9)' }}>
        {timeStr}
      </div>
      <div className="text-[8px] mt-0.5" style={{ color: 'rgba(0,255,255,0.6)' }}>
        {dateStr}
      </div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-500/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-500/50" />
    </div>
  );
}

function QuickStatsStrip({ onOpenApp }: { onOpenApp: (app: OSAppDefinition) => void }) {
  const { tasks, stats } = useTodoStore();
  const { totalNotes } = useNotesStore();

  const taskCount = stats?.total ?? tasks.length;
  const notesCount = totalNotes;

  const tasksApp = APP_REGISTRY.find((a) => a.id === 'todo-lists');
  const notesApp = APP_REGISTRY.find((a) => a.id === 'notes');
  const filesApp = APP_REGISTRY.find((a) => a.id === 'files');

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-1/2 translate-y-[min(28vmin,220px)] flex items-center gap-4 px-4 py-2 font-mono text-[9px] pointer-events-auto z-10"
      style={{
        background: 'rgba(3,8,14,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,255,255,0.2)',
      }}
    >
      {tasksApp && (
        <button
          type="button"
          onClick={() => onOpenApp(tasksApp)}
          className="hover:underline transition-colors"
          style={{ color: 'rgba(0,255,255,0.8)' }}
        >
          TASKS: {taskCount}
        </button>
      )}
      {notesApp && (
        <button
          type="button"
          onClick={() => onOpenApp(notesApp)}
          className="hover:underline transition-colors"
          style={{ color: 'rgba(0,255,255,0.8)' }}
        >
          NOTES: {notesCount}
        </button>
      )}
      {filesApp && (
        <button
          type="button"
          onClick={() => onOpenApp(filesApp)}
          className="hover:underline transition-colors"
          style={{ color: 'rgba(0,255,255,0.8)' }}
        >
          FILES
        </button>
      )}
    </div>
  );
}

function CornerBrackets() {
  const bracket = 'absolute w-8 h-8 border-cyan-500/40 pointer-events-none';
  return (
    <>
      <div className={`${bracket} top-0 left-0 border-l-2 border-t-2`} />
      <div className={`${bracket} top-0 right-0 border-r-2 border-t-2`} />
      <div className={`${bracket} bottom-0 left-0 border-l-2 border-b-2`} />
      <div className={`${bracket} bottom-0 right-0 border-r-2 border-b-2`} />
    </>
  );
}

function OrbitalRings() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.12]">
      <motion.svg
        viewBox="0 0 1000 1000"
        className="absolute w-[90vmin] h-[90vmin]"
        animate={{ rotate: -360 }}
        transition={{ duration: 200, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="500" cy="500" r="480" fill="none" stroke="rgba(0,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 16" />
        <circle cx="500" cy="500" r="460" fill="none" stroke="rgba(0,255,255,0.08)" strokeWidth="0.5" />
      </motion.svg>

      <motion.svg
        viewBox="0 0 800 800"
        className="absolute w-[70vmin] h-[70vmin]"
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="400" cy="400" r="300" fill="none" stroke="rgba(0,255,255,0.15)" strokeWidth="0.5" strokeDasharray="4 12" />
        <path d="M 152 252 A 350 350 0 0 1 648 252" fill="none" stroke="rgba(0,255,255,0.2)" strokeWidth="2" strokeDasharray="10 8" />
        <path d="M 152 548 A 350 350 0 0 0 648 548" fill="none" stroke="rgba(0,255,255,0.2)" strokeWidth="2" strokeDasharray="10 8" />
      </motion.svg>

      <motion.svg
        viewBox="0 0 800 800"
        className="absolute w-[50vmin] h-[50vmin]"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="400" cy="400" r="250" fill="none" stroke="rgba(0,200,255,0.3)" strokeWidth="1" strokeDasharray="20 40 10 40" />
      </motion.svg>

      <svg viewBox="0 0 200 200" className="absolute w-[15vmin] h-[15vmin] opacity-40">
        <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(0,255,255,0.2)" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="3" fill="rgba(0,255,255,0.8)" />
        <path d="M 100 30 L 100 80 M 100 120 L 100 170 M 30 100 L 80 100 M 120 100 L 170 100" stroke="rgba(0,255,255,0.15)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

const TERMINAL_LOGS = [
  'INIT.SECURE_HANDSHAKE......[OK]',
  'SYNC_ORBITAL_CACHE.........[OK]',
  'BYPASSING_FIREWALL_NODE_4..[DONE]',
  'Decrypting cluster payload...',
  'WARN: Unauthorized probe detected.',
  'Rerouting connection to proxy server...',
  'ESTABLISHED SECURE DATALINK',
  'AWAITING_COMMAND_INPUT.....',
];

const CONSOLE_STORAGE_KEY = 'taas-hud-console';

function AdvancedTerminal({ onOpenApp }: { onOpenApp: (app: OSAppDefinition) => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSOLE_STORAGE_KEY);
      if (raw) {
        const { pos, exp } = JSON.parse(raw);
        if (pos) setPosition(pos);
        if (typeof exp === 'boolean') setExpanded(exp);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CONSOLE_STORAGE_KEY, JSON.stringify({ pos: position, exp: expanded }));
  }, [position, expanded]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < TERMINAL_LOGS.length) {
        const idx = currentIndex;
        setLogs((prev) => [...prev, TERMINAL_LOGS[idx]]);
        currentIndex++;
      } else if (Math.random() > 0.7) {
        const fakeIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1.${Math.floor(Math.random() * 255)}`;
        const fakeHex = Math.random().toString(16).substring(2, 10).toUpperCase();
        const memPct = Math.floor(40 + Math.random() * 40);
        const uplinkPct = Math.floor(85 + Math.random() * 15);
        const messages = [
          `> PING ${fakeIP} ... ACK`,
          `> MEM_DUMP [0x${fakeHex}]`,
          `> SCANNING SECTOR 7... CLEAR`,
          `> UPLINK SYNC... ${uplinkPct}%`,
          `> ANOMALY DETECTED IN QUADRANT 4`,
          `> SYS_STAT MEM:${memPct}% CPU:${Math.floor(10 + Math.random() * 20)}% NET:${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`,
        ];
        setLogs((prev) => {
          const newLogs = [...prev, messages[Math.floor(Math.random() * messages.length)]];
          return newLogs.length > 25 ? newLogs.slice(-25) : newLogs;
        });
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const handleCommand = useCallback(
    (cmd: string) => {
      const parts = cmd.trim().toLowerCase().split(/\s+/);
      const action = parts[0];
      if (action === 'help') {
        setLogs((p) => [
          ...p,
          '> COMMANDS: help | status | open <app>',
          '> APPS: dashboard, files, telegram, tasks, notes, automations, job-tracker, contacts, analytics, vault, settings',
        ]);
      } else if (action === 'status') {
        const mem = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        const memStr = mem ? `${Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100)}%` : 'N/A';
        setLogs((p) => [
          ...p,
          `> SYS_STAT MEM:${memStr} CPU:N/A NET:${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`,
          `> UPLINK: ACTIVE | CONN: SECURE`,
        ]);
      } else if (action === 'open' && parts[1]) {
        const appName = parts.slice(1).join('-');
        const app = APP_REGISTRY.find((a) => a.name.toLowerCase().replace(/\s/g, '-') === appName || a.id === appName);
        if (app) {
          onOpenApp(app);
          setLogs((p) => [...p, `> LAUNCHING ${app.name.toUpperCase()}... [OK]`]);
        } else {
          setLogs((p) => [...p, `> UNKNOWN APP: ${parts.slice(1).join(' ')}`]);
        }
      } else if (cmd.trim()) {
        setLogs((p) => [...p, `> UNKNOWN COMMAND: ${cmd.trim()}`]);
      }
    },
    [onOpenApp]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const line = input.trim();
        if (line) {
          setLogs((p) => [...p, `ROOT@TAAS:~# ${line}`]);
          handleCommand(line);
          setInput('');
        }
      }
    },
    [input, handleCommand]
  );

  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      setDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [position]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, dragStart]);

  const w = expanded ? 380 : 300;
  const h = expanded ? 320 : 192;

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <motion.div
      className="absolute z-[50] border border-cyan-500/40 p-px font-mono text-[11px] overflow-hidden flex flex-col hud-breathe pointer-events-auto select-text"
      style={{
        left: position.x,
        top: position.y === 0 ? undefined : position.y,
        bottom: position.y === 0 ? 96 : undefined,
        width: w,
        height: h,
        background: 'rgba(3,8,14,0.92)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 0 24px rgba(0,255,255,0.08), inset 0 1px 0 rgba(0,255,255,0.1)',
      }}
      initial={false}
      animate={{ width: w, height: h }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        e.stopPropagation();
        focusInput();
      }}
    >
      <div
        className="h-5 border-b border-cyan-500/30 flex items-center justify-between px-2 shrink-0 cursor-move select-none"
        style={{ background: 'rgba(0,255,255,0.05)' }}
        onMouseDown={handleHeaderMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <Shield className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
          <span className="font-bold tracking-[0.15em] uppercase" style={{ color: '#67e8f9', fontSize: '8px' }}>
            SYS_CONSOLE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-1.5 py-0.5 text-[8px] uppercase hover:bg-cyan-500/20 transition-colors"
            style={{ color: '#67e8f9' }}
          >
            {expanded ? '–' : '+'}
          </button>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-pulse" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-2 overflow-auto flex flex-col justify-end space-y-0.5 min-h-0 cursor-text"
        onClick={(e) => {
          e.stopPropagation();
          focusInput();
        }}
      >
        {logs.map((log, i) => {
          if (!log) return null;
          const isWarn = log.includes('WARN') || log.includes('ANOMALY') || log.includes('UNKNOWN');
          return (
            <motion.p
              key={`${i}-${log}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ color: isWarn ? '#fbbf24' : '#22d3ee', textShadow: isWarn ? '0 0 6px rgba(251,191,36,0.4)' : undefined }}
            >
              {log.startsWith('>') || log.startsWith('ROOT') ? log : `SYS> ${log}`}
            </motion.p>
          );
        })}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span style={{ color: '#a5f3fc' }}>ROOT@TAAS:~#</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none font-mono text-[11px] placeholder-cyan-500/40"
            style={{ color: '#22d3ee', caretColor: '#22d3ee' }}
            placeholder="help | status | open &lt;app&gt;"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="w-1.5 h-3.5 inline-block animate-[pulse_1s_step-end_infinite] shrink-0" style={{ background: '#22d3ee' }} />
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-cyan-500/50" />
      <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-cyan-500/50" />
    </motion.div>
  );
}

export function HUDDesktop({ isDesktop = true }: { isDesktop?: boolean }) {
  const navigate = useNavigate();
  const { openApp, closeStartMenu } = useOSStore();
  const { enabledPlugins } = usePluginsStore();
  const { play } = useHUDSounds();
  const { menu: iconMenu, hideContextMenu: hideIconMenu, handleIconRightClick } = useDesktopIconContextMenu();

  const enabledPluginIds = enabledPlugins.map((p) => p.id);
  const visibleApps = APP_REGISTRY.filter(
    (app) => app.isSystem || !app.pluginId || enabledPluginIds.includes(app.pluginId)
  );

  const handleOpenApp = useCallback(
    (app: OSAppDefinition) => {
      play('open');
      openApp(app.id, app.route, app.name);
      navigate(app.route);
      closeStartMenu();
    },
    [openApp, navigate, closeStartMenu, play]
  );

  return (
    <div
      className="absolute inset-x-0 top-0 bottom-12 overflow-hidden select-none font-tech"
      style={{ background: '#030810' }}
      onClick={() => closeStartMenu()}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)]" />

      <CornerBrackets />
      <OrbitalRings />
      <PointCloudGlobe />
      {isDesktop && <AdvancedTerminal onOpenApp={(app) => handleOpenApp(app)} />}

      {/* Corner status panels */}
      <CornerStatusPanels />
      <CornerClockPanel />

      {/* Quick stats strip */}
      <QuickStatsStrip onOpenApp={(app) => handleOpenApp(app)} />

      {/* Vertical data line decoration */}
      <div className="absolute top-1/4 right-6 w-px h-48 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute top-1/3 left-1/4 w-32 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />

      {/* App Tray - horizontal dock at bottom center, above taskbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 px-3 py-2 pointer-events-auto max-w-[90vw] overflow-x-auto scrollbar-none"
        style={{
          background: 'rgba(3,8,14,0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,255,255,0.2)',
          boxShadow: '0 0 30px rgba(0,0,0,0.4), 0 0 20px rgba(0,255,255,0.05)',
        }}
      >
        {visibleApps.map((app, idx) => (
          <HUDAppTrayIcon
            key={app.id}
            app={app}
            index={idx}
            onOpen={() => handleOpenApp(app)}
            onContextMenu={(e) => handleIconRightClick(e, app.id, app.route, app.name)}
          />
        ))}
      </div>

      {/* Subtle scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none z-0"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.15), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      <ContextMenuOverlay menu={iconMenu} onClose={hideIconMenu} />
    </div>
  );
}

function HUDAppTrayIcon({ app, index, onOpen, onContextMenu }: { app: OSAppDefinition; index: number; onOpen: () => void; onContextMenu?: (e: React.MouseEvent) => void }) {
  const Icon = app.icon;
  const { play } = useHUDSounds();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
      onDoubleClick={(e) => { e.stopPropagation(); onOpen(); }}
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(e); }}
      onMouseEnter={() => play('hover')}
      className="group flex flex-col items-center gap-1 p-2 rounded transition-all cursor-pointer"
      style={{
        background: 'transparent',
        minWidth: 48,
      }}
      title={app.name}
    >
      <div
        className="w-9 h-9 flex items-center justify-center rounded transition-all group-hover:scale-110"
        style={{
          background: 'rgba(0,255,255,0.05)',
          border: '1px solid rgba(0,255,255,0.15)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <Icon
          className="w-4 h-4 transition-all group-hover:drop-shadow-[0_0_10px_currentColor]"
          style={{ color: app.color }}
        />
      </div>
      <span
        className="text-[8px] font-mono font-bold tracking-wider truncate max-w-[60px] text-center"
        style={{ color: 'rgba(0,255,255,0.7)' }}
      >
        {app.name}
      </span>
    </motion.button>
  );
}
