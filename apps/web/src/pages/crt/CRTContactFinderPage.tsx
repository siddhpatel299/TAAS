import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { CRTLayout } from '@/layouts/CRTLayout';
import { CRTPanel, CRTBox, CRTButton, CRTTable, CRTEmpty, CRTTitle } from '@/components/crt/CRTComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function CRTContactFinderPage() {
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
        <CRTLayout>
            <div className="flex items-center gap-4 mb-4">
                <Link to="/plugins/job-tracker"><CRTButton><ArrowLeft className="w-4 h-4" /></CRTButton></Link>
                <CRTTitle>Contact Finder</CRTTitle>
            </div>

            <CRTBox header="SEARCH PARAMETERS" className="mb-4">
                <p className="text-[var(--crt-green-dim)] mb-3">&gt; Enter company name to search for HR contacts</p>
                <div className="flex gap-4">
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="COMPANY_NAME..." className="crt-input flex-1" />
                    <CRTButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /> [SEARCH]</CRTButton>
                </div>
            </CRTBox>

            <CRTPanel header="Search Results">
                {loading ? <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--crt-green)]" /></div> :
                    !searched ? <CRTEmpty text="ENTER SEARCH QUERY" /> :
                        contacts.length === 0 ? <CRTEmpty text={`NO CONTACTS FOR "${company.toUpperCase()}"`} /> :
                            <CRTTable headers={['Name', 'Title', 'Email', 'Link']}>
                                {contacts.map((c, i) => (<tr key={i}><td>{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--crt-blue)]"><ExternalLink className="w-4 h-4" /></a>}</td></tr>))}
                            </CRTTable>}
            </CRTPanel>
        </CRTLayout>
    );
}
