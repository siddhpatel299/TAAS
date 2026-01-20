import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2, Users } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasButton, CanvasTable, CanvasEmpty, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function CanvasContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };

    return (
        <CanvasLayout>
            <div className="flex items-center gap-3 mb-6"><Link to="/plugins/job-tracker"><CanvasButton><ArrowLeft className="w-4 h-4" /></CanvasButton></Link><CanvasTitle>Contact Finder</CanvasTitle></div>
            <CanvasWindow title="Search Company" icon={<Search className="w-4 h-4" />} zLevel="mid" className="mb-8">
                <p className="mb-4 text-[var(--canvas-text-muted)] text-sm">Find HR and recruiting contacts at your target companies.</p>
                <div className="flex gap-3"><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="canvas-input flex-1" /><CanvasButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> Search</CanvasButton></div>
            </CanvasWindow>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--canvas-accent)]" /></div> :
                !searched ? <CanvasEmpty text="Enter a company name to search" icon={<Users className="w-10 h-10" />} /> :
                    contacts.length === 0 ? <CanvasEmpty text={`No contacts found for "${company}"`} /> :
                        <CanvasWindow title={`Results for "${company}"`} icon={<Users className="w-4 h-4" />} zLevel="close"><CanvasTable headers={['Name', 'Title', 'Email', 'LinkedIn']}>{contacts.map((c, i) => (<tr key={i}><td className="font-medium">{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--canvas-accent)]"><ExternalLink className="w-4 h-4" /></a>}</td></tr>))}</CanvasTable></CanvasWindow>}
        </CanvasLayout>
    );
}
