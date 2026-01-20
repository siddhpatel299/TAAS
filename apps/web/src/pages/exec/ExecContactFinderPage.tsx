import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { ExecLayout } from '@/layouts/ExecLayout';
import { ExecCard, ExecButton, ExecTable, ExecEmpty, ExecTitle } from '@/components/exec/ExecComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function ExecContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <ExecLayout>
            <div className="flex items-center gap-4 mb-8"><Link to="/plugins/job-tracker"><ExecButton><ArrowLeft className="w-4 h-4" /></ExecButton></Link><ExecTitle subtitle="Discover key personnel at target companies">Contact Directory</ExecTitle></div>

            <ExecCard className="mb-8">
                <p className="text-[var(--exec-text-muted)] mb-6 italic">Search for HR and executive contacts at your target companies.</p>
                <div className="flex gap-4 max-w-xl"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Company name..." className="exec-input flex-1" /><ExecButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> Search</ExecButton></div>
            </ExecCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--exec-gold)]" /></div> :
                !searched ? <ExecEmpty text="Enter a company name to search" /> :
                    contacts.length === 0 ? <ExecEmpty text={`No contacts found for "${company}"`} /> :
                        <ExecCard><ExecTable headers={['Name', 'Position', 'Email', 'Profile']}>{contacts.map((c, i) => (<tr key={i}><td>{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--exec-gold)] hover:underline"><ExternalLink className="w-4 h-4 inline" /></a>}</td></tr>))}</ExecTable></ExecCard>}
        </ExecLayout>
    );
}
