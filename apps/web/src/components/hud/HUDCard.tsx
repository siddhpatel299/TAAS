import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HUDCardProps {
  children: ReactNode;
  className?: string;
  /** Optional left accent bar (like hud-stat-card) */
  accent?: boolean;
  /** Clickable card */
  onClick?: () => void;
}

export function HUDCard({ children, className, accent = false, onClick }: HUDCardProps) {
  return (
    <div
      className={cn(
        'hud-card relative overflow-hidden rounded-xl',
        onClick && 'cursor-pointer hover:border-cyan-500/50',
        className
      )}
      onClick={onClick}
      style={{
        background: 'linear-gradient(180deg, rgba(10, 24, 38, 0.6) 0%, rgba(6, 13, 22, 0.8) 100%)',
        border: '1px solid rgba(0,255,255,0.25)',
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.02), 0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {accent && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
          style={{ background: 'var(--hud-accent-bright)', boxShadow: '0 0 8px rgba(0,255,255,0.4)' }}
        />
      )}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-500/40 rounded-tl" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-500/40 rounded-br" />
      {children}
    </div>
  );
}
