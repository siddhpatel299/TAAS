import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { ZenLayout } from '@/layouts/ZenLayout';
import { ZenCard, ZenButton, ZenTable, ZenEmpty, ZenTitle, ZenSection } from '@/components/zen/ZenComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function ZenContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <ZenLayout>
            <div className="flex items-center gap-6" style={{ marginBottom: '64px' }}><Link to="/plugins/job-tracker"><ZenButton><ArrowLeft className="w-3 h-3" /></ZenButton></Link><ZenTitle subtitle="Find HR contacts">Contact Finder</ZenTitle></div>

            <ZenSection>
                <ZenCard>
                    <p className="text-[var(--zen-text-light)]" style={{ marginBottom: '24px' }}>Discover HR and recruiting contacts at target companies.</p>
                    <div className="flex gap-4" style={{ maxWidth: '480px' }}><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Company name" className="zen-input flex-1" /><ZenButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-3 h-3" /> Search</ZenButton></div>
                </ZenCard>
            </ZenSection>

            {loading ? <div className="flex items-center justify-center" style={{ minHeight: '30vh' }}><Loader2 className="w-6 h-6 animate-spin text-[var(--zen-text-light)]" /></div> :
                !searched ? <ZenEmpty text="Enter a company to search" /> :
                    contacts.length === 0 ? <ZenEmpty text={`No contacts for "${company}"`} /> :
                        <ZenSection title={`Results for "${company}"`}><ZenCard><ZenTable headers={['Name', 'Position', 'Email', 'LinkedIn']}>{contacts.map((c, i) => (<tr key={i}><td>{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--zen-text)]"><ExternalLink className="w-4 h-4" /></a>}</td></tr>))}</ZenTable></ZenCard></ZenSection>}
        </ZenLayout>
    );
}
