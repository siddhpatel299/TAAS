import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    color?: 'white' | 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
    onClick?: () => void;
}

export function BrutalistCard({ children, className, color = 'white', onClick }: CardProps) {
    const colorClass = color !== 'white' ? `brutalist-card-${color}` : '';
    return <div className={cn("brutalist-card", colorClass, onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    color?: 'white' | 'yellow' | 'pink' | 'blue' | 'green' | 'red';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function BrutalistButton({ children, color = 'white', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const colorClass = color !== 'white' ? `brutalist-btn-${color}` : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("brutalist-btn", colorClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function BrutalistInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("brutalist-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
    color?: 'white' | 'yellow' | 'pink' | 'blue' | 'green';
}

export function BrutalistStat({ value, label, color = 'white' }: StatProps) {
    const colorClass = color !== 'white' ? `brutalist-card-${color}` : '';
    return (
        <div className={cn("brutalist-card brutalist-stat", colorClass)}>
            <div className="brutalist-stat-value">{value}</div>
            <div className="brutalist-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'white' | 'yellow' | 'pink' | 'blue' | 'green' | 'red';
}

export function BrutalistBadge({ children, color = 'white' }: BadgeProps) {
    const colorClass = color !== 'white' ? `brutalist-badge-${color}` : '';
    return <span className={cn("brutalist-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function BrutalistFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("brutalist-file-row", selected && "!bg-[var(--brutalist-pink)]")} onClick={onClick}>
            <div className="text-xl">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{name}</p>
                {meta && <p className="text-sm opacity-70">{meta}</p>}
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

export function BrutalistModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="brutalist-modal-overlay" onClick={onClose}>
            <div className="brutalist-modal" onClick={(e) => e.stopPropagation()}>
                <div className="brutalist-modal-header"><h2 className="brutalist-modal-title">{title}</h2></div>
                <div className="brutalist-modal-body">{children}</div>
                {footer && <div className="brutalist-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    text: string;
    icon?: ReactNode;
}

export function BrutalistEmpty({ text, icon }: EmptyProps) {
    return (
        <div className="brutalist-empty">
            {icon && <div className="text-4xl mb-4">{icon}</div>}
            <p className="font-semibold uppercase">{text}</p>
        </div>
    );
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function BrutalistTable({ headers, children }: TableProps) {
    return (
        <table className="brutalist-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

interface TitleProps {
    children: ReactNode;
}

export function BrutalistTitle({ children }: TitleProps) {
    return <h1 className="brutalist-title">{children}</h1>;
}
