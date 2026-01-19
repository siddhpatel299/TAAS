import { cn } from '@/lib/utils';

// ===== Forest Card =====
interface ForestCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export function ForestCard({ children, className, hover = true, onClick }: ForestCardProps) {
    return (
        <div
            className={cn(
                "forest-card",
                !hover && "hover:transform-none hover:shadow-[var(--forest-shadow-sm)]",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// ===== Forest Button =====
interface ForestButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'primary' | 'wood' | 'icon';
    children: React.ReactNode;
}

export function ForestButton({ variant = 'default', children, className, ...props }: ForestButtonProps) {
    return (
        <button
            className={cn(
                "forest-btn",
                variant === 'primary' && "forest-btn-primary",
                variant === 'wood' && "forest-btn-wood",
                variant === 'icon' && "forest-btn-icon",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

// ===== Forest Badge =====
interface ForestBadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'wood';
    className?: string;
}

export function ForestBadge({ children, variant = 'default', className }: ForestBadgeProps) {
    return (
        <span
            className={cn(
                "forest-badge",
                variant === 'success' && "forest-badge-success",
                variant === 'warning' && "forest-badge-warning",
                variant === 'danger' && "forest-badge-danger",
                variant === 'wood' && "forest-badge-wood",
                className
            )}
        >
            {children}
        </span>
    );
}

// ===== Forest Stat Card =====
interface ForestStatCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    className?: string;
}

export function ForestStatCard({ label, value, icon, className }: ForestStatCardProps) {
    return (
        <div className={cn("forest-stat-card", className)}>
            {icon && <div className="forest-stat-icon">{icon}</div>}
            <div>
                <div className="forest-stat-value">{value}</div>
                <div className="forest-stat-label">{label}</div>
            </div>
        </div>
    );
}

// ===== Forest Progress Ring =====
interface ForestProgressRingProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    sublabel?: string;
    className?: string;
}

export function ForestProgressRing({
    value,
    max = 100,
    size = 100,
    strokeWidth = 8,
    label,
    sublabel,
    className,
}: ForestProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percent = Math.min(value / max, 1);
    const offset = circumference - percent * circumference;

    return (
        <div className={cn("forest-progress-ring relative", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    className="ring-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="ring-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {label && <span className="forest-stat-value text-xl">{label}</span>}
                {sublabel && <span className="forest-stat-label text-xs">{sublabel}</span>}
            </div>
        </div>
    );
}

// ===== Forest Divider =====
export function ForestDivider({ className }: { className?: string }) {
    return <div className={cn("forest-divider", className)} />;
}

// ===== Forest Empty State =====
interface ForestEmptyProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function ForestEmpty({ icon, title, description, action, className }: ForestEmptyProps) {
    return (
        <div className={cn("forest-empty", className)}>
            <div className="forest-empty-icon">{icon}</div>
            <h3 className="forest-empty-title">{title}</h3>
            {description && <p className="forest-empty-text">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ===== Forest Page Header =====
interface ForestPageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function ForestPageHeader({ title, subtitle, icon, actions, className }: ForestPageHeaderProps) {
    return (
        <div className={cn("forest-page-header flex items-center justify-between", className)}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="w-12 h-12 rounded-xl bg-[rgba(74,124,89,0.1)] flex items-center justify-center text-[var(--forest-leaf)]">
                        {icon}
                    </div>
                )}
                <div>
                    <h1 className="forest-page-title">{title}</h1>
                    {subtitle && <p className="forest-page-subtitle">{subtitle}</p>}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
