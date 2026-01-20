import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
    children: ReactNode;
    title?: string;
    className?: string;
    onClick?: () => void;
}

export function ComicPanel({ children, title, className, onClick }: PanelProps) {
    return (
        <div className={cn("comic-panel", className)} onClick={onClick}>
            {title && <div className="comic-panel-header">{title}</div>}
            <div className="comic-panel-body">{children}</div>
        </div>
    );
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'danger' | 'success';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function ComicButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'comic-btn-primary' : variant === 'danger' ? 'comic-btn-danger' : variant === 'success' ? 'comic-btn-success' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("comic-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function ComicInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("comic-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function ComicStat({ value, label }: StatProps) {
    return (
        <div className="comic-stat">
            <div className="comic-stat-value">{value}</div>
            <div className="comic-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'yellow' | 'blue' | 'red' | 'green';
}

export function ComicBadge({ children, color = 'yellow' }: BadgeProps) {
    const colorClass = color !== 'yellow' ? `comic-badge-${color}` : '';
    return <span className={cn("comic-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function ComicFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("comic-file-row", selected && "bg-[var(--comic-yellow)]")} onClick={onClick}>
            <div className="text-[var(--comic-blue)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate font-bold">{name}</p>
                {meta && <p className="text-sm text-[var(--comic-text-light)]">{meta}</p>}
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

export function ComicModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="comic-modal-overlay" onClick={onClose}>
            <div className="comic-modal" onClick={(e) => e.stopPropagation()}>
                <div className="comic-modal-header">{title}</div>
                <div className="comic-modal-body">{children}</div>
                {footer && <div className="comic-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    text: string;
}

export function ComicEmpty({ text }: EmptyProps) {
    return <div className="comic-empty">💥 {text} 💥</div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function ComicTable({ headers, children }: TableProps) {
    return (
        <table className="comic-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function ComicTitle({ children }: { children: ReactNode }) {
    return <h1 className="comic-title">{children}</h1>;
}

export function ComicBurst({ children }: { children: ReactNode }) {
    return <div className="comic-burst">{children}</div>;
}
