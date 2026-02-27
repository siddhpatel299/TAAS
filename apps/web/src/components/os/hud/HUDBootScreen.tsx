import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cpu, Lock } from 'lucide-react';
import { useHUDSounds } from '@/hooks/useHUDSounds';

interface HUDBootScreenProps {
  onComplete: () => void;
}

export function HUDBootScreen({ onComplete }: HUDBootScreenProps) {
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [fadeOut, setFadeOut] = useState(false);
  const [phase, setPhase] = useState<'boot' | 'verify' | 'ready'>('boot');
  const { play } = useHUDSounds();

  useEffect(() => {
    const bootLines = [
      '> INIT SECURE BOOT PROTOCOL v3.1',
      '> LOADING DEFENSE CORE MODULES',
      '> CRYPTOGRAPHIC ENGINE......[ACTIVE]',
      '> NEURAL PROCESSOR..........[ONLINE]',
      '> FIREWALL MATRIX...........[ARMED]',
      '> ENCRYPTION LAYER..........[AES-256]',
      '> INTEGRITY VERIFICATION....[PASSED]',
      '> THREAT ASSESSMENT.........[CLEAR]',
      '> HUD INTERFACE.............[READY]',
    ];

    let lineIdx = 0;
    const lineInterval = setInterval(() => {
      if (lineIdx < bootLines.length) {
        const idx = lineIdx;
        setLines((prev) => [...prev, bootLines[idx]]);
        play('beep');
        lineIdx++;
      }
    }, 180);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    const verifyTimer = setTimeout(() => setPhase('verify'), 1200);
    const readyTimer = setTimeout(() => setPhase('ready'), 1800);

    const finishTimer = setTimeout(() => {
      play('boot');
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2200);

    return () => {
      clearInterval(lineInterval);
      clearInterval(progressInterval);
      clearTimeout(verifyTimer);
      clearTimeout(readyTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete, play]);

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col select-none overflow-hidden font-mono"
          style={{ background: '#020508' }}
        >
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />

          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-12 h-12 border-l-2 border-t-2 border-cyan-500/40" />
          <div className="absolute top-3 right-3 w-12 h-12 border-r-2 border-t-2 border-cyan-500/40" />
          <div className="absolute bottom-3 left-3 w-12 h-12 border-l-2 border-b-2 border-cyan-500/40" />
          <div className="absolute bottom-3 right-3 w-12 h-12 border-r-2 border-b-2 border-cyan-500/40" />

          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-px pointer-events-none z-50"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.2), transparent)' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />

          {/* Center */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <motion.div
                  className="w-16 h-16 border flex items-center justify-center"
                  style={{ borderColor: 'rgba(0,255,255,0.4)', background: 'rgba(0,255,255,0.03)' }}
                  animate={{ boxShadow: ['0 0 10px rgba(0,255,255,0.1)', '0 0 25px rgba(0,255,255,0.3)', '0 0 10px rgba(0,255,255,0.1)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Shield className="w-8 h-8" style={{ color: '#22d3ee' }} />
                </motion.div>
                <motion.div
                  className="absolute -bottom-1 -right-1"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Cpu className="w-4 h-4" style={{ color: '#f59e0b' }} />
                </motion.div>
              </div>

              <div className="text-center">
                <h1 className="text-xl font-bold tracking-[0.35em]" style={{ color: '#a5f3fc', textShadow: '0 0 20px rgba(0,255,255,0.3)' }}>
                  TAAS <span style={{ color: '#fbbf24' }}>HUD</span>
                </h1>
                <p className="text-[9px] tracking-[0.2em] mt-1" style={{ color: 'rgba(0,255,255,0.35)' }}>
                  CYBER DEFENSE INTERFACE
                </p>
              </div>
            </motion.div>

            {/* Boot log */}
            <div className="w-full max-w-sm h-28 overflow-hidden border p-2.5"
              style={{ borderColor: 'rgba(0,255,255,0.15)', background: 'rgba(0,5,10,0.6)' }}>
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] leading-relaxed"
                  style={{
                    color: line.includes('[ACTIVE]') || line.includes('[ONLINE]') || line.includes('[ARMED]')
                      ? '#34d399'
                      : line.includes('[READY]')
                        ? '#fbbf24'
                        : '#22d3ee',
                  }}
                >
                  {line}
                </motion.div>
              ))}
              <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
                style={{ color: '#22d3ee' }}>_</motion.span>
            </div>

            {/* Progress */}
            <div className="w-56">
              <div className="flex justify-between text-[9px] mb-1">
                <span style={{ color: 'rgba(0,255,255,0.4)' }}>
                  {phase === 'boot' ? 'LOADING MODULES' : phase === 'verify' ? 'VERIFYING INTEGRITY' : 'SYSTEM READY'}
                </span>
                <span style={{ color: '#22d3ee' }}>{progress}%</span>
              </div>
              <div className="h-1 overflow-hidden" style={{ background: 'rgba(0,255,255,0.08)' }}>
                <motion.div
                  className="h-full"
                  style={{ background: 'linear-gradient(90deg, #0891b2, #22d3ee)', boxShadow: '0 0 10px rgba(0,255,255,0.4)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            {/* Phase indicator */}
            <div className="flex gap-6 text-[9px]">
              {['INIT', 'VERIFY', 'READY'].map((label, i) => {
                const isActive = i === 0 ? phase !== 'boot' : i === 1 ? phase === 'ready' : false;
                const isCurrent = i === 0 ? phase === 'boot' : i === 1 ? phase === 'verify' : phase === 'ready';
                return (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 border" style={{
                      borderColor: isActive ? '#22d3ee' : isCurrent ? '#fbbf24' : 'rgba(0,255,255,0.2)',
                      background: isActive ? 'rgba(34,211,238,0.3)' : isCurrent ? 'rgba(251,191,36,0.2)' : 'transparent',
                      boxShadow: isActive ? '0 0 6px rgba(34,211,238,0.4)' : undefined,
                    }} />
                    <span style={{ color: isActive ? '#22d3ee' : isCurrent ? '#fbbf24' : 'rgba(0,255,255,0.25)', letterSpacing: '0.15em' }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom status */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[9px]" style={{ color: 'rgba(0,255,255,0.25)' }}>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span className="tracking-[0.12em]">ENCRYPTED</span>
            </div>
            <span>|</span>
            <span className="tracking-[0.12em]">SECURE CHANNEL</span>
            <span>|</span>
            <span className="tracking-[0.12em]">v3.1</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
