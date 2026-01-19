import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    corners?: boolean;
}

export function BlueprintCard({ children, className, corners }: CardProps) {
    return (
        <div className={cn("blueprint-card", corners && "blueprint-card-corners", className)}>
            {children}
        </div>
    );
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function BlueprintButton({ children, variant = 'secondary', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = {
        primary: 'blueprint-btn-primary',
        secondary: 'blueprint-btn-secondary',
        ghost: 'blueprint-btn-ghost',
        danger: 'blueprint-btn-danger',
    }[variant];

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={cn("blueprint-btn", variantClass, className)}>
            {children}
        </button>
    );
}

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'cyan' | 'green' | 'orange' | 'red';
}

export function BlueprintBadge({ children, variant = 'default' }: BadgeProps) {
    const variantClass = {
        default: 'blueprint-badge-default',
        cyan: 'blueprint-badge-cyan',
        green: 'blueprint-badge-green',
        orange: 'blueprint-badge-orange',
        red: 'blueprint-badge-red',
    }[variant];

    return <span className={cn("blueprint-badge", variantClass)}>{children}</span>;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function BlueprintStat({ value, label }: StatProps) {
    return (
        <div className="blueprint-stat">
            <div className="blueprint-stat-value">{value}</div>
            <div className="blueprint-stat-label">{label}</div>
        </div>
    );
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function BlueprintFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("blueprint-file-row cursor-pointer", selected && "bg-[rgba(0,150,199,0.1)]")} onClick={onClick}>
            <div className="blueprint-file-icon">{icon}</div>
            <div className="blueprint-file-info">
                <div className="blueprint-file-name">{name}</div>
                {meta && <div className="blueprint-file-meta">{meta}</div>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

interface EmptyProps {
    icon: ReactNode;
    text: string;
    action?: ReactNode;
}

export function BlueprintEmpty({ icon, text, action }: EmptyProps) {
    return (
        <div className="blueprint-empty">
            <div className="blueprint-empty-icon">{icon}</div>
            <p className="blueprint-empty-text">{text}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

interface HeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function BlueprintHeader({ title, subtitle, actions }: HeaderProps) {
    return (
        <div className="blueprint-header">
            <div>
                <h1 className="blueprint-title">{title}</h1>
                {subtitle && <p className="blueprint-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: ReactNode;
    className?: string;
    type?: string;
}

export function BlueprintInput({ value, onChange, placeholder, icon, className, type = 'text' }: InputProps) {
    return (
        <div className={cn("relative", className)}>
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--blueprint-text-muted)]">{icon}</div>}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn("blueprint-input", icon && "pl-10")}
            />
        </div>
    );
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function BlueprintTable({ headers, children }: TableProps) {
    return (
        <table className="blueprint-table">
            <thead>
                <tr>
                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
}

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function BlueprintModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;

    return (
        <div className="blueprint-modal-overlay" onClick={onClose}>
            <div className="blueprint-modal" onClick={(e) => e.stopPropagation()}>
                <div className="blueprint-modal-header">
                    <h2 className="blueprint-modal-title">{title}</h2>
                </div>
                <div className="blueprint-modal-body">{children}</div>
                {footer && <div className="blueprint-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}
