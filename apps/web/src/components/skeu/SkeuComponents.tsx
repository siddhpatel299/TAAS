import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function SkeuCard({ children, className, onClick }: CardProps) {
    return <div className={cn("skeu-card", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function SkeuButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'skeu-btn-primary' : variant === 'ghost' ? 'skeu-btn-ghost' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("skeu-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function SkeuInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("skeu-input", className)} />;
}

interface GaugeProps {
    value: string | number;
    label: string;
    color?: 'green' | 'blue' | 'orange' | 'purple';
}

export function SkeuGauge({ value, label, color = 'green' }: GaugeProps) {
    const colorVar = `var(--skeu-led-${color})`;
    return (
        <div className="skeu-gauge">
            <div className="skeu-gauge-value" style={{ color: colorVar, textShadow: `0 0 10px ${colorVar}` }}>{value}</div>
            <div className="skeu-gauge-label">{label}</div>
        </div>
    );
}

interface BatteryProps {
    value: number; // 0-100
    label?: string;
}

export function SkeuBattery({ value, label }: BatteryProps) {
    return (
        <div className="skeu-battery">
            {label && <span className="text-sm text-[var(--skeu-text-muted)]">{label}</span>}
            <div className="skeu-battery-bar">
                <div className="skeu-battery-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
            </div>
            <span className="text-sm font-semibold">{value}%</span>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'green' | 'blue' | 'orange' | 'red' | 'purple';
}

export function SkeuBadge({ children, color = 'green' }: BadgeProps) {
    const colorClass = color !== 'green' ? `skeu-badge-${color}` : '';
    return <span className={cn("skeu-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function SkeuFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("skeu-file-row", selected && "bg-[rgba(255,255,255,0.05)]")} onClick={onClick}>
            <div className="text-[var(--skeu-led-blue)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate">{name}</p>
                {meta && <p className="text-sm text-[var(--skeu-text-muted)]">{meta}</p>}
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

export function SkeuModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="skeu-modal-overlay" onClick={onClose}>
            <div className="skeu-modal" onClick={(e) => e.stopPropagation()}>
                <div className="skeu-modal-header">{title}</div>
                <div className="skeu-modal-body">{children}</div>
                {footer && <div className="skeu-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function SkeuEmpty({ text }: { text: string }) {
    return <div className="skeu-empty"><p>{text}</p></div>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function SkeuTable({ headers, children }: TableProps) {
    return (
        <table className="skeu-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function SkeuTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
    return (
        <div className="mb-8">
            <h1 className="skeu-title">{children}</h1>
            {subtitle && <p className="skeu-subtitle">{subtitle}</p>}
        </div>
    );
}

interface ToggleProps {
    active: boolean;
    onChange: (active: boolean) => void;
}

export function SkeuToggle({ active, onChange }: ToggleProps) {
    return <div className={cn("skeu-toggle", active && "active")} onClick={() => onChange(!active)} />;
}
