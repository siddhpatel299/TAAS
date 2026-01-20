import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
    children: ReactNode;
    header?: string;
    className?: string;
}

export function CRTPanel({ children, header, className }: PanelProps) {
    return (
        <div className={cn("crt-panel", className)}>
            {header && <div className="crt-panel-header">{header}</div>}
            {children}
        </div>
    );
}

interface BoxProps {
    children: ReactNode;
    header?: string;
    className?: string;
    onClick?: () => void;
}

export function CRTBox({ children, header, className, onClick }: BoxProps) {
    return (
        <div className={cn("crt-box", onClick && "cursor-pointer", className)} onClick={onClick}>
            {header && <div className="crt-box-header">{header}</div>}
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

export function CRTButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'crt-btn-primary' : variant === 'danger' ? 'crt-btn-danger' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("crt-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function CRTInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("crt-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function CRTStat({ value, label }: StatProps) {
    return (
        <div className="crt-stat">
            <div className="crt-stat-value">{value}</div>
            <div className="crt-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'green' | 'amber' | 'red' | 'blue';
}

export function CRTBadge({ children, color = 'green' }: BadgeProps) {
    const colorClass = color !== 'green' ? `crt-badge-${color}` : '';
    return <span className={cn("crt-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function CRTFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("crt-file-row", selected && "bg-[rgba(0,255,65,0.1)]")} onClick={onClick}>
            <div>{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate">{name}</p>
                {meta && <p className="text-[var(--crt-green-dim)] text-sm">{meta}</p>}
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

export function CRTModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="crt-modal-overlay" onClick={onClose}>
            <div className="crt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="crt-modal-header"><h2 className="crt-modal-title">{title}</h2></div>
                <div className="crt-modal-body">{children}</div>
                {footer && <div className="crt-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    text: string;
}

export function CRTEmpty({ text }: EmptyProps) {
    return <div className="crt-empty">&gt; {text}_</div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function CRTTable({ headers, children }: TableProps) {
    return (
        <table className="crt-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function CRTTitle({ children }: { children: ReactNode }) {
    return <h1 className="crt-title">&gt; {children}_</h1>;
}
