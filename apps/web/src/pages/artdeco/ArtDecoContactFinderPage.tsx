import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoButton, DecoTable, DecoEmpty, DecoTitle, DecoDivider } from '@/components/artdeco/ArtDecoComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function ArtDecoContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <ArtDecoLayout>
            <div className="flex items-center gap-4 mb-6"><Link to="/plugins/job-tracker"><DecoButton><ArrowLeft className="w-5 h-5" /></DecoButton></Link><DecoTitle>Contact Finder</DecoTitle></div>
            <DecoCard className="mb-8">
                <p className="mb-4 text-[var(--deco-text-muted)]">Find HR and recruiting contacts at your target companies.</p>
                <div className="flex gap-4"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="deco-input flex-1" /><DecoButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-5 h-5" /> Search</DecoButton></div>
            </DecoCard>
            <DecoDivider text="Results" />
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--deco-gold)]" /></div> :
                !searched ? <DecoEmpty text="Enter a company name to search" /> :
                    contacts.length === 0 ? <DecoEmpty text={`No contacts found for "${company}"`} /> :
                        <DecoCard><DecoTable headers={['Name', 'Title', 'Email', 'LinkedIn']}>{contacts.map((c, i) => (<tr key={i}><td className="font-medium">{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--deco-gold)]"><ExternalLink className="w-5 h-5" /></a>}</td></tr>))}</DecoTable></DecoCard>}
        </ArtDecoLayout>
    );
}
