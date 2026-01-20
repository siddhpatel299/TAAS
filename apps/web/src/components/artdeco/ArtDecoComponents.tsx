import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function DecoCard({ children, className, onClick }: CardProps) {
    return <div className={cn("deco-card", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function DecoButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'deco-btn-primary' : variant === 'danger' ? 'deco-btn-danger' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("deco-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function DecoInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("deco-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function DecoStat({ value, label }: StatProps) {
    return (
        <div className="deco-stat">
            <div className="deco-stat-value">{value}</div>
            <div className="deco-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'gold' | 'sage' | 'rose' | 'navy';
}

export function DecoBadge({ children, color = 'gold' }: BadgeProps) {
    const colorClass = color !== 'gold' ? `deco-badge-${color}` : '';
    return <span className={cn("deco-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function DecoFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("deco-file-row", selected && "bg-[rgba(212,175,55,0.1)]")} onClick={onClick}>
            <div className="text-[var(--deco-gold)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{name}</p>
                {meta && <p className="text-sm text-[var(--deco-text-muted)]">{meta}</p>}
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

export function DecoModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="deco-modal-overlay" onClick={onClose}>
            <div className="deco-modal" onClick={(e) => e.stopPropagation()}>
                <div className="deco-modal-header"><h2 className="deco-modal-title">{title}</h2></div>
                <div className="deco-modal-body">{children}</div>
                {footer && <div className="deco-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    text: string;
}

export function DecoEmpty({ text }: EmptyProps) {
    return <div className="deco-empty">— {text} —</div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function DecoTable({ headers, children }: TableProps) {
    return (
        <table className="deco-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function DecoTitle({ children }: { children: ReactNode }) {
    return <h1 className="deco-title">{children}</h1>;
}

export function DecoDivider({ text }: { text?: string }) {
    return <div className="deco-divider">{text && <span>◆ {text} ◆</span>}</div>;
}
