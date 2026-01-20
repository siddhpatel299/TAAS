import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NewsprintCard, NewsprintSection, NewsprintButton, NewsprintTable, NewsprintEmpty } from '@/components/newsprint/NewsprintComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function NewsprintContactFinderPage() {
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
        <NewsprintLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link to="/plugins/job-tracker"><NewsprintButton><ArrowLeft className="w-4 h-4" /></NewsprintButton></Link>
                <h1 className="text-3xl" style={{ fontFamily: 'var(--font-headline)' }}>Contact Finder</h1>
            </div>

            <NewsprintCard className="mb-8">
                <p className="text-[var(--newsprint-ink-muted)] mb-4">Find HR contacts at your target companies.</p>
                <div className="flex gap-4">
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="newsprint-input flex-1" />
                    <NewsprintButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4 mr-2" /> Search</NewsprintButton>
                </div>
            </NewsprintCard>

            <NewsprintSection title="Results">
                {loading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div> :
                    !searched ? <NewsprintEmpty text="Enter a company name" /> :
                        contacts.length === 0 ? <NewsprintEmpty text="No contacts found" /> :
                            <NewsprintCard className="!p-0">
                                <NewsprintTable headers={['Name', 'Title', 'Email', '']}>
                                    {contacts.map((c, i) => (<tr key={i}><td>{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank"><ExternalLink className="w-4 h-4" /></a>}</td></tr>))}
                                </NewsprintTable>
                            </NewsprintCard>}
            </NewsprintSection>
        </NewsprintLayout>
    );
}
