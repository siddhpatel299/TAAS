import { useState } from 'react';
import { 
  Clock, 
  Shield, 
  AlertTriangle,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import { useSyncStore } from '../stores/sync-store';
import { DEFAULT_SYNC_SETTINGS } from '../../../../shared/types';

export function SettingsPanel() {
  const { settings, updateSettings } = useSyncStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setLocalSettings({ ...localSettings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateSettings(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SYNC_SETTINGS);
    setHasChanges(true);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Sync Settings</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-1.5 bg-telegram-blue text-white rounded-lg hover:bg-telegram-dark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Timing Settings */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-telegram-blue" />
          <h3 className="text-lg font-medium text-white">Upload Timing</h3>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium mb-1">Why delays matter</p>
              <p className="text-yellow-300/80">
                Uploads are intentionally delayed to mimic normal human usage patterns. 
                This prevents Telegram from flagging your account for automation-like behavior.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Minimum Delay (seconds)
              </label>
              <input
                type="number"
                min={10}
                max={300}
                value={localSettings.minUploadDelay}
                onChange={(e) => handleChange('minUploadDelay', parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-telegram-blue"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum wait time after a file change
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Maximum Delay (seconds)
              </label>
              <input
                type="number"
                min={30}
                max={600}
                value={localSettings.maxUploadDelay}
                onChange={(e) => handleChange('maxUploadDelay', parseInt(e.target.value) || 120)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-telegram-blue"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum wait time before upload starts
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Jitter Factor: {Math.round(localSettings.jitterFactor * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={50}
              value={localSettings.jitterFactor * 100}
              onChange={(e) => handleChange('jitterFactor', parseInt(e.target.value) / 100)}
              className="w-full accent-telegram-blue"
            />
            <p className="text-xs text-gray-500 mt-1">
              Random variation added to delays for more natural timing
            </p>
          </div>
        </div>
      </section>

      {/* Error Handling */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-telegram-blue" />
          <h3 className="text-lg font-medium text-white">Error Handling</h3>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Pause on Error</p>
              <p className="text-xs text-gray-500 mt-1">
                Stop all uploads when an error occurs
              </p>
            </div>
            <button
              onClick={() => handleChange('pauseOnError', !localSettings.pauseOnError)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.pauseOnError ? 'bg-telegram-blue' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  localSettings.pauseOnError ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Max Retries
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={localSettings.maxRetries}
              onChange={(e) => handleChange('maxRetries', parseInt(e.target.value) || 3)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-telegram-blue"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of times to retry a failed upload
            </p>
          </div>
        </div>
      </section>

      {/* Security Settings */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-telegram-blue" />
          <h3 className="text-lg font-medium text-white">Security</h3>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex gap-3">
            <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-200">
              <p className="font-medium mb-1">End-to-End Encryption</p>
              <p className="text-green-300/80">
                All files are encrypted locally with AES-256-GCM before upload. 
                Your encryption keys never leave this device.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-300 mb-2">Max File Size</p>
            <p className="text-xs text-gray-500">
              {(localSettings.maxFileSize / (1024 * 1024 * 1024)).toFixed(1)} GB 
              (Telegram limit: 2 GB)
            </p>
          </div>
        </div>
      </section>

      {/* Ignored Patterns */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium text-white">Ignored Files</h3>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-3">
            Files matching these patterns will not be synced:
          </p>
          <div className="flex flex-wrap gap-2">
            {localSettings.ignoredPatterns.map((pattern, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded font-mono"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
