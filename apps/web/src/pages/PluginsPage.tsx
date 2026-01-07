import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Puzzle,
  Check,
  Plus,
  Briefcase,
  DollarSign,
  FileText,
  Sparkles,
  ArrowRight,
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
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { usePluginsStore } from '@/stores/plugins.store';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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

// Category colors
const categoryColors: Record<string, { bg: string; text: string; gradient: string }> = {
  'productivity': { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-500 to-indigo-600' },
  'finance': { bg: 'bg-green-100', text: 'text-green-700', gradient: 'from-green-500 to-emerald-600' },
  'security': { bg: 'bg-red-100', text: 'text-red-700', gradient: 'from-red-500 to-rose-600' },
  'lifestyle': { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-500 to-fuchsia-600' },
  'development': { bg: 'bg-orange-100', text: 'text-orange-700', gradient: 'from-orange-500 to-amber-600' },
  'education': { bg: 'bg-cyan-100', text: 'text-cyan-700', gradient: 'from-cyan-500 to-teal-600' },
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

  const handleOpenPlugin = (pluginId: string) => {
    if (pluginId === 'job-tracker') {
      navigate('/plugins/job-tracker');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />
      
      <main className="ml-20 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Plugins</h1>
          </div>
          <p className="text-gray-500 ml-13">
            Extend TAAS with powerful productivity tools. All data stays in your Telegram storage.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">How Plugins Work</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Plugins add new features to TAAS without requiring external storage. 
                All files are stored in your Telegram account through TAAS's secure upload system. 
                Plugins only store references (IDs) to your files, never the files themselves.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-xl transition-all",
                  selectedCategory === category.id
                    ? "bg-purple-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-purple-600"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Plugin Grid */}
        {isLoading && availablePlugins.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => {
              const IconComponent = pluginIcons[plugin.icon] || Puzzle;
              const isEnabled = plugin.enabled;
              const isActionLoading = actionLoading === plugin.id;
              const categoryStyle = categoryColors[plugin.category] || categoryColors['productivity'];

              return (
                <motion.div
                  key={plugin.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  className={cn(
                    "bg-white rounded-2xl border overflow-hidden transition-all",
                    isEnabled ? "border-green-200 ring-2 ring-green-100" : "border-gray-200"
                  )}
                >
                  {/* Plugin Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        isEnabled 
                          ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                          : `bg-gradient-to-br ${categoryStyle.gradient}`
                      )}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full capitalize",
                          categoryStyle.bg, categoryStyle.text
                        )}>
                          {plugin.category}
                        </span>
                        {isEnabled && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Enabled
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {plugin.name}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                      {plugin.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2">
                      {plugin.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plugin.features.length > 3 && (
                        <p className="text-sm text-gray-400">
                          +{plugin.features.length - 3} more features
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Plugin Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                    {isEnabled ? (
                      <>
                        <button
                          onClick={() => handleOpenPlugin(plugin.id)}
                          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                          Open
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePlugin(plugin.id, true)}
                          disabled={isActionLoading}
                          className="py-2.5 px-4 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          {isActionLoading ? 'Disabling...' : 'Disable'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleTogglePlugin(plugin.id, false)}
                        disabled={isActionLoading}
                        className={cn(
                          "w-full py-2.5 px-4 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                          `bg-gradient-to-r ${categoryStyle.gradient} hover:opacity-90`
                        )}
                      >
                        {isActionLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Enabling...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Enable Plugin
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Suggest Plugin Card - only show when not filtering */}
            {selectedCategory === 'all' && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400 mb-2">Suggest a Plugin</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Have an idea for a new plugin? Let us know and we'll build it!
                </p>
              </motion.div>
            )}

            {/* No Results */}
            {filteredPlugins.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No plugins found</h3>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="mt-4 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
