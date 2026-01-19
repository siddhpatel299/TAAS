import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ExternalLink, Copy, ArrowLeft, Loader2 } from 'lucide-react';
import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { OrigamiCard, OrigamiHeader, OrigamiButton, OrigamiTable, OrigamiEmpty, OrigamiBadge } from '@/components/origami/OrigamiComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function OrigamiContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!company.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const res = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 });
            setContacts(res.data?.data?.contacts || []);
        } catch (error) {
            console.error('Failed to find contacts:', error);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <OrigamiLayout>
            <OrigamiHeader
                title="Contact Finder"
                subtitle="Find HR contacts at companies"
                actions={<Link to="/plugins/job-tracker"><OrigamiButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</OrigamiButton></Link>}
            />

            <OrigamiCard className="mb-8">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--origami-text-muted)]" />
                        <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="origami-input pl-12 !py-4 text-lg" />
                    </div>
                    <OrigamiButton variant="primary" onClick={handleSearch} disabled={loading || !company.trim()} className="!px-8">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> Find Contacts</>}
                    </OrigamiButton>
                </div>
            </OrigamiCard>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--origami-terracotta)] animate-spin" /></div>
            ) : !searched ? (
                <OrigamiEmpty icon={<Users className="w-8 h-8" />} text="Enter a company name to find HR contacts" />
            ) : contacts.length === 0 ? (
                <OrigamiEmpty icon={<Users className="w-8 h-8" />} text={`No contacts found for "${company}"`} />
            ) : (
                <OrigamiCard className="!p-0 overflow-hidden">
                    <OrigamiTable headers={['Name', 'Title', 'Email', 'LinkedIn', '']}>
                        {contacts.map((contact, i) => (
                            <tr key={i}>
                                <td className="font-medium">{contact.name}</td>
                                <td className="text-[var(--origami-text-dim)]">{contact.position}</td>
                                <td>
                                    {contact.email ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[var(--origami-terracotta)]">{contact.email}</span>
                                            <OrigamiBadge variant={contact.emailConfidence > 80 ? 'sage' : 'warning'}>{contact.emailConfidence}%</OrigamiBadge>
                                        </div>
                                    ) : <span className="text-[var(--origami-text-dim)]">—</span>}
                                </td>
                                <td>{contact.linkedinUrl && <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--origami-slate)] hover:underline flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a>}</td>
                                <td>{contact.email && <OrigamiButton variant="ghost" onClick={() => copyToClipboard(contact.email!)}><Copy className="w-4 h-4" /></OrigamiButton>}</td>
                            </tr>
                        ))}
                    </OrigamiTable>
                </OrigamiCard>
            )}
        </OrigamiLayout>
    );
}
