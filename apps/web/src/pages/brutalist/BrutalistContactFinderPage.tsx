import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2, Users } from 'lucide-react';
import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { BrutalistCard, BrutalistButton, BrutalistTable, BrutalistEmpty, BrutalistTitle } from '@/components/brutalist/BrutalistComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function BrutalistContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!company.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 });
            setContacts(r.data?.data?.contacts || []);
        } catch (e) {
            console.error(e);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BrutalistLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link to="/plugins/job-tracker"><BrutalistButton><ArrowLeft className="w-5 h-5" /></BrutalistButton></Link>
                <BrutalistTitle>Contact Finder</BrutalistTitle>
            </div>

            <BrutalistCard color="yellow" className="mb-8">
                <p className="mb-4 font-semibold">Find HR and recruiting contacts at your target companies.</p>
                <div className="flex gap-4">
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="brutalist-input flex-1" />
                    <BrutalistButton color="blue" onClick={handleSearch} disabled={loading}><Search className="w-5 h-5" /> Search</BrutalistButton>
                </div>
            </BrutalistCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto" /></div> :
                !searched ? <BrutalistEmpty text="Enter a company name" icon={<Users />} /> :
                    contacts.length === 0 ? <BrutalistEmpty text={`No contacts found for "${company}"`} /> :
                        <BrutalistCard className="!p-0">
                            <BrutalistTable headers={['Name', 'Title', 'Email', 'LinkedIn']}>
                                {contacts.map((c, i) => (<tr key={i}><td className="font-bold">{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-5 h-5" /></a>}</td></tr>))}
                            </BrutalistTable>
                        </BrutalistCard>}
        </BrutalistLayout>
    );
}
