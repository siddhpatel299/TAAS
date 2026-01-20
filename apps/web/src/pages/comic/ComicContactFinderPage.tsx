import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { ComicLayout } from '@/layouts/ComicLayout';
import { ComicPanel, ComicButton, ComicTable, ComicEmpty, ComicTitle } from '@/components/comic/ComicComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function ComicContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <ComicLayout>
            <div className="flex items-center gap-3 mb-6"><Link to="/plugins/job-tracker"><ComicButton><ArrowLeft className="w-5 h-5" /></ComicButton></Link><ComicTitle>Contact Finder!</ComicTitle></div>
            <ComicPanel title="Search Company!">
                <p className="mb-4">Find HR and recruiting contacts at your target companies!</p>
                <div className="flex gap-3"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="comic-input flex-1" /><ComicButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-5 h-5" /> SEARCH!</ComicButton></div>
            </ComicPanel>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--comic-blue)]" /></div> :
                !searched ? <ComicEmpty text="Enter a company name to search!" /> :
                    contacts.length === 0 ? <ComicEmpty text={`No contacts found for "${company}"!`} /> :
                        <ComicPanel title={`Results for "${company}"!`}><ComicTable headers={['Name', 'Title', 'Email', 'LinkedIn']}>{contacts.map((c, i) => (<tr key={i}><td className="font-bold">{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--comic-blue)]"><ExternalLink className="w-5 h-5" /></a>}</td></tr>))}</ComicTable></ComicPanel>}
        </ComicLayout>
    );
}
