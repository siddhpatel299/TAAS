import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Zap,
    Briefcase,
    CheckSquare,
    FileText,
    MessageSquare,
    Calendar,
    BarChart3,
    Lock,
    Sparkles,
    ChevronRight,
    Settings,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton } from '@/components/hud/HUDComponents';
import { cn } from '@/lib/utils';

interface Plugin {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    glowColor: string;
    route: string;
    status: 'active' | 'coming-soon' | 'beta';
}

const plugins: Plugin[] = [
    {
        id: 'job-tracker',
        name: 'Job Tracker',
        description: 'Track applications, interviews, and follow-ups',
        icon: Briefcase,
        color: 'cyan',
        glowColor: 'rgba(0, 255, 255, 0.5)',
        route: '/plugins/job-tracker',
        status: 'active',
    },
    {
        id: 'todo-lists',
        name: 'Todo Lists',
        description: 'Organize tasks with smart lists',
        icon: CheckSquare,
        color: 'green',
        glowColor: 'rgba(0, 255, 0, 0.5)',
        route: '/plugins/todo-lists',
        status: 'active',
    },
    {
        id: 'notes',
        name: 'Notes',
        description: 'Rich text notes with file attachments',
        icon: FileText,
        color: 'purple',
        glowColor: 'rgba(128, 0, 255, 0.5)',
        route: '/plugins/notes',
        status: 'active',
    },
    {
        id: 'chat',
        name: 'Team Chat',
        description: 'Real-time messaging for teams',
        icon: MessageSquare,
        color: 'blue',
        glowColor: 'rgba(0, 128, 255, 0.5)',
        route: '/plugins/chat',
        status: 'coming-soon',
    },
    {
        id: 'calendar',
        name: 'Calendar',
        description: 'Schedule events and deadlines',
        icon: Calendar,
        color: 'orange',
        glowColor: 'rgba(255, 128, 0, 0.5)',
        route: '/plugins/calendar',
        status: 'coming-soon',
    },
    {
        id: 'analytics',
        name: 'Analytics',
        description: 'Insights and usage statistics',
        icon: BarChart3,
        color: 'pink',
        glowColor: 'rgba(255, 0, 128, 0.5)',
        route: '/plugins/analytics',
        status: 'coming-soon',
    },
];

// Animated grid background
function GridBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />
            <motion.div
                className="absolute inset-0"
                animate={{
                    backgroundPosition: ['0 0', '40px 40px'],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                }}
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                }}
            />
        </div>
    );
}

// Plugin card with animations
function PluginCard({ plugin, index }: { plugin: Plugin; index: number }) {
    const Icon = plugin.icon;
    const isActive = plugin.status === 'active';

    const colorClasses = {
        cyan: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
        green: 'border-green-500/50 bg-green-500/10 text-green-400',
        purple: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
        blue: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
        orange: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
        pink: 'border-pink-500/50 bg-pink-500/10 text-pink-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
        >
            <Link to={isActive ? plugin.route : '#'}>
                <motion.div
                    whileHover={isActive ? { scale: 1.03, y: -5 } : {}}
                    whileTap={isActive ? { scale: 0.98 } : {}}
                    className={cn(
                        "relative p-6 rounded-2xl border backdrop-blur-sm transition-all cursor-pointer group overflow-hidden",
                        isActive
                            ? "border-cyan-500/30 bg-gradient-to-br from-gray-900/80 to-cyan-900/20 hover:border-cyan-400/50"
                            : "border-gray-700/30 bg-gray-900/50 opacity-60 cursor-not-allowed"
                    )}
                    style={isActive ? { boxShadow: `0 0 30px ${plugin.glowColor}` } : {}}
                >
                    {/* Scan line effect on hover */}
                    {isActive && (
                        <motion.div
                            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100"
                            initial={{ top: 0 }}
                            animate={{ top: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        />
                    )}

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                        {plugin.status === 'active' ? (
                            <motion.div
                                className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/50"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                <span className="text-xs text-green-400 font-mono">ONLINE</span>
                            </motion.div>
                        ) : plugin.status === 'beta' ? (
                            <span className="px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-xs text-yellow-400 font-mono">
                                BETA
                            </span>
                        ) : (
                            <span className="px-2 py-1 rounded-full bg-gray-500/20 border border-gray-500/50 text-xs text-gray-400 font-mono flex items-center gap-1">
                                <Lock className="w-3 h-3" /> LOCKED
                            </span>
                        )}
                    </div>

                    {/* Icon */}
                    <motion.div
                        className={cn("w-14 h-14 rounded-xl border flex items-center justify-center mb-4", colorClasses[plugin.color as keyof typeof colorClasses])}
                        whileHover={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        <Icon className="w-7 h-7" />
                    </motion.div>

                    {/* Info */}
                    <h3 className="text-lg font-semibold text-cyan-200 mb-1 group-hover:text-cyan-100 transition-colors">
                        {plugin.name}
                    </h3>
                    <p className="text-sm text-cyan-600 mb-4">{plugin.description}</p>

                    {/* Action */}
                    {isActive && (
                        <div className="flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                            <span className="text-sm font-medium">Launch</span>
                            <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </Link>
        </motion.div>
    );
}

export function HUDPluginsPage() {
    const [activeCount, setActiveCount] = useState(0);

    useEffect(() => {
        const count = plugins.filter(p => p.status === 'active').length;
        // Animate the counter
        let current = 0;
        const interval = setInterval(() => {
            if (current < count) {
                current++;
                setActiveCount(current);
            } else {
                clearInterval(interval);
            }
        }, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <HUDLayout>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                                scale: { duration: 2, repeat: Infinity },
                            }}
                        >
                            <Zap className="w-10 h-10 text-purple-400" style={{ filter: 'drop-shadow(0 0 10px rgba(128, 0, 255, 0.8))' }} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                                PLUGIN HUB
                            </h1>
                            <p className="text-cyan-600/70 mt-1 font-mono">
                                <span className="text-green-400">{activeCount}</span> / {plugins.length} modules active
                            </p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.5 }}
                    >
                        <HUDButton>
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                        </HUDButton>
                    </motion.div>
                </div>

                {/* Animated divider */}
                <motion.div
                    className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1 }}
                />
            </motion.div>

            {/* Stats bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <HUDPanel className="p-4">
                    <div className="flex items-center justify-around">
                        <div className="text-center">
                            <motion.div
                                className="text-2xl font-bold text-green-400 font-mono"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {activeCount}
                            </motion.div>
                            <div className="text-xs text-cyan-600 uppercase tracking-wider">Active</div>
                        </div>
                        <div className="w-[1px] h-10 bg-cyan-500/20" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400 font-mono">
                                {plugins.filter(p => p.status === 'beta').length}
                            </div>
                            <div className="text-xs text-cyan-600 uppercase tracking-wider">Beta</div>
                        </div>
                        <div className="w-[1px] h-10 bg-cyan-500/20" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-400 font-mono">
                                {plugins.filter(p => p.status === 'coming-soon').length}
                            </div>
                            <div className="text-xs text-cyan-600 uppercase tracking-wider">Coming Soon</div>
                        </div>
                    </div>
                </HUDPanel>
            </motion.div>

            {/* Plugin Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                <GridBackground />
                {plugins.map((plugin, index) => (
                    <PluginCard key={plugin.id} plugin={plugin} index={index} />
                ))}
            </div>

            {/* Coming soon teaser */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8"
            >
                <HUDPanel className="p-6 text-center border-dashed">
                    <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-cyan-300 mb-1">More Plugins Coming</h3>
                    <p className="text-sm text-cyan-600">
                        We're building more integrations. Check back soon!
                    </p>
                </HUDPanel>
            </motion.div>
        </HUDLayout>
    );
}
