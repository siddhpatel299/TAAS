import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function PixelCard({ children, className, onClick }: CardProps) {
    return <div className={cn("pixel-card", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function PixelButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'pixel-btn-primary' : variant === 'ghost' ? 'pixel-btn-ghost' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("pixel-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function PixelInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("pixel-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function PixelStat({ value, label }: StatProps) {
    return (
        <div className="pixel-stat">
            <div className="pixel-stat-value">{value}</div>
            <div className="pixel-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'blue' | 'red' | 'green' | 'yellow' | 'pink' | 'orange';
}

export function PixelBadge({ children, color = 'blue' }: BadgeProps) {
    const colorClass = color !== 'blue' ? `pixel-badge-${color}` : '';
    return <span className={cn("pixel-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function PixelFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("pixel-file-row", selected && "bg-[rgba(41,173,255,0.15)]")} onClick={onClick}>
            <div className="text-[var(--pixel-cyan)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate">{name}</p>
                {meta && <p className="text-sm text-[var(--pixel-text-dim)]">{meta}</p>}
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

export function PixelModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="pixel-modal-overlay" onClick={onClose}>
            <div className="pixel-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pixel-modal-header">{title}</div>
                <div className="pixel-modal-body">{children}</div>
                {footer && <div className="pixel-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function PixelEmpty({ text }: { text: string }) {
    return <div className="pixel-empty"><p>&gt; {text}</p></div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function PixelTable({ headers, children }: TableProps) {
    return (
        <table className="pixel-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function PixelTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
    return (
        <div className="mb-8">
            <h1 className="pixel-title">{children}</h1>
            {subtitle && <p className="pixel-subtitle">&gt; {subtitle}</p>}
        </div>
    );
}

interface HealthBarProps {
    value: number;
    max: number;
}

export function PixelHealthBar({ value, max }: HealthBarProps) {
    const percentage = (value / max) * 100;
    const fillClass = percentage <= 25 ? 'danger' : percentage <= 50 ? 'warning' : '';
    return (
        <div className="pixel-health-bar">
            <div className={cn("pixel-health-fill", fillClass)} style={{ width: `${percentage}%` }} />
        </div>
    );
}

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function PixelCheckbox({ checked, onChange }: CheckboxProps) {
    return <div className={cn("pixel-checkbox", checked && "checked")} onClick={() => onChange(!checked)} />;
}
