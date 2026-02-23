import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 50;

export interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export function PaginationBar({
  currentPage,
  totalItems,
  pageSize = PAGE_SIZE,
  hasMore = false,
  onPageChange,
  className,
  variant = 'default',
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const showPrev = currentPage > 1;
  const showNext = currentPage < totalPages || hasMore;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        variant === 'compact' && 'flex-wrap',
        className
      )}
    >
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{startItem}</span>
        {'–'}
        <span className="font-medium text-gray-700">{endItem}</span>
        {' of '}
        <span className="font-medium text-gray-700">{totalItems}</span>
        {' applications'}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!showPrev}
          className={cn(
            'p-2 rounded-lg transition-colors',
            showPrev
              ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              : 'text-gray-300 cursor-not-allowed'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="px-3 py-1.5 text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!showNext}
          className={cn(
            'p-2 rounded-lg transition-colors',
            showNext
              ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              : 'text-gray-300 cursor-not-allowed'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
