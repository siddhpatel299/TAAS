import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ArrowLeft, Loader2, Users } from 'lucide-react';
import { GlassLayout } from '@/layouts/GlassLayout';
import { GlassCard, GlassButton, GlassTable, GlassEmpty, GlassTitle } from '@/components/glass/GlassComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function GlassContactFinderPage() {
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
        <GlassLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link to="/plugins/job-tracker"><GlassButton><ArrowLeft className="w-5 h-5" /></GlassButton></Link>
                <GlassTitle>Contact Finder</GlassTitle>
            </div>

            <GlassCard className="mb-8">
                <p className="mb-4 text-[var(--glass-text-muted)]">Find HR and recruiting contacts at your target companies.</p>
                <div className="flex gap-4">
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter company name..." className="glass-input flex-1" />
                    <GlassButton variant="primary" onClick={handleSearch} disabled={loading}><Search className="w-5 h-5" /> Search</GlassButton>
                </div>
            </GlassCard>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--glass-accent)]" /></div> :
                !searched ? <GlassEmpty text="Enter a company name" icon={<Users className="w-12 h-12" />} /> :
                    contacts.length === 0 ? <GlassEmpty text={`No contacts found for "${company}"`} /> :
                        <GlassCard flat>
                            <GlassTable headers={['Name', 'Title', 'Email', 'LinkedIn']}>
                                {contacts.map((c, i) => (<tr key={i}><td className="font-medium">{c.name}</td><td>{c.position}</td><td>{c.email || '—'}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--glass-accent)]"><ExternalLink className="w-5 h-5" /></a>}</td></tr>))}
                            </GlassTable>
                        </GlassCard>}
        </GlassLayout>
    );
}
