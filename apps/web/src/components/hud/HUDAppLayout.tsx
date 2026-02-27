import { ReactNode } from 'react';
import { HUDAppHeader } from './HUDAppHeader';

interface HUDAppLayoutProps {
  title: string;
  children: ReactNode;
  /** Optional back navigation - when provided, shows back arrow/button */
  backHref?: string;
  /** Optional back label (e.g. "DASHBOARD") */
  backLabel?: string;
  /** Optional search placeholder - when provided, renders search input */
  searchPlaceholder?: string;
  /** Optional search value - controlled */
  searchValue?: string;
  /** Optional search onChange */
  onSearchChange?: (value: string) => void;
  /** Optional search submit (e.g. on Enter) */
  onSearchSubmit?: () => void;
  /** Optional right-side actions (e.g. Upload, Add) */
  actions?: ReactNode;
}

export function HUDAppLayout({
  title,
  children,
  backHref,
  backLabel,
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  actions,
}: HUDAppLayoutProps) {
  return (
    <div className="flex flex-col h-full min-h-0 font-mono" style={{ fontFamily: 'var(--hud-font-tech)' }}>
      <HUDAppHeader
        title={title}
        backHref={backHref}
        backLabel={backLabel}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        actions={actions}
      />
      <div className="flex-1 overflow-auto p-4 min-h-0">
        {children}
      </div>
    </div>
  );
}
