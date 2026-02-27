import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 50;

export interface HUDPaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export function HUDPaginationBar({
  currentPage,
  totalItems,
  pageSize = PAGE_SIZE,
  hasMore = false,
  onPageChange,
  className,
}: HUDPaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const showPrev = currentPage > 1;
  const showNext = currentPage < totalPages || hasMore;

  const btnStyle = {
    borderColor: 'rgba(0,255,255,0.25)',
    color: '#22d3ee',
    background: 'rgba(10,24,38,0.6)',
  };
  const disabledStyle = {
    borderColor: 'rgba(0,255,255,0.1)',
    color: 'rgba(0,255,255,0.3)',
    cursor: 'not-allowed' as const,
  };

  return (
    <div
      className={cn('flex items-center justify-between gap-4 flex-wrap', className)}
      style={{ fontFamily: 'var(--hud-font-mono)' }}
    >
      <p className="text-[10px] font-medium tracking-wider" style={{ color: 'rgba(0,255,255,0.7)' }}>
        SHOWING <span style={{ color: '#67e8f9' }}>{startItem}</span>
        {'–'}
        <span style={{ color: '#67e8f9' }}>{endItem}</span>
        {' OF '}
        <span style={{ color: '#67e8f9' }}>{totalItems}</span>
        {' APPLICATIONS'}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!showPrev}
          className="p-2 rounded-lg border transition-all hover:border-cyan-500/50 disabled:opacity-50"
          style={showPrev ? btnStyle : disabledStyle}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span
          className="px-3 py-1.5 text-[10px] font-bold tracking-wider"
          style={{ color: 'rgba(0,255,255,0.9)' }}
        >
          PAGE {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!showNext}
          className="p-2 rounded-lg border transition-all hover:border-cyan-500/50 disabled:opacity-50"
          style={showNext ? btnStyle : disabledStyle}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
