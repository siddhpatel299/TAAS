import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { ArchiveSection, ArchiveButton, ArchiveTable, ArchiveEmpty, ArchiveTitle } from '@/components/archive/ArchiveComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function ArchiveContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <ArchiveLayout>
            <div className="flex items-center gap-4 mb-8"><Link to="/plugins/job-tracker"><ArchiveButton><ArrowLeft className="w-4 h-4" /></ArchiveButton></Link><ArchiveTitle>Contact Finder</ArchiveTitle></div>

            <ArchiveSection title="Search" className="mb-12">
                <p className="text-[var(--archive-text-muted)] mb-6">Discover HR and recruiting contacts at your target companies.</p>
                <div className="flex gap-3 max-w-xl"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="archive-input flex-1" /><ArchiveButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> Search</ArchiveButton></div>
            </ArchiveSection>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--archive-accent)]" /></div> :
                !searched ? <ArchiveEmpty title="Enter a company" text="Search for a company to discover contacts." /> :
                    contacts.length === 0 ? <ArchiveEmpty title={`No contacts found`} text={`No HR contacts found for "${company}".`} /> :
                        <ArchiveSection title={`Results for "${company}"`} count={contacts.length}><ArchiveTable headers={['Name', 'Position', 'Email', 'LinkedIn']}>{contacts.map((c, i) => (<tr key={i}><td className="font-medium">{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--archive-accent)] hover:underline"><ExternalLink className="w-4 h-4 inline" /></a>}</td></tr>))}</ArchiveTable></ArchiveSection>}
        </ArchiveLayout>
    );
}
