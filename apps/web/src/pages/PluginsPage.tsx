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
};

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

  useEffect(() => {
    fetchAvailablePlugins();
  }, [fetchAvailablePlugins]);

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
          className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl"
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

        {/* Plugin Grid */}
        {isLoading && availablePlugins.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlugins.map((plugin) => {
              const IconComponent = pluginIcons[plugin.icon] || Puzzle;
              const isEnabled = plugin.enabled;
              const isActionLoading = actionLoading === plugin.id;

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
                          : "bg-gradient-to-br from-purple-500 to-indigo-600"
                      )}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      {isEnabled && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Enabled
                        </span>
                      )}
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
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

            {/* Coming Soon Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center min-h-[300px]"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-4">
                <Puzzle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">More Coming Soon</h3>
              <p className="text-sm text-gray-400">
                Expense Tracker, Notes, and more plugins are in development.
              </p>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
