import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HUDStatBlockProps {
  label: string;
  value: string | number | ReactNode;
  className?: string;
}

export function HUDStatBlock({ label, value, className }: HUDStatBlockProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span
        className="text-[10px] font-semibold tracking-[0.15em] uppercase"
        style={{ color: 'rgba(0,255,255,0.9)' }}
      >
        {label}
      </span>
      <span
        className="text-sm font-bold font-mono"
        style={{ color: '#e0f7fa', textShadow: '0 0 10px rgba(0,255,255,0.3)', fontFamily: 'var(--hud-font-mono)' }}
      >
        {value}
      </span>
    </div>
  );
}
