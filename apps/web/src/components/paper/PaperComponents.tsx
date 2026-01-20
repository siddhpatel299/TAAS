import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function PaperCard({ children, className, onClick }: CardProps) {
    return <div className={cn("paper-card", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface StickyProps {
    children: ReactNode;
    color?: 'yellow' | 'pink' | 'blue' | 'green' | 'orange';
    className?: string;
    onClick?: () => void;
}

export function PaperSticky({ children, color = 'yellow', className, onClick }: StickyProps) {
    return <div className={cn("paper-sticky", `paper-sticky-${color}`, onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function PaperButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'paper-btn-primary' : variant === 'ghost' ? 'paper-btn-ghost' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("paper-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function PaperInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("paper-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function PaperStat({ value, label }: StatProps) {
    return (
        <div className="paper-stat">
            <div className="paper-stat-value">{value}</div>
            <div className="paper-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'red' | 'blue' | 'green';
}

export function PaperBadge({ children, color = 'red' }: BadgeProps) {
    const colorClass = color !== 'red' ? `paper-badge-${color}` : '';
    return <span className={cn("paper-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function PaperFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("paper-file-row", selected && "bg-[var(--paper-cream)]")} onClick={onClick}>
            <div className="text-[var(--ink-blue)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate">{name}</p>
                {meta && <p className="text-sm text-[var(--ink-blue)]">{meta}</p>}
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

export function PaperModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="paper-modal-overlay" onClick={onClose}>
            <div className="paper-modal" onClick={(e) => e.stopPropagation()}>
                <div className="paper-modal-header">{title}</div>
                {children}
                {footer && <div className="paper-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function PaperEmpty({ text }: { text: string }) {
    return <div className="paper-empty"><p>{text}</p></div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function PaperTable({ headers, children }: TableProps) {
    return (
        <table className="paper-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function PaperTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
    return (
        <div className="mb-8">
            <h1 className="paper-title">{children}</h1>
            {subtitle && <p className="paper-subtitle">{subtitle}</p>}
        </div>
    );
}

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function PaperCheckbox({ checked, onChange }: CheckboxProps) {
    return <div className={cn("paper-checkbox", checked && "checked")} onClick={() => onChange(!checked)} />;
}
