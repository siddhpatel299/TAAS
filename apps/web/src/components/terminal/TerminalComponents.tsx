import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ===== Panel =====
interface TerminalPanelProps {
    children: ReactNode;
    title?: string;
    actions?: ReactNode;
    className?: string;
}

export function TerminalPanel({ children, title, actions, className }: TerminalPanelProps) {
    return (
        <div className={cn("terminal-panel", className)}>
            {(title || actions) && (
                <div className="terminal-panel-header">
                    {title && <div className="terminal-panel-title">{title}</div>}
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

// ===== Button =====
interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'primary' | 'success' | 'danger';
    children: ReactNode;
}

export function TerminalButton({ variant = 'default', className, children, ...props }: TerminalButtonProps) {
    return (
        <button
            className={cn(
                "terminal-btn",
                variant === 'primary' && "terminal-btn-primary",
                variant === 'success' && "terminal-btn-success",
                variant === 'danger' && "terminal-btn-danger",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

// ===== Badge =====
interface TerminalBadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    children: ReactNode;
    className?: string;
}

export function TerminalBadge({ variant = 'default', children, className }: TerminalBadgeProps) {
    return (
        <span className={cn(
            "terminal-badge",
            variant === 'success' && "terminal-badge-success",
            variant === 'warning' && "terminal-badge-warning",
            variant === 'danger' && "terminal-badge-danger",
            variant === 'info' && "terminal-badge-info",
            className
        )}>
            {children}
        </span>
    );
}

// ===== Stat =====
interface TerminalStatProps {
    label: string;
    value: string | number;
    className?: string;
}

export function TerminalStat({ label, value, className }: TerminalStatProps) {
    return (
        <div className={cn("terminal-stat", className)}>
            <div className="terminal-stat-value">{value}</div>
            <div className="terminal-stat-label">{label}</div>
        </div>
    );
}

// ===== File Row =====
interface TerminalFileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    selected?: boolean;
    onClick?: () => void;
    actions?: ReactNode;
}

export function TerminalFileRow({ icon, name, meta, selected, onClick, actions }: TerminalFileRowProps) {
    return (
        <div className={cn("terminal-file-row", selected && "selected")} onClick={onClick}>
            <div className="terminal-file-icon">{icon}</div>
            <div className="terminal-file-name">{name}</div>
            {meta && <div className="terminal-file-meta">{meta}</div>}
            {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
    );
}

// ===== Empty State =====
interface TerminalEmptyProps {
    icon: ReactNode;
    text: string;
    action?: ReactNode;
}

export function TerminalEmpty({ icon, text, action }: TerminalEmptyProps) {
    return (
        <div className="terminal-empty">
            <div className="terminal-empty-icon">{icon}</div>
            <div className="terminal-empty-text">{text}</div>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ===== Keyboard Shortcut =====
interface TerminalKbdProps {
    children: ReactNode;
}

export function TerminalKbd({ children }: TerminalKbdProps) {
    return <kbd className="terminal-kbd">{children}</kbd>;
}

// ===== Page Header =====
interface TerminalHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function TerminalHeader({ title, subtitle, actions }: TerminalHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--terminal-border)]">
            <div>
                <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--terminal-amber)]">{title}</h1>
                {subtitle && <p className="text-xs text-[var(--terminal-text-dim)] mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

// ===== Table =====
interface TerminalTableProps {
    headers: string[];
    children: ReactNode;
}

export function TerminalTable({ headers, children }: TerminalTableProps) {
    return (
        <table className="terminal-table">
            <thead>
                <tr>
                    {headers.map((header, i) => (
                        <th key={i}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
}
