import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
    children: ReactNode;
    title?: string;
    count?: number | string;
    className?: string;
}

export function ArchiveSection({ children, title, count, className }: SectionProps) {
    return (
        <section className={cn("archive-section", className)}>
            {title && (
                <div className="archive-section-header">
                    <h2 className="archive-section-title">{title}</h2>
                    {count !== undefined && <span className="archive-section-count">{count} items</span>}
                </div>
            )}
            {children}
        </section>
    );
}

interface CardProps {
    children: ReactNode;
    featured?: boolean;
    className?: string;
    onClick?: () => void;
}

export function ArchiveCard({ children, featured, className, onClick }: CardProps) {
    return <div className={cn("archive-card", featured && "archive-card-featured", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function ArchiveButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'archive-btn-primary' : variant === 'ghost' ? 'archive-btn-ghost' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("archive-btn", variantClass, className)}>{children}</button>;
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}

export function ArchiveInput({ value, onChange, placeholder, className, type = 'text' }: InputProps) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("archive-input", className)} />;
}

interface StatProps {
    value: string | number;
    label: string;
}

export function ArchiveStat({ value, label }: StatProps) {
    return (
        <div className="archive-stat">
            <div className="archive-stat-value">{value}</div>
            <div className="archive-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'accent' | 'dark';
}

export function ArchiveBadge({ children, variant = 'default' }: BadgeProps) {
    const variantClass = variant === 'accent' ? 'archive-badge-accent' : variant === 'dark' ? 'archive-badge-dark' : '';
    return <span className={cn("archive-badge", variantClass)}>{children}</span>;
}

interface FileRowProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    index?: number;
}

export function ArchiveFileRow({ icon, name, meta, actions, onClick, index }: FileRowProps) {
    return (
        <div className="archive-file-row" onClick={onClick}>
            {index !== undefined && <span className="archive-file-row-number">{String(index + 1).padStart(2, '0')}</span>}
            <div className="text-[var(--archive-text-muted)]">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{name}</p>
                {meta && <p className="text-[var(--text-tiny)] text-[var(--archive-text-muted)] mt-0.5">{meta}</p>}
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

export function ArchiveModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="archive-modal-overlay" onClick={onClose}>
            <div className="archive-modal" onClick={(e) => e.stopPropagation()}>
                <div className="archive-modal-header">{title}</div>
                <div className="archive-modal-body">{children}</div>
                {footer && <div className="archive-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    title: string;
    text?: string;
}

export function ArchiveEmpty({ title, text }: EmptyProps) {
    return (
        <div className="archive-empty">
            <p className="archive-empty-title">{title}</p>
            {text && <p className="archive-empty-text">{text}</p>}
        </div>
    );
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function ArchiveTable({ headers, children }: TableProps) {
    return (
        <table className="archive-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}

export function ArchiveTitle({ children }: { children: ReactNode }) {
    return <h1 className="archive-title">{children}</h1>;
}

export function ArchiveHeadline({ children }: { children: ReactNode }) {
    return <h2 className="archive-headline">{children}</h2>;
}

export function ArchiveSubhead({ children }: { children: ReactNode }) {
    return <p className="archive-subhead">{children}</p>;
}

export function ArchiveBigNumber({ value }: { value: string | number }) {
    return <div className="archive-big-number">{value}</div>;
}
