import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function ExecCard({ children, className, onClick }: CardProps) {
    return <div className={cn("exec-card", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function ExecButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'exec-btn-primary' : variant === 'ghost' ? 'exec-btn-ghost' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("exec-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function ExecInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("exec-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function ExecStat({ value, label }: StatProps) {
    return (
        <div className="exec-stat">
            <div className="exec-stat-value">{value}</div>
            <div className="exec-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'gold' | 'burgundy' | 'navy' | 'green';
}

export function ExecBadge({ children, color = 'gold' }: BadgeProps) {
    const colorClass = color !== 'gold' ? `exec-badge-${color}` : '';
    return <span className={cn("exec-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function ExecFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("exec-file-row", selected && "bg-[rgba(201,164,86,0.05)]")} onClick={onClick}>
            <div className="text-[var(--exec-gold)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate">{name}</p>
                {meta && <p className="text-sm text-[var(--exec-text-muted)]">{meta}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
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

export function ExecModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="exec-modal-overlay" onClick={onClose}>
            <div className="exec-modal" onClick={(e) => e.stopPropagation()}>
                <div className="exec-modal-header">{title}</div>
                <div className="exec-modal-body">{children}</div>
                {footer && <div className="exec-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function ExecEmpty({ text }: { text: string }) {
    return <div className="exec-empty"><p>{text}</p></div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function ExecTable({ headers, children }: TableProps) {
    return (
        <table className="exec-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function ExecTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
    return (
        <div className="mb-10">
            <h1 className="exec-title">{children}</h1>
            {subtitle && <p className="exec-subtitle">{subtitle}</p>}
        </div>
    );
}

export function ExecDivider() {
    return <div className="exec-divider" />;
}
