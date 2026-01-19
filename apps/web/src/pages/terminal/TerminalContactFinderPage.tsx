import { useState } from 'react';
import { Search, Users, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { TerminalPanel, TerminalHeader, TerminalButton, TerminalTable, TerminalEmpty, TerminalBadge } from '@/components/terminal/TerminalComponents';
import { jobTrackerApi } from '@/lib/plugins-api';

interface Contact { name: string; position: string; email?: string | null; emailConfidence?: number; linkedinUrl?: string; }

export function TerminalContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!company.trim()) return;
        setIsSearching(true);
        setError(null);
        setContacts([]);
        try {
            const response = await jobTrackerApi.searchContacts({ company, mode: 'hr', maxResults: 10 });
            setContacts(response.data?.data?.contacts || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopied(email);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <TerminalLayout>
            <TerminalHeader title="Contact Finder" subtitle="Find HR contacts at companies" />

            {/* Search */}
            <TerminalPanel className="mb-4">
                <div className="flex items-center gap-2">
                    <input type="text" placeholder="Enter company name..." value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="terminal-input flex-1" />
                    <TerminalButton variant="primary" onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
                        Search
                    </TerminalButton>
                </div>
                {error && <div className="mt-2 text-xs text-[var(--terminal-red)]">{error}</div>}
            </TerminalPanel>

            {/* Results */}
            {contacts.length === 0 && !isSearching ? (
                <TerminalEmpty icon={<Users className="w-full h-full" />} text="Enter company name to search" />
            ) : isSearching ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--terminal-amber)] animate-spin" /></div>
            ) : (
                <TerminalPanel title={`${contacts.length} Contacts Found`}>
                    <TerminalTable headers={['Name', 'Position', 'Email', 'Confidence', 'Actions']}>
                        {contacts.map((contact, i) => (
                            <tr key={i}>
                                <td className="font-bold">{contact.name}</td>
                                <td className="text-[var(--terminal-text-dim)]">{contact.position}</td>
                                <td>{contact.email || '—'}</td>
                                <td>
                                    {contact.emailConfidence !== undefined && (
                                        <TerminalBadge variant={contact.emailConfidence > 70 ? 'success' : contact.emailConfidence > 40 ? 'warning' : 'default'}>
                                            {contact.emailConfidence}%
                                        </TerminalBadge>
                                    )}
                                </td>
                                <td>
                                    <div className="flex items-center gap-1">
                                        {contact.email && (
                                            <TerminalButton onClick={() => copyEmail(contact.email!)}>
                                                <Copy className="w-3 h-3" />
                                                {copied === contact.email && <span className="ml-1 text-[var(--terminal-green)]">✓</span>}
                                            </TerminalButton>
                                        )}
                                        {contact.linkedinUrl && (
                                            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                                <TerminalButton><ExternalLink className="w-3 h-3" /></TerminalButton>
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </TerminalTable>
                </TerminalPanel>
            )}
        </TerminalLayout>
    );
}
