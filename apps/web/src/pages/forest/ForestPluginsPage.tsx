import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Puzzle, Briefcase, CheckSquare, FileText, ArrowRight, Leaf, Loader2 } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestBadge, ForestButton } from '@/components/forest/ForestComponents';
import { pluginsApi, Plugin } from '@/lib/plugins-api';

const PLUGIN_ICONS: Record<string, any> = {
    'job-tracker': Briefcase,
    'todo-lists': CheckSquare,
    'notes': FileText
};

const PLUGIN_PATHS: Record<string, string> = {
    'job-tracker': '/plugins/job-tracker',
    'todo-lists': '/plugins/todo-lists',
    'notes': '/plugins/notes'
};

export function ForestPluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPlugins = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await pluginsApi.getAvailable();
            // We only show the ones we supported in forest
            const supportedIds = ['job-tracker', 'todo-lists', 'notes'];
            setPlugins(response.data.data.filter(p => supportedIds.includes(p.id)));
        } catch (error) {
            console.error('Failed to load plugins:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPlugins();
    }, [loadPlugins]);

    const togglePlugin = async (pluginId: string, currentlyEnabled: boolean) => {
        try {
            if (currentlyEnabled) {
                await pluginsApi.disable(pluginId);
            } else {
                await pluginsApi.enable(pluginId);
            }
            await loadPlugins();
        } catch (error) {
            console.error('Failed to toggle plugin:', error);
        }
    };

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Plugins"
                subtitle="Extend your workspace with powerful tools"
                icon={<Puzzle className="w-6 h-6" />}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plugins.map((plugin, index) => {
                        const Icon = PLUGIN_ICONS[plugin.id] || Briefcase;
                        const isEnabled = plugin.enabled;
                        const path = PLUGIN_PATHS[plugin.id];

                        return (
                            <motion.div
                                key={plugin.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ForestCard className="relative overflow-hidden">
                                    <motion.div
                                        className="absolute -top-4 -right-4 w-16 h-16 opacity-10"
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 8, repeat: Infinity }}
                                    >
                                        <Leaf className="w-full h-full text-[var(--forest-leaf)]" />
                                    </motion.div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-[var(--forest-gradient-primary)] flex items-center justify-center text-white shadow-lg">
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-[var(--forest-moss)]">{plugin.name}</h3>
                                                {isEnabled && <ForestBadge variant="success">Active</ForestBadge>}
                                            </div>
                                            <p className="text-sm text-[var(--forest-wood)] mb-3">{plugin.description}</p>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {plugin.features?.slice(0, 3).map((feature) => (
                                                    <ForestBadge key={feature} variant="wood">{feature}</ForestBadge>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isEnabled ? (
                                                    <>
                                                        {path && (
                                                            <Link to={path}>
                                                                <ForestButton variant="primary">Open <ArrowRight className="w-4 h-4 ml-1" /></ForestButton>
                                                            </Link>
                                                        )}
                                                        <ForestButton onClick={() => togglePlugin(plugin.id, true)}>Disable</ForestButton>
                                                    </>
                                                ) : (
                                                    <ForestButton variant="primary" onClick={() => togglePlugin(plugin.id, false)}>Enable Plugin</ForestButton>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ForestCard>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </ForestLayout>
    );
}
