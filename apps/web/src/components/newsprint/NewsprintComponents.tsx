import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ArticleProps {
    children: ReactNode;
    className?: string;
    headline?: string;
    headlineSize?: 'normal' | 'large';
    byline?: string;
}

export function NewsprintArticle({ children, className, headline, headlineSize = 'normal', byline }: ArticleProps) {
    return (
        <article className={cn("newsprint-article", className)}>
            {headline && <h2 className={cn("newsprint-article-headline", headlineSize === 'large' && "newsprint-article-headline-large")}>{headline}</h2>}
            {byline && <div className="newsprint-article-byline">{byline}</div>}
            {children}
        </article>
    );
}

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function NewsprintCard({ children, className, onClick }: CardProps) {
    return <div className={cn("newsprint-article", onClick && "cursor-pointer", className)} onClick={onClick}>{children}</div>;
}

interface ButtonProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

export function NewsprintButton({ children, variant = 'default', onClick, disabled, className, type = 'button' }: ButtonProps) {
    const variantClass = variant === 'primary' ? 'newsprint-btn-primary' : variant === 'danger' ? 'newsprint-btn-danger' : '';
    return <button type={type} onClick={onClick} disabled={disabled} className={cn("newsprint-btn", variantClass, className)}>{children}</button>;
}

interface SectionProps {
    title: string;
    children: ReactNode;
}

export function NewsprintSection({ title, children }: SectionProps) {
    return (
        <section>
            <h3 className="newsprint-section">{title}</h3>
            {children}
        </section>
    );
}

interface StatProps {
    value: string | number;
    label: string;
}

export function NewsprintStat({ value, label }: StatProps) {
    return (
        <div className="newsprint-stat-box">
            <div className="newsprint-stat-value">{value}</div>
            <div className="newsprint-stat-label">{label}</div>
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'red' | 'blue';
}

export function NewsprintBadge({ children, variant = 'default' }: BadgeProps) {
    const variantClass = variant === 'red' ? 'newsprint-badge-red' : variant === 'blue' ? 'newsprint-badge-blue' : 'newsprint-badge-default';
    return <span className={cn("newsprint-badge", variantClass)}>{children}</span>;
}

interface FileItemProps {
    icon: ReactNode;
    name: string;
    meta?: string;
    actions?: ReactNode;
    onClick?: () => void;
    selected?: boolean;
}

export function NewsprintFileItem({ icon, name, meta, actions, onClick, selected }: FileItemProps) {
    return (
        <div className={cn("newsprint-file-item cursor-pointer", selected && "bg-[var(--newsprint-bg)]")} onClick={onClick}>
            <div className="newsprint-file-icon">{icon}</div>
            <div className="newsprint-file-name">{name}</div>
            {meta && <div className="newsprint-file-meta">{meta}</div>}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: ReactNode;
    className?: string;
    type?: string;
}

export function NewsprintInput({ value, onChange, placeholder, icon, className, type = 'text' }: InputProps) {
    return (
        <div className={cn("relative", className)}>
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--newsprint-ink-faded)]">{icon}</div>}
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn("newsprint-input", icon && "pl-10")} />
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

export function NewsprintModal({ open, onClose, title, children, footer }: ModalProps) {
    if (!open) return null;
    return (
        <div className="newsprint-modal-overlay" onClick={onClose}>
            <div className="newsprint-modal" onClick={(e) => e.stopPropagation()}>
                <div className="newsprint-modal-header"><h2 className="newsprint-modal-title">{title}</h2></div>
                <div className="newsprint-modal-body">{children}</div>
                {footer && <div className="newsprint-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface EmptyProps {
    text: string;
}

export function NewsprintEmpty({ text }: EmptyProps) {
    return <div className="newsprint-empty"><p className="newsprint-empty-text">{text}</p></div>;
}

interface PullQuoteProps {
    children: ReactNode;
}

export function NewsprintPullQuote({ children }: PullQuoteProps) {
    return <blockquote className="newsprint-pullquote">"{children}"</blockquote>;
}

interface TableProps {
    headers: string[];
    children: ReactNode;
}

export function NewsprintTable({ headers, children }: TableProps) {
    return (
        <table className="newsprint-table">
            <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    );
}
