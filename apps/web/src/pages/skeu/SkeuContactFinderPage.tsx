import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { SkeuLayout } from '@/layouts/SkeuLayout';
import { SkeuCard, SkeuButton, SkeuTable, SkeuEmpty, SkeuTitle } from '@/components/skeu/SkeuComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function SkeuContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <SkeuLayout>
            <div className="flex items-center gap-4 mb-6"><Link to="/plugins/job-tracker"><SkeuButton><ArrowLeft className="w-4 h-4" /></SkeuButton></Link><SkeuTitle subtitle="HR contact discovery system">Contact Finder</SkeuTitle></div>

            <SkeuCard className="mb-6">
                <p className="text-[var(--skeu-text-muted)] mb-4">Scan company databases for HR and recruiting contacts.</p>
                <div className="flex gap-3 max-w-xl"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="skeu-input flex-1" /><SkeuButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> Scan</SkeuButton></div>
            </SkeuCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--skeu-led-blue)]" /></div> :
                !searched ? <SkeuEmpty text="Enter a company to scan" /> :
                    contacts.length === 0 ? <SkeuEmpty text={`No contacts found for "${company}"`} /> :
                        <SkeuCard><SkeuTable headers={['Name', 'Position', 'Email', 'Profile']}>{contacts.map((c, i) => (<tr key={i}><td className="font-medium">{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--skeu-led-blue)] hover:underline"><ExternalLink className="w-4 h-4 inline" /></a>}</td></tr>))}</SkeuTable></SkeuCard>}
        </SkeuLayout>
    );
}
