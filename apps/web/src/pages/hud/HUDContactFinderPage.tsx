import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Linkedin,
    Copy,
    Check,
    Loader2,
    Settings,
    ChevronDown,
    AlertCircle,
    Building2,
    Sparkles,
    Send,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel, HUDButton, HUDBadge } from '@/components/hud/HUDComponents';
import { jobTrackerApi } from '@/lib/plugins-api';
import { EmailComposerDialog } from '@/components/EmailComposerDialog';
import { JobTrackerSettingsDialog } from '@/components/JobTrackerSettingsDialog';
import { cn } from '@/lib/utils';

interface Contact {
    name: string;
    firstName: string;
    lastName: string;
    position: string;
    linkedinUrl: string;
    email: string | null;
    emailConfidence: number;
    source: string;
}

export function HUDContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKeysStatus, setApiKeysStatus] = useState<{ hasSerpApiKey: boolean; hasHunterApiKey: boolean }>({ hasSerpApiKey: false, hasHunterApiKey: false });
    const [showSettings, setShowSettings] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
    const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
    const [showEmailComposer, setShowEmailComposer] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [maxResults, setMaxResults] = useState(10);
    const [emailPattern, setEmailPattern] = useState<{ pattern: string; confidence: number } | null>(null);

    useEffect(() => {
        checkApiKeys();
    }, []);

    const checkApiKeys = async () => {
        try {
            const response = await jobTrackerApi.getApiKeysStatus();
            setApiKeysStatus(response.data.data);
        } catch (error) {
            console.error('Failed to check API keys:', error);
        }
    };

    const searchContacts = async () => {
        if (!company.trim()) {
            setError('Please enter a company name');
            return;
        }

        if (!apiKeysStatus.hasSerpApiKey) {
            setError('SERP API key is required. Please configure it in settings.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setContacts([]);
        setSelectedContacts(new Set());

        try {
            const response = await jobTrackerApi.searchContacts({
                company: company.trim(),
                mode: 'hr',
                maxResults,
            });

            const data = response.data.data;
            setContacts(data.contacts || []);
            setEmailPattern(data.emailPattern || null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Search failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) searchContacts();
    };

    const toggleContactSelection = (index: number) => {
        setSelectedContacts(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const getSelectedContactsForEmail = () => {
        return Array.from(selectedContacts).map(index => {
            const contact = contacts[index];
            return {
                name: contact.name,
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email || '',
                position: contact.position,
                company: company,
            };
        }).filter(c => c.email);
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-400 border-green-500/50';
        if (confidence >= 50) return 'text-yellow-400 border-yellow-500/50';
        return 'text-red-400 border-red-500/50';
    };

    const hasValidApiKeys = apiKeysStatus.hasSerpApiKey;

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
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Users className="w-10 h-10 text-purple-400" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }} />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-400 tracking-wide" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                                CONTACT FINDER
                            </h1>
                            <p className="text-cyan-600/70 mt-1 font-mono">
                                Find recruiters and hiring managers
                            </p>
                        </div>
                    </div>

                    <HUDButton onClick={() => setShowSettings(true)}>
                        <Settings className="w-4 h-4 mr-2" />
                        API Settings
                    </HUDButton>
                </div>

                <motion.div
                    className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1 }}
                />
            </motion.div>

            {/* API Keys Warning */}
            {!hasValidApiKeys && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <HUDPanel className="p-4 border-amber-500/50">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            <div className="flex-1">
                                <p className="text-amber-400 font-medium">API Keys Required</p>
                                <p className="text-sm text-amber-600">Configure SERP API key in settings to search contacts</p>
                            </div>
                            <HUDButton onClick={() => setShowSettings(true)}>Configure</HUDButton>
                        </div>
                    </HUDPanel>
                </motion.div>
            )}

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
            >
                <HUDPanel className="p-6" glow>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-600" />
                            <input
                                type="text"
                                placeholder="Enter company name (e.g., Google, Microsoft)"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="hud-input pl-12 pr-4 py-3 w-full text-lg"
                            />
                        </div>
                        <HUDButton
                            variant="primary"
                            onClick={searchContacts}
                            disabled={isLoading || !company.trim() || !hasValidApiKeys}
                            className="px-6 py-3"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Find Contacts
                                </>
                            )}
                        </HUDButton>
                    </div>

                    {/* Advanced Options */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-cyan-500 hover:text-cyan-400"
                    >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                        Advanced Options
                    </button>

                    <AnimatePresence>
                        {showAdvanced && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-cyan-500/20"
                            >
                                <div>
                                    <label className="block text-xs text-cyan-600 mb-1">Max Results</label>
                                    <input
                                        type="number"
                                        value={maxResults}
                                        onChange={(e) => setMaxResults(parseInt(e.target.value) || 10)}
                                        className="hud-input px-3 py-2 w-32"
                                        min={1}
                                        max={50}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </HUDPanel>
            </motion.div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <HUDPanel className="p-4 border-red-500/50">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400">{error}</p>
                        </div>
                    </HUDPanel>
                </motion.div>
            )}

            {/* Email Pattern */}
            {emailPattern && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <HUDPanel className="p-4 border-purple-500/50">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <span className="text-purple-300">
                                Email pattern: <span className="font-mono text-purple-400">{emailPattern.pattern}</span>
                                <span className="text-cyan-600 ml-2">({emailPattern.confidence}% confidence)</span>
                            </span>
                        </div>
                    </HUDPanel>
                </motion.div>
            )}

            {/* Results */}
            {contacts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {/* Actions bar */}
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-cyan-400">
                            <span className="font-bold">{contacts.length}</span> contacts found
                            {selectedContacts.size > 0 && (
                                <span className="ml-2 text-cyan-600">({selectedContacts.size} selected)</span>
                            )}
                        </p>
                        {selectedContacts.size > 0 && (
                            <HUDButton variant="primary" onClick={() => setShowEmailComposer(true)}>
                                <Send className="w-4 h-4 mr-2" />
                                Email Selected ({selectedContacts.size})
                            </HUDButton>
                        )}
                    </div>

                    {/* Contact list */}
                    <div className="space-y-3">
                        {contacts.map((contact, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div
                                    className={cn(
                                        "p-4 rounded-2xl border backdrop-blur-sm cursor-pointer transition-all",
                                        "border-cyan-500/30 bg-gradient-to-br from-gray-900/80 to-cyan-900/10",
                                        selectedContacts.has(index) && "border-purple-500/50 bg-purple-500/10"
                                    )}
                                    onClick={() => toggleContactSelection(index)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Selection indicator */}
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                            selectedContacts.has(index)
                                                ? "border-purple-500 bg-purple-500"
                                                : "border-cyan-500/50"
                                        )}>
                                            {selectedContacts.has(index) && <Check className="w-4 h-4 text-white" />}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0">
                                            <span className="text-purple-400 font-bold text-sm">
                                                {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-cyan-200">{contact.name}</h3>
                                            <p className="text-sm text-cyan-500">{contact.position}</p>
                                        </div>

                                        {/* Email */}
                                        {contact.email && (
                                            <div className="flex items-center gap-2">
                                                <HUDBadge className={cn("font-mono", getConfidenceColor(contact.emailConfidence))}>
                                                    {contact.emailConfidence}%
                                                </HUDBadge>
                                                <span className="text-sm text-cyan-400">{contact.email}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyEmail(contact.email!); }}
                                                    className="p-1.5 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/20 rounded"
                                                >
                                                    {copiedEmail === contact.email ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        )}

                                        {/* LinkedIn */}
                                        {contact.linkedinUrl && (
                                            <a
                                                href={contact.linkedinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                                            >
                                                <Linkedin className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Searching state */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <motion.div
                        className="w-16 h-16 border-2 border-purple-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="mt-4 text-cyan-400">Searching for contacts at {company}...</p>
                </div>
            )}

            {/* Settings Dialog */}
            <JobTrackerSettingsDialog
                isOpen={showSettings}
                onClose={() => { setShowSettings(false); checkApiKeys(); }}
            />

            {/* Email Composer */}
            {showEmailComposer && (
                <EmailComposerDialog
                    isOpen={showEmailComposer}
                    onClose={() => setShowEmailComposer(false)}
                    contacts={getSelectedContactsForEmail()}
                    company={company}
                    jobTitle=""
                />
            )}
        </HUDLayout>
    );
}
