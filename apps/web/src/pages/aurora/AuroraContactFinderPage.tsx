import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { AuroraLayout } from '@/layouts/AuroraLayout';
import { AuroraCard, AuroraButton, AuroraTable, AuroraEmpty, AuroraTitle } from '@/components/aurora/AuroraComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function AuroraContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <AuroraLayout>
            <div className="flex items-center gap-4 mb-6"><Link to="/plugins/job-tracker"><AuroraButton><ArrowLeft className="w-4 h-4" /></AuroraButton></Link><AuroraTitle subtitle="Find HR contacts">Contact Finder</AuroraTitle></div>

            <AuroraCard className="mb-6">
                <p className="text-[var(--aurora-text-muted)] mb-4">Discover HR and recruiting contacts at target companies.</p>
                <div className="flex gap-3 max-w-xl"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="aurora-input flex-1" /><AuroraButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> Search</AuroraButton></div>
            </AuroraCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--aurora-gradient-1)]" /></div> :
                !searched ? <AuroraEmpty text="Enter a company to search" /> :
                    contacts.length === 0 ? <AuroraEmpty text={`No contacts for "${company}"`} /> :
                        <AuroraCard><AuroraTable headers={['Name', 'Position', 'Email', 'LinkedIn']}>{contacts.map((c, i) => (<tr key={i}><td className="font-medium">{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--aurora-gradient-1)] hover:underline"><ExternalLink className="w-4 h-4 inline" /></a>}</td></tr>))}</AuroraTable></AuroraCard>}
        </AuroraLayout>
    );
}
