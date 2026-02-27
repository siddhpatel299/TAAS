import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HUDDataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface HUDDataTableProps<T> {
  columns: HUDDataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function HUDDataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'NO DATA',
  className,
}: HUDDataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-lg', className)}>
      <table className="w-full text-left" style={{ fontFamily: 'var(--hud-font-mono)' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-3 py-2 text-[10px] font-bold tracking-[0.15em] uppercase', col.className)}
                style={{ color: 'rgba(0,255,255,0.9)', borderBottom: '1px solid rgba(0,255,255,0.3)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-xs tracking-widest"
                style={{ color: 'rgba(0,255,255,0.4)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-cyan-500/5 transition-colors"
                style={{ borderBottom: '1px solid rgba(0,255,255,0.12)' }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-3 py-2 text-xs', col.className)}
                    style={{ color: '#67e8f9' }}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
