import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Puzzle,
  Check,
  Briefcase,
  DollarSign,
  FileText,
  Shield,
  Bookmark,
  Target,
  Clock,
  Calendar,
  Users,
  CheckSquare,
  Code,
  Layers,
  Search,
  Sparkles,
  ArrowRight,
  Zap,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useOSStore } from '@/stores/os.store';
import { HUDAppLayout, HUDCard } from '@/components/hud';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { usePluginsStore } from '@/stores/plugins.store';
import type { Plugin } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { PluginSettingsModal } from '@/components/plugins/PluginSettingsModal';

// Icon mapping for plugins
const pluginIcons: Record<string, React.ElementType> = {
  'briefcase': Briefcase,
  'dollar-sign': DollarSign,
  'file-text': FileText,
  'shield': Shield,
  'bookmark': Bookmark,
  'target': Target,
  'clock': Clock,
  'calendar': Calendar,
  'users': Users,
  'check-square': CheckSquare,
  'code': Code,
  'layers': Layers,
};

// Enhanced Category colors with more vibrant gradients
const categoryStyles: Record<string, { bg: string; text: string; border: string; gradient: string; iconBg: string }> = {
  'productivity': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-200/50',
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-100'
  },
  'finance': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-200/50',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100'
  },
  'security': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600',
    border: 'border-rose-200/50',
    gradient: 'from-rose-500 to-red-600',
    iconBg: 'bg-rose-100'
  },
  'lifestyle': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600',
    border: 'border-violet-200/50',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100'
  },
  'development': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-200/50',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100'
  },
  'education': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600',
    border: 'border-cyan-200/50',
    gradient: 'from-cyan-500 to-sky-600',
    iconBg: 'bg-cyan-100'
  },
};

const categories = [
  { id: 'all', name: 'All Plugins' },
  { id: 'productivity', name: 'Productivity' },
  { id: 'finance', name: 'Finance' },
  { id: 'security', name: 'Security' },
  { id: 'lifestyle', name: 'Lifestyle' },
  { id: 'development', name: 'Development' },
  { id: 'education', name: 'Education' },
];

export function PluginsPage() {
  const navigate = useNavigate();
  const {
    availablePlugins,
    isLoading,
    error,
    fetchAvailablePlugins,
    enablePlugin,
    disablePlugin,
    clearError,
  } = usePluginsStore();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSettingsPlugin, setActiveSettingsPlugin] = useState<Plugin | null>(null);

  useEffect(() => {
    fetchAvailablePlugins();
  }, [fetchAvailablePlugins]);

  // Filter plugins
  const filteredPlugins = availablePlugins.filter(plugin => {
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTogglePlugin = async (pluginId: string, currentlyEnabled: boolean) => {
    setActionLoading(pluginId);
    try {
      if (currentlyEnabled) {
        await disablePlugin(pluginId);
      } else {
        await enablePlugin(pluginId);
      }
    } catch (err) {
      console.error('Failed to toggle plugin:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const osStyle = useOSStore((s) => s.osStyle);
  const isHUD = osStyle === 'hud';

  if (isHUD) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <HUDAppLayout
          title="PLUGINS"
          searchPlaceholder="Search apps..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn('hud-badge px-2 py-1 text-xs', selectedCategory === cat.id && 'ring-1 ring-cyan-400')}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading && filteredPlugins.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs tracking-widest" style={{ color: 'rgba(0,255,255,0.5)' }}>LOADING...</div>
              ) : (
                filteredPlugins.map((plugin) => {
                  const Icon = pluginIcons[plugin.icon as string] || Puzzle;
                  const isEnabled = !!plugin.enabled;
                  return (
                    <HUDCard key={plugin.id}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(0,255,255,0.15)' }}>
                            <Icon className="w-5 h-5" style={{ color: '#22d3ee' }} />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTogglePlugin(plugin.id, isEnabled)}
                            disabled={actionLoading === plugin.id}
                            className={cn('hud-badge px-2 py-1 text-xs', isEnabled && 'ring-1 ring-cyan-400')}
                          >
                            {isEnabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                        <h4 className="text-sm font-bold mb-1" style={{ color: '#67e8f9' }}>{plugin.name}</h4>
                        <p className="text-[10px] line-clamp-2 mb-3 opacity-70" style={{ color: 'rgba(0,255,255,0.8)' }}>{plugin.description}</p>
                        <button
                          type="button"
                          onClick={() => navigate(`/plugins/${plugin.id}`)}
                          className="hud-btn hud-btn-primary w-full px-3 py-1.5 text-xs"
                        >
                          OPEN
                        </button>
                      </div>
                    </HUDCard>
                  );
                })
              )}
            </div>
          </div>
        </HUDAppLayout>
        {activeSettingsPlugin && (
          <PluginSettingsModal
            isOpen={!!activeSettingsPlugin}
            plugin={activeSettingsPlugin}
            onClose={() => setActiveSettingsPlugin(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl opacity-50 -translate-y-1/2 -translate-x-1/3" />
      </div>

      <ModernSidebar />

      <main className="ml-20 relative z-10">
        {/* Hero Section */}
        <div className="pt-12 px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold tracking-wide uppercase">
                  App Store
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
                Supercharge your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  Productivity
                </span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                Unlock powerful features with our curated collection of plugins.
                Everything runs securely within your encrypted storage.
              </p>
            </motion.div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="p-4 bg-red-50/50 backdrop-blur-sm border border-red-200 rounded-xl text-red-700 flex items-center justify-between shadow-sm">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {error}
                    </span>
                    <button onClick={clearError} className="text-sm font-medium hover:underline">
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-4 z-50 mb-10"
            >
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-slate-200/50 rounded-2xl p-2 flex flex-col md:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white/50 transition-colors"
                  />
                </div>

                {/* Categories */}
                <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 px-2 no-scrollbar">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                        selectedCategory === category.id
                          ? "bg-slate-900 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {isLoading && availablePlugins.length === 0 ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/60 rounded-3xl h-80 animate-pulse" />
                  ))
                ) : (
                  <>
                    {/* Subscription Tracker - Special Card */}
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4 }}
                      className="group relative bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 ring-1 ring-slate-900/5 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                            <DollarSign className="w-7 h-7" />
                          </div>
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                            Featured
                          </span>
                        </div>

                        <div className="mb-auto">
                          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                            Subscriptions
                          </h3>
                          <p className="text-slate-500 text-sm leading-relaxed">
                            Track expenses and get phone call reminders before renewals.
                          </p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <button
                            onClick={() => navigate('/plugins/subscription-tracker')}
                            className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 group-hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-900/10"
                          >
                            Launch App
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    {filteredPlugins.map((plugin) => {
                      const IconComponent = pluginIcons[plugin.icon] || Puzzle;
                      const style = categoryStyles[plugin.category] || categoryStyles['productivity'];
                      const isEnabled = plugin.enabled;
                      const isActionLoading = actionLoading === plugin.id;

                      return (
                        <motion.div
                          layout
                          key={plugin.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ y: -4 }}
                          className={cn(
                            "group relative bg-white/70 backdrop-blur-xl border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full",
                            isEnabled
                              ? "border-green-200/50 ring-1 ring-green-500/10 hover:shadow-green-500/10"
                              : "border-white/50 ring-1 ring-slate-900/5 hover:shadow-slate-500/10"
                          )}
                        >
                          {/* Hover Gradient */}
                          <div className={cn(
                            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none",
                            style.bg
                          )} />

                          <div className="relative z-10 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm text-white",
                                `bg-gradient-to-br ${style.gradient}`
                              )}>
                                <IconComponent className="w-7 h-7" />
                              </div>

                              {isEnabled && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100/80 text-green-700 text-xs font-medium border border-green-200/50">
                                  <Check className="w-3 h-3" />
                                  <span>Active</span>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="mb-auto">
                              <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                                {plugin.name}
                              </h3>
                              <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                                {plugin.description}
                              </p>
                            </div>

                            {/* Features Preview */}
                            <div className="mt-6 mb-6 space-y-2">
                              {plugin.features.slice(0, 2).map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                                  <div className={cn("w-1 h-1 rounded-full", style.text.replace('text-', 'bg-'))} />
                                  <span className="truncate">{feature}</span>
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="pt-5 border-t border-slate-100/80 flex gap-3">
                              {isEnabled ? (
                                <>
                                  <button
                                    onClick={() => navigate(`/plugins/${plugin.id}`)}
                                    className="flex-1 py-2.5 px-4 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                                  >
                                    Open
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setActiveSettingsPlugin(plugin)}
                                    className="w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                                    title="Settings"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleTogglePlugin(plugin.id, true)}
                                    disabled={isActionLoading}
                                    className="w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                                    title="Disable Plugin"
                                  >
                                    <Zap className="w-4 h-4 fill-current" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleTogglePlugin(plugin.id, false)}
                                  disabled={isActionLoading}
                                  className={cn(
                                    "w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200",
                                    "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                                    "group-hover:bg-slate-900 group-hover:text-white group-hover:border-transparent group-hover:shadow-lg"
                                  )}
                                >
                                  {isActionLoading ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <span>Enable Plugin</span>
                                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Suggestion Card */}
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group relative border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[320px] hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-300"
                    >
                      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-white group-hover:shadow-sm">
                        <Sparkles className="w-6 h-6 text-slate-400 group-hover:text-purple-500 transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Have an idea?
                      </h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-[200px]">
                        We're always looking for new ways to improve your workflow.
                      </p>
                      <button className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:text-purple-600 hover:border-purple-200 transition-colors shadow-sm">
                        Suggest a Plugin
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {!isLoading && filteredPlugins.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No plugins found</h3>
                <p className="text-slate-500 mb-6">We couldn't find any plugins matching your criteria.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}

            <PluginSettingsModal
              isOpen={!!activeSettingsPlugin}
              onClose={() => setActiveSettingsPlugin(null)}
              plugin={activeSettingsPlugin}
            />

          </div>
        </div>
      </main>
    </div>
  );
}
