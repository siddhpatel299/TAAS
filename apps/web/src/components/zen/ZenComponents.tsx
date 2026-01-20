import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    minimal?: boolean;
    className?: string;
    onClick?: () => void;
}

export function ZenCard({ children, minimal, className, onClick }: CardProps) {
    return <div className={cn("zen-card", minimal && "zen-card-minimal", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function ZenButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'zen-btn-primary' : variant === 'ghost' ? 'zen-btn-ghost' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("zen-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function ZenInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("zen-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function ZenStat({ value, label }: StatProps) {
    return (
        <div className="zen-stat">
            <div className="zen-stat-value">{value}</div>
            <div className="zen-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'default' | 'accent' | 'sage' | 'sand';
}

export function ZenBadge({ children, color = 'default' }: BadgeProps) {
    const colorClass = color !== 'default' ? `zen-badge-${color}` : '';
    return <span className={cn("zen-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function ZenFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("zen-file-row", selected && "bg-[var(--zen-bg)]")} onClick={onClick}>
            <div className="text-[var(--zen-text-light)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate">{name}</p>
                {meta && <p className="text-sm text-[var(--zen-text-light)]">{meta}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function ZenModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="zen-modal-overlay" onClick={onClose}>
            <div className="zen-modal" onClick={(e) => e.stopPropagation()}>
                <div className="zen-modal-header">{title}</div>
                {children}
                {footer && <div className="zen-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function ZenEmpty({ text }: { text: string }) {
    return <div className="zen-empty"><p>{text}</p></div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function ZenTable({ headers, children }: TableProps) {
    return (
        <table className="zen-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function ZenTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
    return (
        <div className="mb-16">
            <h1 className="zen-title">{children}</h1>
            {subtitle && <p className="zen-subtitle">{subtitle}</p>}
        </div>
    );
}

export function ZenSection({ title, children }: { title?: string; children: ReactNode }) {
    return (
        <div className="zen-section">
            {title && <div className="zen-section-header">{title}</div>}
            {children}
        </div>
    );
}

export function ZenDivider() {
    return <div className="zen-divider" />;
}
