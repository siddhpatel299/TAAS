import { cn } from '@/lib/utils';

interface HUDPanelProps {
    children: React.ReactNode;
    className?: string;
    glow?: boolean;
    hover?: boolean;
    onClick?: () => void;
}

export function HUDPanel({ children, className, glow = false, hover = true, onClick }: HUDPanelProps) {
    return (
        <div
            className={cn(
                glow ? "hud-panel-glow" : "hud-panel",
                hover && "hover:border-[var(--hud-border-bright)] hover:shadow-[var(--hud-glow-sm)]",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

interface HUDStatCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: string;
        positive?: boolean;
    };
    className?: string;
}

export function HUDStatCard({ label, value, icon, trend, className }: HUDStatCardProps) {
    return (
        <div className={cn("hud-stat-card", className)}>
            <div className="flex items-start justify-between mb-4">
                <span className="hud-label">{label}</span>
                {icon && (
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                        {icon}
                    </div>
                )}
            </div>
            <div className="hud-value text-3xl mb-1">{value}</div>
            {trend && (
                <p className={cn(
                    "text-sm",
                    trend.positive ? "text-[var(--hud-success)]" : "text-[var(--hud-text-secondary)]"
                )}>
                    {trend.value}
                </p>
            )}
        </div>
    );
}

interface HUDProgressRingProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    sublabel?: string;
    className?: string;
}

export function HUDProgressRing({
    value,
    max = 100,
    size = 120,
    strokeWidth = 8,
    label,
    sublabel,
    className,
}: HUDProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percent = Math.min(value / max, 1);
    const offset = circumference - percent * circumference;

    return (
        <div className={cn("hud-progress-ring relative", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    className="progress-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="progress-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {label && <span className="hud-value text-xl">{label}</span>}
                {sublabel && <span className="hud-label text-xs">{sublabel}</span>}
            </div>
        </div>
    );
}

interface HUDDividerProps {
    className?: string;
}

export function HUDDivider({ className }: HUDDividerProps) {
    return <div className={cn("hud-divider", className)} />;
}

interface HUDButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'primary' | 'icon';
    children: React.ReactNode;
}

export function HUDButton({ variant = 'default', children, className, ...props }: HUDButtonProps) {
    return (
        <button
            className={cn(
                variant === 'default' && "hud-btn",
                variant === 'primary' && "hud-btn hud-btn-primary",
                variant === 'icon' && "hud-btn hud-btn-icon",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

interface HUDBadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}

export function HUDBadge({ children, variant = 'default', className }: HUDBadgeProps) {
    return (
        <span
            className={cn(
                "hud-badge",
                variant === 'success' && "hud-badge-success",
                variant === 'warning' && "hud-badge-warning",
                variant === 'danger' && "hud-badge-danger",
                className
            )}
        >
            {children}
        </span>
    );
}
