import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { PaperLayout } from '@/layouts/PaperLayout';
import { PaperCard, PaperButton, PaperTable, PaperEmpty, PaperTitle } from '@/components/paper/PaperComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function PaperContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <PaperLayout>
            <div className="flex items-center gap-4 mb-6"><Link to="/plugins/job-tracker"><PaperButton><ArrowLeft className="w-4 h-4" /></PaperButton></Link><PaperTitle subtitle="find HR contacts">👤 Contact Finder</PaperTitle></div>

            <PaperCard className="mb-6">
                <p className="text-[var(--ink-blue)] mb-4" style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.25rem' }}>Search for HR and recruiting contacts at any company...</p>
                <div className="flex gap-3 max-w-xl"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="company name..." className="paper-input flex-1" /><PaperButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> search</PaperButton></div>
            </PaperCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--ink-blue)]" /></div> :
                !searched ? <PaperEmpty text="enter a company name to search..." /> :
                    contacts.length === 0 ? <PaperEmpty text={`no contacts found for "${company}"...`} /> :
                        <PaperCard><PaperTable headers={['Name', 'Position', 'Email', 'LinkedIn']}>{contacts.map((c, i) => (<tr key={i}><td style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.25rem' }}>{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--ink-blue)]"><ExternalLink className="w-4 h-4 inline" /></a>}</td></tr>))}</PaperTable></PaperCard>}
        </PaperLayout>
    );
}
