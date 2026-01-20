import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { PixelLayout } from '@/layouts/PixelLayout';
import { PixelCard, PixelButton, PixelTable, PixelEmpty, PixelTitle } from '@/components/pixel/PixelComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function PixelContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <PixelLayout>
            <div className="flex items-center gap-4 mb-6"><Link to="/plugins/job-tracker"><PixelButton><ArrowLeft className="w-4 h-4" /></PixelButton></Link><PixelTitle subtitle="> FIND HR CONTACTS">👤 CONTACT FINDER</PixelTitle></div>

            <PixelCard className="mb-6">
                <p className="text-[var(--pixel-text-dim)] mb-4">&gt; Search for HR contacts at any company...</p>
                <div className="flex gap-3 max-w-xl"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="> COMPANY NAME..." className="pixel-input flex-1" /><PixelButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> SCAN</PixelButton></div>
            </PixelCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--pixel-cyan)]" /></div> :
                !searched ? <PixelEmpty text="ENTER COMPANY TO SCAN" /> :
                    contacts.length === 0 ? <PixelEmpty text={`NO CONTACTS FOUND FOR "${company.toUpperCase()}"`} /> :
                        <PixelCard><PixelTable headers={['Name', 'Title', 'Email', 'Link']}>{contacts.map((c, i) => (<tr key={i}><td>{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--pixel-cyan)]"><ExternalLink className="w-4 h-4 inline" /></a>}</td></tr>))}</PixelTable></PixelCard>}
        </PixelLayout>
    );
}
