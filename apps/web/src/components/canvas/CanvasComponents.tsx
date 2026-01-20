import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WindowProps {
    children: ReactNode;
    title: string;
    icon?: ReactNode;
    className?: string;
    zLevel?: 'far' | 'mid' | 'close';
}

export function CanvasWindow({ children, title, icon, className, zLevel = 'mid' }: WindowProps) {
    const zClass = zLevel === 'far' ? 'canvas-z-far' : zLevel === 'close' ? 'canvas-z-close' : 'canvas-z-mid';
    return (
        <div className={cn("canvas-window", zClass, className)}>
            <div className="canvas-window-header">
                <div className="canvas-window-title">{icon}{title}</div>
                <div className="canvas-window-controls">
                    <span className="canvas-window-control close" />
                    <span className="canvas-window-control minimize" />
                    <span className="canvas-window-control maximize" />
                </div>
            </div>
            <div className="canvas-window-body">{children}</div>
        </div>
    );
}

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function CanvasCard({ children, className, onClick }: CardProps) {
    return <div className={cn("canvas-card", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function CanvasButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'canvas-btn-primary' : variant === 'danger' ? 'canvas-btn-danger' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("canvas-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function CanvasInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("canvas-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function CanvasStat({ value, label }: StatProps) {
    return (
        <div className="canvas-stat">
            <div className="canvas-stat-value">{value}</div>
            <div className="canvas-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'blue' | 'pink' | 'purple';
}

export function CanvasBadge({ children, color = 'blue' }: BadgeProps) {
    const colorClass = color === 'pink' ? 'canvas-badge-pink' : color === 'purple' ? 'canvas-badge-purple' : '';
    return <span className={cn("canvas-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function CanvasFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("canvas-file-row", selected && "bg-[var(--canvas-surface)]")} onClick={onClick}>
            <div className="text-[var(--canvas-accent)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{name}</p>
                {meta && <p className="text-sm text-[var(--canvas-text-muted)]">{meta}</p>}
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

export function CanvasModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="canvas-modal-overlay" onClick={onClose}>
            <div className="canvas-modal" onClick={(e) => e.stopPropagation()}>
                <div className="canvas-window-header"><div className="canvas-window-title">{title}</div></div>
                <div className="canvas-window-body">{children}</div>
                {footer && <div className="p-4 border-t border-[var(--canvas-border)] flex justify-end gap-3">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    text: string;
    icon?: ReactNode;
}

export function CanvasEmpty({ text, icon }: EmptyProps) {
    return (
        <div className="canvas-empty">
            {icon && <div className="mb-4 text-[var(--canvas-accent)] opacity-50">{icon}</div>}
            <p>{text}</p>
        </div>
    );
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function CanvasTable({ headers, children }: TableProps) {
    return (
        <table className="canvas-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function CanvasTitle({ children }: { children: ReactNode }) {
    return <h1 className="canvas-title">{children}</h1>;
}
