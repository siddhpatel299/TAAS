import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { usePluginsStore } from '@/stores/plugins.store';
import { Puzzle, ArrowLeft, Hammer } from 'lucide-react';

export function PluginComingSoonPage() {
  const { pluginId } = useParams();
  const navigate = useNavigate();
  const { availablePlugins, fetchAvailablePlugins } = usePluginsStore();

  useEffect(() => {
    if (!availablePlugins.length) {
      fetchAvailablePlugins();
    }
  }, [availablePlugins.length, fetchAvailablePlugins]);

  const plugin = availablePlugins.find((p) => p.id === pluginId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />
      <main className="ml-20 p-10">
        <div className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-3xl shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center">
              <Puzzle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Plugin workspace</p>
              <h1 className="text-2xl font-bold text-gray-900">
                {plugin?.name || 'Plugin in progress'}
              </h1>
              <p className="text-sm text-gray-500">
                We're wiring this plugin up. In the meantime you can manage other plugins or track tasks below.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Not live yet</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                This plugin hasn't been shipped yet. We're prioritizing the To-Do Lists plugin first, then the rest of the set.
                If you need this sooner, let us know and we'll bump it up.
              </p>
              {plugin?.features && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {plugin.features.slice(0, 6).map((feature) => (
                    <span key={feature} className="px-3 py-1 text-xs rounded-full bg-white border border-gray-200 text-gray-600">
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/plugins')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Plugins
            </button>
            <button
              onClick={() => navigate('/plugins/todo-lists')}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-indigo-200"
            >
              Open To-Do Lists
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
