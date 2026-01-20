import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    glow?: boolean;
    className?: string;
    onClick?: () => void;
}

export function AuroraCard({ children, glow, className, onClick }: CardProps) {
    return <div className={cn("aurora-card", glow && "aurora-card-glow", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function AuroraButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'aurora-btn-primary' : variant === 'ghost' ? 'aurora-btn-ghost' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("aurora-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function AuroraInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("aurora-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function AuroraStat({ value, label }: StatProps) {
    return (
        <div className="aurora-stat">
            <div className="aurora-stat-value">{value}</div>
            <div className="aurora-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'default' | 'teal' | 'pink' | 'purple';
}

export function AuroraBadge({ children, color = 'default' }: BadgeProps) {
    const colorClass = color !== 'default' ? `aurora-badge-${color}` : '';
    return <span className={cn("aurora-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function AuroraFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("aurora-file-row", selected && "bg-[rgba(102,126,234,0.15)]")} onClick={onClick}>
            <div className="text-[var(--aurora-gradient-1)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate">{name}</p>
                {meta && <p className="text-sm text-[var(--aurora-text-muted)]">{meta}</p>}
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

export function AuroraModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="aurora-modal-overlay" onClick={onClose}>
            <div className="aurora-modal" onClick={(e) => e.stopPropagation()}>
                <div className="aurora-modal-header">{title}</div>
                <div className="aurora-modal-body">{children}</div>
                {footer && <div className="aurora-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function AuroraEmpty({ text }: { text: string }) {
    return <div className="aurora-empty"><p>{text}</p></div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function AuroraTable({ headers, children }: TableProps) {
    return (
        <table className="aurora-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function AuroraTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
    return (
        <div className="mb-8">
            <h1 className="aurora-title">{children}</h1>
            {subtitle && <p className="aurora-subtitle">{subtitle}</p>}
        </div>
    );
}
