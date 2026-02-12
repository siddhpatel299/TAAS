import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings2,
  Key,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  FileText,
  Sparkles,
  Link,
  Unlink,
  Puzzle,
  Copy,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { jobTrackerApi, FullSettingsStatus } from '@/lib/plugins-api';

interface JobTrackerSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'api-keys' | 'email' | 'resume' | 'extension';

export function JobTrackerSettingsDialog({
  isOpen,
  onClose,
}: JobTrackerSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('api-keys');

  // API Keys
  const [serpApiKey, setSerpApiKey] = useState('');
  const [hunterApiKey, setHunterApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showSerpKey, setShowSerpKey] = useState(false);
  const [showHunterKey, setShowHunterKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  // Resume
  const [resumeText, setResumeText] = useState('');

  // Loading/Saving
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Full settings status
  const [settingsStatus, setSettingsStatus] = useState<FullSettingsStatus | null>(null);

  // Load current settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statusResponse, resumeResponse] = await Promise.all([
        jobTrackerApi.getFullSettings(),
        jobTrackerApi.getResume(),
      ]);
      setSettingsStatus(statusResponse.data.data);
      setResumeText(resumeResponse.data.data.resumeText || '');
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const promises: Promise<any>[] = [];

      // Save SERP and Hunter keys
      const keysToSave: { serpApiKey?: string; hunterApiKey?: string } = {};
      if (serpApiKey.trim()) keysToSave.serpApiKey = serpApiKey.trim();
      if (hunterApiKey.trim()) keysToSave.hunterApiKey = hunterApiKey.trim();

      if (Object.keys(keysToSave).length > 0) {
        promises.push(jobTrackerApi.saveApiKeys(keysToSave));
      }

      // Save OpenAI key separately
      if (openaiApiKey.trim()) {
        promises.push(jobTrackerApi.saveOpenaiKey(openaiApiKey.trim()));
      }

      if (promises.length === 0) {
        setError('Please enter at least one API key');
        setIsSaving(false);
        return;
      }

      await Promise.all(promises);

      // Clear inputs and reload status
      setSerpApiKey('');
      setHunterApiKey('');
      setOpenaiApiKey('');
      setSuccess('API keys saved successfully!');
      setTimeout(() => setSuccess(null), 3000);

      await loadSettings();
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to save settings';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveResume = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await jobTrackerApi.saveResume(resumeText);
      setSuccess('Resume saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await loadSettings();
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to save resume';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    setError(null);

    try {
      const response = await jobTrackerApi.getGmailAuthUrl();
      const authUrl = response.data.data.authUrl;

      // Open popup for OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'GMAIL_AUTH_SUCCESS' && event.data?.code) {
          try {
            await jobTrackerApi.connectGmail(event.data.code);
            setSuccess('Gmail connected successfully!');
            setTimeout(() => setSuccess(null), 3000);
            await loadSettings();
          } catch (err: any) {
            setError('Failed to connect Gmail');
          }
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setIsConnectingGmail(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed without completing auth
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setIsConnectingGmail(false);
        }
      }, 1000);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to start Gmail connection';
      setError(message);
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await jobTrackerApi.disconnectGmail();
      setSuccess('Gmail disconnected');
      setTimeout(() => setSuccess(null), 3000);
      await loadSettings();
    } catch (err: any) {
      setError('Failed to disconnect Gmail');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'api-keys' as TabType, label: 'API Keys', icon: Key },
    { id: 'email' as TabType, label: 'Email Setup', icon: Mail },
    { id: 'resume' as TabType, label: 'Resume', icon: FileText },
    { id: 'extension' as TabType, label: 'Extension', icon: Puzzle },
  ];

  const handleCopyToken = () => {
    const token = useAuthStore.getState().token;
    if (token) {
      navigator.clipboard.writeText(token);
      setSuccess('Access token copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('No access token found. Please log in again.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Job Tracker Settings</h2>
                <p className="text-sm text-gray-500">Configure APIs and email outreach</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-white text-sky-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto text-sky-500 animate-spin" />
                <p className="text-gray-500 mt-2">Loading settings...</p>
              </div>
            ) : (
              <>
                {/* API Keys Tab */}
                {activeTab === 'api-keys' && (
                  <div className="space-y-6">
                    {/* Current Status */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Current Status</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', settingsStatus?.hasSerpApiKey ? 'bg-green-500' : 'bg-gray-300')} />
                          <span className="text-sm text-gray-600">SERP API</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', settingsStatus?.hasHunterApiKey ? 'bg-green-500' : 'bg-gray-300')} />
                          <span className="text-sm text-gray-600">Hunter API</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', settingsStatus?.hasOpenaiApiKey ? 'bg-green-500' : 'bg-gray-300')} />
                          <span className="text-sm text-gray-600">OpenAI API</span>
                        </div>
                      </div>
                    </div>

                    {/* SERP API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SERP API Key <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type={showSerpKey ? 'text' : 'password'}
                          value={serpApiKey}
                          onChange={(e) => setSerpApiKey(e.target.value)}
                          placeholder={settingsStatus?.hasSerpApiKey ? `Current: ${settingsStatus.serpApiKeyMasked}` : 'Enter your SERP API key'}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSerpKey(!showSerpKey)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showSerpKey ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Find LinkedIn profiles via Google search.{' '}
                        <a href="https://serpapi.com/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                          Get a key <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>

                    {/* Hunter API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hunter API Key <span className="text-gray-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type={showHunterKey ? 'text' : 'password'}
                          value={hunterApiKey}
                          onChange={(e) => setHunterApiKey(e.target.value)}
                          placeholder={settingsStatus?.hasHunterApiKey ? `Current: ${settingsStatus.hunterApiKeyMasked}` : 'Enter your Hunter API key'}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowHunterKey(!showHunterKey)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showHunterKey ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Discover email patterns.{' '}
                        <a href="https://hunter.io/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                          Get a key <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>

                    {/* OpenAI API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OpenAI API Key <span className="text-gray-400">(for AI email generation)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Sparkles className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type={showOpenaiKey ? 'text' : 'password'}
                          value={openaiApiKey}
                          onChange={(e) => setOpenaiApiKey(e.target.value)}
                          placeholder={settingsStatus?.hasOpenaiApiKey ? `Current: ${settingsStatus.openaiApiKeyMasked}` : 'Enter your OpenAI API key'}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showOpenaiKey ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Generate personalized emails with AI.{' '}
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                          Get a key <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>

                    <button
                      onClick={handleSaveApiKeys}
                      disabled={isSaving || (!serpApiKey.trim() && !hunterApiKey.trim() && !openaiApiKey.trim())}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all',
                        isSaving || (!serpApiKey.trim() && !hunterApiKey.trim() && !openaiApiKey.trim())
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700'
                      )}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save API Keys
                    </button>
                  </div>
                )}

                {/* Email Setup Tab */}
                {activeTab === 'email' && (
                  <div className="space-y-6">
                    {/* Gmail Connection */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            settingsStatus?.gmailConnected
                              ? 'bg-green-100'
                              : 'bg-gray-200'
                          )}>
                            <Mail className={cn(
                              'w-5 h-5',
                              settingsStatus?.gmailConnected ? 'text-green-600' : 'text-gray-500'
                            )} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Gmail Connection</h3>
                            <p className="text-sm text-gray-500">
                              {settingsStatus?.gmailConnected
                                ? `Connected as ${settingsStatus.gmailEmail}`
                                : 'Connect your Gmail to send emails'}
                            </p>
                          </div>
                        </div>
                        {settingsStatus?.gmailConnected ? (
                          <button
                            onClick={handleDisconnectGmail}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Unlink className="w-4 h-4" />
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={handleConnectGmail}
                            disabled={isConnectingGmail}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {isConnectingGmail ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Link className="w-4 h-4" />
                            )}
                            Connect Gmail
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        We use Gmail API to send emails on your behalf. Your credentials are stored securely and only used for sending emails.
                      </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                      <h4 className="font-medium text-sky-800 mb-2">Email Outreach Features</h4>
                      <ul className="text-sm text-sky-700 space-y-1">
                        <li>• Send personalized cold emails to company contacts</li>
                        <li>• Use AI to generate tailored emails based on your resume</li>
                        <li>• Attach files like resume, cover letter, portfolio</li>
                        <li>• Pre-built templates for different outreach purposes</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Resume Tab */}
                {activeTab === 'resume' && (
                  <div className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          settingsStatus?.hasResume ? 'bg-green-500' : 'bg-gray-300'
                        )} />
                        <span className="text-sm text-gray-600">
                          {settingsStatus?.hasResume
                            ? `Resume saved (${settingsStatus.resumeLength} characters)`
                            : 'No resume saved'}
                        </span>
                      </div>
                    </div>

                    {/* Resume Text Area */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resume Content
                      </label>
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your resume content here (plain text, not PDF)...

Example:
John Doe
Software Engineer | 5+ years experience

EXPERIENCE
• Senior Software Engineer at Tech Corp (2020-Present)
  - Led development of microservices architecture
  - Improved system performance by 40%

SKILLS
JavaScript, TypeScript, React, Node.js, AWS

EDUCATION
BS Computer Science, State University"
                        rows={15}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        This text is used by AI to generate personalized cold emails tailored to your background and skills.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveResume}
                      disabled={isSaving}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all',
                        isSaving
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700'
                      )}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Resume
                    </button>
                  </div>
                )}



                {/* Extension Tab */}
                {activeTab === 'extension' && (
                  <div className="space-y-6">
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-sky-100 shadow-sm flex-shrink-0">
                          <Puzzle className="w-6 h-6 text-sky-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">TAAS Browser Clipper</h3>
                          <p className="text-gray-600 mt-1">
                            Save jobs from LinkedIn, Indeed, and Glassdoor with a single click.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3">
                        <h4 className="font-medium text-gray-900 border-b border-sky-200 pb-2">Setup Instructions</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 bg-white/50 p-4 rounded-lg">
                          <li>Install the TAAS Clipper extension in Chrome</li>
                          <li>Click the puzzle icon to open the extension</li>
                          <li>Go to <strong>Settings</strong></li>
                          <li>Copy your Access Token below and paste it there</li>
                        </ol>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Access Token
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          readOnly
                          value="••••••••••••••••••••••••••••••••"
                          className="w-full pl-10 pr-32 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <button
                          onClick={handleCopyToken}
                          className="absolute inset-y-1 right-1 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Token
                        </button>
                      </div>
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        Treat this token like a password. Do not share it.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error/Success Messages */}
                {error && (
                  <div className="mt-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mt-6 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence >
  );
}
