import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
    children: ReactNode;
    title?: string;
    className?: string;
    onClick?: () => void;
}

export function SteamPanel({ children, title, className, onClick }: PanelProps) {
    return (
        <div className={cn("steam-panel", onClick && "cursor-pointer", className)} onClick={onClick}>
            {title && <div className="steam-panel-header">{title}</div>}
            <div className="steam-panel-body">{children}</div>
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

export function SteamButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'steam-btn-primary' : variant === 'danger' ? 'steam-btn-danger' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("steam-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function SteamInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("steam-input", className)} />;
}

interface GaugeProps {
    value: string | number;
    label: string;
}

export function SteamGauge({ value, label }: GaugeProps) {
    return (
        <div className="steam-gauge">
            <div className="steam-gauge-value">{value}</div>
            <div className="steam-gauge-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    color?: 'default' | 'brass' | 'copper' | 'rust';
}

export function SteamBadge({ children, color = 'default' }: BadgeProps) {
    const colorClass = color !== 'default' ? `steam-badge-${color}` : '';
    return <span className={cn("steam-badge", colorClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function SteamFileRow({ icon, name, meta, actions, onClick, selected }: FileRowProps) {
    return (
        <div className={cn("steam-file-row", selected && "bg-[rgba(184,134,11,0.15)]")} onClick={onClick}>
            <div className="text-[var(--steam-brass)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate">{name}</p>
                {meta && <p className="text-sm text-[var(--steam-text-muted)]">{meta}</p>}
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

export function SteamModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="steam-modal-overlay" onClick={onClose}>
            <div className="steam-modal" onClick={(e) => e.stopPropagation()}>
                <div className="steam-modal-header">{title}</div>
                <div className="steam-modal-body">{children}</div>
                {footer && <div className="steam-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    icon?: string;
    text: string;
}

export function SteamEmpty({ icon = '⚙', text }: EmptyProps) {
    return (
        <div className="steam-empty">
            <div className="steam-empty-icon">{icon}</div>
            <p>{text}</p>
        </div>
    );
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function SteamTable({ headers, children }: TableProps) {
    return (
        <table className="steam-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function SteamTitle({ children }: { children: ReactNode }) {
    return <h1 className="steam-title">{children}</h1>;
}

export function SteamDivider() {
    return <div className="steam-divider" />;
}
