import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamButton, SteamTable, SteamEmpty, SteamTitle } from '@/components/steam/SteamComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function SteamContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <SteamLayout>
            <div className="flex items-center gap-4 mb-6"><Link to="/plugins/job-tracker"><SteamButton><ArrowLeft className="w-4 h-4" /></SteamButton></Link><SteamTitle>Contact Locator</SteamTitle></div>

            <SteamPanel title="Search Apparatus" className="mb-6">
                <p className="text-[var(--steam-text-muted)] mb-4">Locate HR and recruiting contacts at your target companies.</p>
                <div className="flex gap-3 max-w-xl"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="steam-input flex-1" /><SteamButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> Search</SteamButton></div>
            </SteamPanel>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--steam-brass)]" /></div> :
                !searched ? <SteamEmpty icon="🔍" text="Enter a company to begin search" /> :
                    contacts.length === 0 ? <SteamEmpty text={`No contacts found for "${company}"`} /> :
                        <SteamPanel title={`Results for "${company}"`}><SteamTable headers={['Name', 'Position', 'Email', 'LinkedIn']}>{contacts.map((c, i) => (<tr key={i}><td>{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--steam-brass)] hover:underline"><ExternalLink className="w-4 h-4 inline" /></a>}</td></tr>))}</SteamTable></SteamPanel>}
        </SteamLayout>
    );
}
