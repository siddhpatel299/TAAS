import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Card with optional folded corner
interface CardProps {
    children: ReactNode;
    className?: string;
    folded?: boolean;
}

export function OrigamiCard({ children, className, folded }: CardProps) {
    return (
        <div className={cn("origami-card", folded && "origami-card-folded", className)}>
            {children}
        </div>
    );
}

// Button
interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function OrigamiButton({ children, variant = 'secondary', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = {
        primary: 'origami-btn-primary',
        secondary: 'origami-btn-secondary',
        ghost: 'origami-btn-ghost',
        danger: 'origami-btn-danger',
    }[variant];

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={cn("origami-btn", variantClass, className)}>
            {children}
        </button>
    );
}

// Badge
interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'terracotta' | 'sage' | 'slate' | 'warning';
}

export function OrigamiBadge({ children, variant = 'default' }: BadgeProps) {
    const variantClass = {
        default: 'origami-badge-default',
        terracotta: 'origami-badge-terracotta',
        sage: 'origami-badge-sage',
        slate: 'origami-badge-slate',
        warning: 'origami-badge-warning',
    }[variant];

    return <span className={cn("origami-badge", variantClass)}>{children}</span>;
}

// Stat
interface StatProps {
    value: string | number;
    label: string;
}

export function OrigamiStat({ value, label }: StatProps) {
    return (
        <div className="origami-stat">
            <div className="origami-stat-value">{value}</div>
            <div className="origami-stat-label">{label}</div>
        </div>
    );
}

// File Row
interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function OrigamiFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("origami-file-row", selected && "bg-[var(--origami-bg)]")} onClick={onClick}>
            <div className="origami-file-icon">{icon}</div>
            <div className="origami-file-info">
                <div className="origami-file-name">{name}</div>
                {meta && <div className="origami-file-meta">{meta}</div>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

// Empty State
interface EmptyProps {
    icon: ReactNode;
    text: string;
    action?: ReactNode;
}

export function OrigamiEmpty({ icon, text, action }: EmptyProps) {
    return (
        <div className="origami-empty">
            <div className="origami-empty-icon">{icon}</div>
            <p className="origami-empty-text">{text}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// Header
interface HeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function OrigamiHeader({ title, subtitle, actions }: HeaderProps) {
    return (
        <div className="origami-header">
            <div>
                <h1 className="origami-title">{title}</h1>
                {subtitle && <p className="origami-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}

// Input
interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: ReactNode;
    className?: string;
    type?: string;
}

export function OrigamiInput({ value, onChange, placeholder, icon, className, type = 'text' }: InputProps) {
    return (
        <div className={cn("relative", className)}>
            {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--origami-text-muted)]">{icon}</div>}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn("origami-input", icon && "pl-12")}
            />
        </div>
    );
}

// Table
interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function OrigamiTable({ headers, children }: TableProps) {
    return (
        <table className="origami-table">
            <thead>
                <tr>
                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
}

// Modal
interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function OrigamiModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;

    return (
        <div className="origami-modal-overlay" onClick={onClose}>
            <div className="origami-modal" onClick={(e) => e.stopPropagation()}>
                <div className="origami-modal-header">
                    <h2 className="origami-modal-title">{title}</h2>
                </div>
                <div className="origami-modal-body">{children}</div>
                {footer && <div className="origami-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

// Action Card
interface ActionCardProps {
    icon: ReactNode;
    title: string;
    description?: string;
    onClick?: () => void;
}

export function OrigamiActionCard({ icon, title, description, onClick }: ActionCardProps) {
    return (
        <div className="origami-action-card" onClick={onClick}>
            <div className="origami-action-icon">{icon}</div>
            <div>
                <div className="font-medium text-[var(--origami-text)]">{title}</div>
                {description && <div className="text-sm text-[var(--origami-text-dim)]">{description}</div>}
            </div>
        </div>
    );
}
