import React from 'react';
import { cn } from '@/lib/utils';

// Card Component
interface MidnightCardProps {
    children: React.ReactNode;
    className?: string;
    gold?: boolean;
    onClick?: () => void;
}

export function MidnightCard({ children, className, gold, onClick }: MidnightCardProps) {
    return (
        <div onClick={onClick} className={cn("midnight-card", gold && "midnight-card-gold", onClick && "cursor-pointer", className)}>
            {children}
        </div>
    );
}

// Button Component
interface MidnightButtonProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'ghost' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function MidnightButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: MidnightButtonProps) {
    const variants = {
        default: 'midnight-btn-default',
        primary: 'midnight-btn-primary',
        ghost: 'midnight-btn-ghost',
        danger: 'midnight-btn-danger',
    };

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={cn("midnight-btn", variants[variant], disabled && "opacity-50 cursor-not-allowed", className)}>
            {children}
        </button>
    );
}

// Badge Component
interface MidnightBadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'gold' | 'success' | 'warning' | 'error';
    className?: string;
}

export function MidnightBadge({ children, variant = 'default', className }: MidnightBadgeProps) {
    const variants = {
        default: 'midnight-badge-default',
        gold: 'midnight-badge-gold',
        success: 'midnight-badge-success',
        warning: 'midnight-badge-warning',
        error: 'midnight-badge-error',
    };

    return <span className={cn("midnight-badge", variants[variant], className)}>{children}</span>;
}

// Stat Component
interface MidnightStatProps {
    value: string | number;
    label: string;
    className?: string;
}

export function MidnightStat({ value, label, className }: MidnightStatProps) {
    return (
        <div className={cn("midnight-stat", className)}>
            <div className="midnight-stat-value">{value}</div>
            <div className="midnight-stat-label">{label}</div>
        </div>
    );
}

// File Row Component
interface MidnightFileRowProps {
    icon: React.ReactNode;
    name: string;
    meta?: string;
    selected?: boolean;
    onClick?: () => void;
    actions?: React.ReactNode;
}

export function MidnightFileRow({ icon, name, meta, selected, onClick, actions }: MidnightFileRowProps) {
    return (
        <div onClick={onClick} className={cn("midnight-file-row", selected && "selected", onClick && "cursor-pointer")}>
            <div className="midnight-file-icon">{icon}</div>
            <div className="midnight-file-info">
                <div className="midnight-file-name">{name}</div>
                {meta && <div className="midnight-file-meta">{meta}</div>}
            </div>
            {actions && <div className="midnight-file-actions">{actions}</div>}
        </div>
    );
}

// Empty State Component
interface MidnightEmptyProps {
    icon: React.ReactNode;
    text: string;
    action?: React.ReactNode;
}

export function MidnightEmpty({ icon, text, action }: MidnightEmptyProps) {
    return (
        <div className="midnight-empty">
            <div className="midnight-empty-icon">{icon}</div>
            <p className="midnight-empty-text">{text}</p>
            {action}
        </div>
    );
}

// Header Component
interface MidnightHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function MidnightHeader({ title, subtitle, actions }: MidnightHeaderProps) {
    return (
        <div className="midnight-header">
            <div>
                <h1 className="midnight-title">{title}</h1>
                {subtitle && <p className="midnight-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}

// Input Component
interface MidnightInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    icon?: React.ReactNode;
    className?: string;
}

export function MidnightInput({ value, onChange, placeholder, type = 'text', icon, className }: MidnightInputProps) {
    if (icon) {
        return (
            <div className={cn("relative", className)}>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--midnight-text-dim)]">{icon}</span>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="midnight-input pl-11" />
            </div>
        );
    }
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("midnight-input", className)} />;
}

// Table Component
interface MidnightTableProps {
    headers: string[];
    children: React.ReactNode;
}

export function MidnightTable({ headers, children }: MidnightTableProps) {
    return (
        <table className="midnight-table">
            <thead>
                <tr>
                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
}

// Modal Component
interface MidnightModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function MidnightModal({ open, onClose, title, children, footer }: MidnightModalProps) {
    if (!open) return null;

    return (
        <div className="midnight-overlay" onClick={onClose}>
            <div className="midnight-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-6 text-[var(--midnight-text)]">{title}</h2>
                {children}
                {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
            </div>
        </div>
    );
}
