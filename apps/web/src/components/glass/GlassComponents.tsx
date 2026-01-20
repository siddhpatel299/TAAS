import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    flat?: boolean;
}

export function GlassCard({ children, className, onClick, flat }: CardProps) {
    return (
        <div className={cn(flat ? "glass-card-flat" : "glass-card", onClick && "cursor-pointer", className)} onClick={onClick}>
            {children}
        </div>
    );
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function GlassButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'glass-btn-primary' : variant === 'danger' ? 'glass-btn-danger' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("glass-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function GlassInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("glass-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function GlassStat({ value, label }: StatProps) {
    return (
        <div className="glass-stat">
            <div className="glass-stat-value">{value}</div>
            <div className="glass-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'cyan' | 'pink' | 'purple';
}

export function GlassBadge({ children, color = 'cyan' }: BadgeProps) {
    const colorClass = color === 'pink' ? 'glass-badge-pink' : color === 'purple' ? 'glass-badge-purple' : '';
    return <span className={cn("glass-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function GlassFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("glass-file-row", selected && "bg-white/10")} onClick={onClick}>
            <div className="text-[var(--glass-accent)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{name}</p>
                {meta && <p className="text-sm text-[var(--glass-text-muted)]">{meta}</p>}
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

export function GlassModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="glass-modal-overlay" onClick={onClose}>
            <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                <div className="glass-modal-header"><h2 className="glass-modal-title">{title}</h2></div>
                <div className="glass-modal-body">{children}</div>
                {footer && <div className="glass-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    text: string;
    icon?: ReactNode;
}

export function GlassEmpty({ text, icon }: EmptyProps) {
    return (
        <div className="glass-empty">
            {icon && <div className="mb-4 text-[var(--glass-accent)] opacity-50">{icon}</div>}
            <p>{text}</p>
        </div>
    );
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function GlassTable({ headers, children }: TableProps) {
    return (
        <table className="glass-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function GlassTitle({ children }: { children: ReactNode }) {
    return <h1 className="glass-title">{children}</h1>;
}
