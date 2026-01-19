import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Mail, Linkedin, Copy, Check, Loader2, Settings, AlertTriangle } from 'lucide-react';
import { ForestLayout } from '@/layouts/ForestLayout';
import { ForestCard, ForestPageHeader, ForestButton, ForestBadge, ForestEmpty } from '@/components/forest/ForestComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

interface Contact {
    name: string;
    position: string;
    email?: string | null;
    emailConfidence?: number;
    linkedinUrl?: string;
}

export function ForestContactFinderPage() {
    const [companyName, setCompanyName] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
    const [apiKeysConfigured] = useState<boolean | null>(null);

    const handleSearch = async () => {
        if (!companyName.trim()) return;
        setIsSearching(true);
        setError(null);
        setContacts([]);

        try {
            const response = await jobTrackerApi.searchContacts({ company: companyName, mode: 'hr', maxResults: 10 });
            const data = response.data.data;
            setContacts(data?.contacts || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to search contacts');
        } finally {
            setIsSearching(false);
        }
    };

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    return (
        <ForestLayout>
            <ForestPageHeader
                title="Contact Finder"
                subtitle="Find HR and hiring contacts at companies"
                icon={<Users className="w-6 h-6" />}
                actions={
                    <ForestButton><Settings className="w-4 h-4 mr-2" /> API Settings</ForestButton>
                }
            />

            {/* Search */}
            <ForestCard className="mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Enter company name (e.g., Google, Apple)..."
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="forest-input"
                        />
                    </div>
                    <ForestButton variant="primary" onClick={handleSearch} disabled={isSearching || !companyName.trim()}>
                        {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        Search
                    </ForestButton>
                </div>
            </ForestCard>

            {/* API Warning */}
            {apiKeysConfigured === false && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-[rgba(212,169,67,0.1)] border border-[var(--forest-warning)] flex items-center gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-[var(--forest-warning)]" />
                    <p className="text-sm text-[var(--forest-wood)]">
                        Configure SERP API keys in settings to enable contact search
                    </p>
                </motion.div>
            )}

            {/* Error */}
            {error && (
                <ForestCard className="mb-6 !border-[var(--forest-danger)]">
                    <p className="text-[var(--forest-danger)]">{error}</p>
                </ForestCard>
            )}

            {/* Loading */}
            {isSearching && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--forest-leaf)] animate-spin" />
                </div>
            )}

            {/* Results */}
            {!isSearching && contacts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contacts.map((contact, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <ForestCard>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[rgba(74,124,89,0.1)] flex items-center justify-center text-[var(--forest-leaf)] font-semibold">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[var(--forest-moss)] truncate">{contact.name}</p>
                                        <p className="text-sm text-[var(--forest-wood)] truncate">{contact.position}</p>
                                    </div>
                                </div>

                                {contact.email && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(74,124,89,0.05)] mb-2">
                                        <Mail className="w-4 h-4 text-[var(--forest-leaf)]" />
                                        <span className="text-sm text-[var(--forest-moss)] flex-1 truncate">{contact.email}</span>
                                        {contact.emailConfidence && (
                                            <ForestBadge variant={contact.emailConfidence > 70 ? 'success' : 'warning'}>
                                                {contact.emailConfidence}%
                                            </ForestBadge>
                                        )}
                                        <button onClick={() => copyEmail(contact.email!)} className="p-1 hover:bg-[rgba(74,124,89,0.1)] rounded">
                                            {copiedEmail === contact.email ? <Check className="w-4 h-4 text-[var(--forest-success)]" /> : <Copy className="w-4 h-4 text-[var(--forest-wood)]" />}
                                        </button>
                                    </div>
                                )}

                                {contact.linkedinUrl && (
                                    <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--forest-info)] hover:underline">
                                        <Linkedin className="w-4 h-4" />
                                        View LinkedIn
                                    </a>
                                )}
                            </ForestCard>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isSearching && contacts.length === 0 && companyName && !error && (
                <ForestCard>
                    <ForestEmpty
                        icon={<Users className="w-full h-full" />}
                        title="No contacts found"
                        description="Try a different company name"
                    />
                </ForestCard>
            )}

            {/* Initial State */}
            {!isSearching && contacts.length === 0 && !companyName && !error && (
                <ForestCard>
                    <ForestEmpty
                        icon={<Search className="w-full h-full" />}
                        title="Search for contacts"
                        description="Enter a company name above to find HR contacts"
                    />
                </ForestCard>
            )}
        </ForestLayout>
    );
}
