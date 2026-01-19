import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ExternalLink, Copy, ArrowLeft, Loader2 } from 'lucide-react';
import { MidnightLayout } from '@/layouts/MidnightLayout';
import { MidnightCard, MidnightHeader, MidnightButton, MidnightTable, MidnightEmpty, MidnightBadge } from '@/components/midnight/MidnightComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function MidnightContactFinderPage() {
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
        <MidnightLayout>
            <MidnightHeader
                title="Contact Finder"
                subtitle="Find HR contacts at companies"
                actions={<Link to="/plugins/job-tracker"><MidnightButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</MidnightButton></Link>}
            />

            <MidnightCard className="mb-8">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--midnight-text-dim)]" />
                        <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="midnight-input pl-12 !py-4 text-lg" />
                    </div>
                    <MidnightButton variant="primary" onClick={handleSearch} disabled={loading || !company.trim()} className="!px-8">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> Find Contacts</>}
                    </MidnightButton>
                </div>
            </MidnightCard>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--midnight-gold)] animate-spin" /></div>
            ) : !searched ? (
                <MidnightEmpty icon={<Users className="w-8 h-8" />} text="Enter a company name to find HR contacts" />
            ) : contacts.length === 0 ? (
                <MidnightEmpty icon={<Users className="w-8 h-8" />} text={`No contacts found for "${company}"`} />
            ) : (
                <MidnightCard className="!p-0 overflow-hidden">
                    <MidnightTable headers={['Name', 'Title', 'Email', 'LinkedIn', '']}>
                        {contacts.map((contact, i) => (
                            <tr key={i}>
                                <td className="font-medium">{contact.name}</td>
                                <td className="text-[var(--midnight-text-dim)]">{contact.position}</td>
                                <td>
                                    {contact.email ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[var(--midnight-gold)]">{contact.email}</span>
                                            <MidnightBadge variant={contact.emailConfidence > 80 ? 'success' : 'warning'}>{contact.emailConfidence}%</MidnightBadge>
                                        </div>
                                    ) : <span className="text-[var(--midnight-text-dim)]">—</span>}
                                </td>
                                <td>{contact.linkedinUrl && <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--midnight-accent)] hover:underline flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a>}</td>
                                <td>{contact.email && <MidnightButton variant="ghost" onClick={() => copyToClipboard(contact.email!)}><Copy className="w-4 h-4" /></MidnightButton>}</td>
                            </tr>
                        ))}
                    </MidnightTable>
                </MidnightCard>
            )}
        </MidnightLayout>
    );
}
