import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Users,
    Mail,
    Linkedin,
    Copy,
    Check,
    Loader2,
    Settings2,
    ChevronDown,
    AlertCircle,
    MapPin,
    Building2,
    Sparkles,
    Send,
    CheckSquare,
    Square,
    ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { jobTrackerApi, ContactForEmail, CompanyContact } from '@/lib/plugins-api';
import { EmailComposerDialog } from '@/components/EmailComposerDialog';
import { JobTrackerSettingsDialog } from '@/components/JobTrackerSettingsDialog';
import { AppLayout } from '@/components/layout/AppLayout';

export function ContactFinderPage() {
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    // Company input
    const [company, setCompany] = useState('');

    // Selection state
    const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
    const [showEmailComposer, setShowEmailComposer] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Search options
    const [searchMode, setSearchMode] = useState<'hr' | 'functional'>('hr');
    const [customRoles, setCustomRoles] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [maxResults, setMaxResults] = useState<number>(10);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Email pattern discovered
    const [emailPattern, setEmailPattern] = useState<{ pattern: string; confidence: number } | null>(null);
    const [patternFromCache, setPatternFromCache] = useState(false);

    // API keys status
    const [apiKeysStatus, setApiKeysStatus] = useState<{
        hasSerpApiKey: boolean;
        hasHunterApiKey: boolean;
    }>({ hasSerpApiKey: false, hasHunterApiKey: false });

    // Check API keys on mount
    useEffect(() => {
        checkApiKeys();
    }, []);

    const checkApiKeys = async () => {
        try {
            const response = await jobTrackerApi.getApiKeysStatus();
            setApiKeysStatus(response.data.data);
        } catch (err) {
            console.error('Failed to check API keys:', err);
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
            const targetRoles = searchMode === 'functional' && customRoles
                ? customRoles.split(',').map(r => r.trim()).filter(Boolean)
                : [];

            const response = await jobTrackerApi.searchContacts({
                company: company.trim(),
                mode: searchMode,
                targetRoles,
                location: location || undefined,
                maxResults,
            });

            const data = response.data.data;
            setContacts(data.contacts);
            setEmailPattern(data.emailPattern);
            setPatternFromCache(data.patternFromCache);
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to find contacts';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            searchContacts();
        }
    };

    const toggleContactSelection = (index: number) => {
        const newSelected = new Set(selectedContacts);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedContacts(newSelected);
    };

    const selectAllWithEmail = () => {
        const indices = contacts
            .map((c, i) => (c.email ? i : -1))
            .filter(i => i !== -1);
        setSelectedContacts(new Set(indices));
    };

    const deselectAll = () => {
        setSelectedContacts(new Set());
    };

    const getSelectedContactsForEmail = (): ContactForEmail[] => {
        return Array.from(selectedContacts)
            .map(index => contacts[index])
            .filter(c => c && c.email)
            .map(c => ({
                name: c.name,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email!,
                position: c.position,
                company: company,
            }));
    };

    const copyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopiedEmail(email);
            setTimeout(() => setCopiedEmail(null), 2000);
        } catch (err) {
            console.error('Failed to copy email:', err);
        }
    };

    const copyAllEmails = async () => {
        const emails = contacts
            .filter(c => c.email)
            .map(c => c.email)
            .join(', ');

        if (emails) {
            try {
                await navigator.clipboard.writeText(emails);
                setCopiedEmail('all');
                setTimeout(() => setCopiedEmail(null), 2000);
            } catch (err) {
                console.error('Failed to copy emails:', err);
            }
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-600 bg-green-50';
        if (confidence >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-gray-600 bg-gray-50';
    };

    const contactsWithEmail = contacts.filter(c => c.email);
    const selectedCount = selectedContacts.size;
    const selectedWithEmail = getSelectedContactsForEmail().length;

    return (
        <AppLayout storageUsed={0}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            to="/plugins/job-tracker"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Job Tracker
                        </Link>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Contact Finder</h1>
                                    <p className="text-gray-500">Find email addresses and LinkedIn profiles at any company</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <Settings2 className="w-4 h-4" />
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* Search Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
                        {/* Company Input */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter company name (e.g., Google, Microsoft, Stripe)"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-sky-500 focus:border-transparent focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Options */}
                        <div className="px-6 py-4 bg-gray-50/50">
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Search Mode Toggle */}
                                <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                                    <button
                                        onClick={() => setSearchMode('hr')}
                                        className={cn(
                                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                            searchMode === 'hr'
                                                ? 'bg-sky-100 text-sky-700'
                                                : 'text-gray-500 hover:text-gray-700'
                                        )}
                                    >
                                        HR / Recruiters
                                    </button>
                                    <button
                                        onClick={() => setSearchMode('functional')}
                                        className={cn(
                                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                            searchMode === 'functional'
                                                ? 'bg-sky-100 text-sky-700'
                                                : 'text-gray-500 hover:text-gray-700'
                                        )}
                                    >
                                        Functional Roles
                                    </button>
                                </div>

                                {/* Custom Roles Input (for functional mode) */}
                                {searchMode === 'functional' && (
                                    <div className="flex-1 min-w-[200px]">
                                        <input
                                            type="text"
                                            placeholder="e.g., Software Engineer, SOC Analyst"
                                            value={customRoles}
                                            onChange={(e) => setCustomRoles(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                {/* Advanced Options Toggle */}
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    Options
                                    <ChevronDown className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')} />
                                </button>

                                {/* Search Button */}
                                <button
                                    onClick={searchContacts}
                                    disabled={isLoading || !apiKeysStatus.hasSerpApiKey || !company.trim()}
                                    className={cn(
                                        'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all',
                                        isLoading || !apiKeysStatus.hasSerpApiKey || !company.trim()
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-500/25'
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            Find Contacts
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Advanced Options */}
                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                                            {/* Location Filter */}
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Location (optional)"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    className="w-40 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                                />
                                            </div>

                                            {/* Max Results */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">Max Results:</span>
                                                <select
                                                    value={maxResults}
                                                    onChange={(e) => setMaxResults(Number(e.target.value))}
                                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={15}>15</option>
                                                    <option value={20}>20</option>
                                                    <option value={25}>25</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* API Status */}
                        <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <span className={cn('w-2 h-2 rounded-full', apiKeysStatus.hasSerpApiKey ? 'bg-green-500' : 'bg-gray-300')} />
                                SERP API
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className={cn('w-2 h-2 rounded-full', apiKeysStatus.hasHunterApiKey ? 'bg-green-500' : 'bg-gray-300')} />
                                Hunter API
                            </span>
                            {!apiKeysStatus.hasSerpApiKey && (
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="text-sky-600 hover:text-sky-700 hover:underline"
                                >
                                    Configure API Keys
                                </button>
                            )}
                        </div>
                    </div>

                    {/* API Key Warning */}
                    {!apiKeysStatus.hasSerpApiKey && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-amber-800">API Keys Required</h4>
                                    <p className="text-sm text-amber-700 mt-1">
                                        To find contacts, you need to configure your SERP API key (required) and Hunter API key (optional, for email discovery) in the settings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Email Pattern Info */}
                    {emailPattern && (
                        <div className={cn(
                            "mb-6 p-4 border rounded-xl",
                            patternFromCache
                                ? "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200"
                                : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                        )}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Sparkles className={cn("w-5 h-5", patternFromCache ? "text-violet-600" : "text-emerald-600")} />
                                <span className={cn("font-medium", patternFromCache ? "text-violet-800" : "text-emerald-800")}>
                                    Email Pattern {patternFromCache ? 'Retrieved from Cache' : 'Discovered'}
                                </span>
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-medium',
                                    getConfidenceColor(emailPattern.confidence)
                                )}>
                                    {Math.round(emailPattern.confidence)}% confidence
                                </span>
                                {patternFromCache && (
                                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                                        💾 Saved API Credit
                                    </span>
                                )}
                            </div>
                            <p className={cn("text-sm mt-1", patternFromCache ? "text-violet-700" : "text-emerald-700")}>
                                Pattern: <code className="px-2 py-0.5 bg-white/60 rounded">{emailPattern.pattern}</code>
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {contacts.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                            {/* Selection Actions Bar */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={selectAllWithEmail}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <CheckSquare className="w-4 h-4" />
                                        Select All ({contactsWithEmail.length})
                                    </button>
                                    <button
                                        onClick={deselectAll}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Square className="w-4 h-4" />
                                        Deselect All
                                    </button>
                                    <span className="text-sm text-gray-500">
                                        {selectedCount} selected
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={copyAllEmails}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                                    >
                                        {copiedEmail === 'all' ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy All Emails
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowEmailComposer(true)}
                                        disabled={selectedWithEmail === 0}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                                            selectedWithEmail === 0
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25'
                                        )}
                                    >
                                        <Send className="w-4 h-4" />
                                        Email Selected ({selectedWithEmail})
                                    </button>
                                </div>
                            </div>

                            {/* Contact Cards */}
                            <div className="p-4 space-y-3">
                                {contacts.map((contact, index) => (
                                    <motion.div
                                        key={`${contact.name}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "border rounded-xl p-4 transition-all cursor-pointer",
                                            selectedContacts.has(index)
                                                ? "border-sky-400 bg-sky-50/50 shadow-md"
                                                : "border-gray-200 hover:border-sky-200 hover:shadow-md bg-white"
                                        )}
                                        onClick={() => contact.email && toggleContactSelection(index)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Checkbox */}
                                            <div className="flex-shrink-0 pt-1">
                                                <div
                                                    className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                        !contact.email
                                                            ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                                                            : selectedContacts.has(index)
                                                                ? "border-sky-500 bg-sky-500"
                                                                : "border-gray-300 hover:border-sky-400"
                                                    )}
                                                >
                                                    {selectedContacts.has(index) && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-sky-700">
                                                    {getInitials(contact.name)}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                                                    {contact.emailConfidence > 0 && (
                                                        <span className={cn(
                                                            'px-2 py-0.5 rounded-full text-xs font-medium',
                                                            getConfidenceColor(contact.emailConfidence)
                                                        )}>
                                                            {Math.round(contact.emailConfidence)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">{contact.position}</p>

                                                {/* Actions */}
                                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                                    {/* Email */}
                                                    {contact.email ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyEmail(contact.email!);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors group"
                                                        >
                                                            <Mail className="w-4 h-4 text-gray-500" />
                                                            <span className="text-gray-700 truncate max-w-[200px]">{contact.email}</span>
                                                            {copiedEmail === contact.email ? (
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <Copy className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-400">
                                                            <Mail className="w-4 h-4" />
                                                            No email found
                                                        </span>
                                                    )}

                                                    {/* LinkedIn */}
                                                    {contact.linkedinUrl && (
                                                        <a
                                                            href={contact.linkedinUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors"
                                                        >
                                                            <Linkedin className="w-4 h-4" />
                                                            View Profile
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>Showing {contacts.length} contacts at {company}</span>
                                </div>
                            </div>
                        </div>
                    ) : !isLoading && !error ? (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center">
                                <Users className="w-10 h-10 text-sky-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Find Contacts at Any Company</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                Enter a company name above to search for HR professionals, recruiters, or specific roles.
                                We'll find their LinkedIn profiles and generate email addresses.
                            </p>
                            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Search className="w-4 h-4" />
                                    LinkedIn Profiles
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-4 h-4" />
                                    Email Discovery
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Send className="w-4 h-4" />
                                    Bulk Outreach
                                </span>
                            </div>
                        </div>
                    ) : null}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                            <Loader2 className="w-12 h-12 mx-auto mb-4 text-sky-500 animate-spin" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Searching for contacts...</h3>
                            <p className="text-gray-500">
                                Finding LinkedIn profiles and generating emails at {company}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Composer Dialog */}
            {showEmailComposer && (
                <EmailComposerDialog
                    isOpen={showEmailComposer}
                    onClose={() => setShowEmailComposer(false)}
                    contacts={getSelectedContactsForEmail()}
                    company={company}
                    jobTitle=""
                />
            )}

            {/* Settings Dialog */}
            <JobTrackerSettingsDialog
                isOpen={showSettings}
                onClose={() => {
                    setShowSettings(false);
                    checkApiKeys(); // Refresh API keys status
                }}
            />
        </AppLayout>
    );
}
