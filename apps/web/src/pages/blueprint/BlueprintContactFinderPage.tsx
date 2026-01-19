import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ExternalLink, Copy, ArrowLeft, Loader2 } from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { BlueprintCard, BlueprintHeader, BlueprintButton, BlueprintTable, BlueprintEmpty, BlueprintBadge } from '@/components/blueprint/BlueprintComponents';
import { jobTrackerApi, CompanyContact } from '@/lib/plugins-api';

export function BlueprintContactFinderPage() {
    const [company, setCompany] = useState('');
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => { if (!company.trim()) return; setLoading(true); setSearched(true); try { const r = await jobTrackerApi.findCompanyContacts(company.trim(), { mode: 'hr', maxResults: 5 }); setContacts(r.data?.data?.contacts || []); } catch (e) { console.error(e); setContacts([]); } finally { setLoading(false); } };
    const copyToClipboard = (t: string) => { navigator.clipboard.writeText(t); };

    return (
        <BlueprintLayout>
            <BlueprintHeader title="Contact Finder" subtitle="Find HR contacts" actions={<Link to="/plugins/job-tracker"><BlueprintButton variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</BlueprintButton></Link>} />
            <BlueprintCard className="mb-6">
                <div className="flex gap-4">
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--blueprint-text-muted)]" /><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Company name..." className="blueprint-input pl-12 !py-4" /></div>
                    <BlueprintButton variant="primary" onClick={handleSearch} disabled={loading || !company.trim()} className="!px-8">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> Find</>}</BlueprintButton>
                </div>
            </BlueprintCard>
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--blueprint-cyan)] animate-spin" /></div> :
                !searched ? <BlueprintEmpty icon={<Users className="w-8 h-8" />} text="Enter company name to search" /> :
                    contacts.length === 0 ? <BlueprintEmpty icon={<Users className="w-8 h-8" />} text={`No contacts for "${company}"`} /> :
                        <BlueprintCard className="!p-0 overflow-hidden">
                            <BlueprintTable headers={['Name', 'Title', 'Email', 'LinkedIn', '']}>
                                {contacts.map((c, i) => (<tr key={i}><td className="font-medium">{c.name}</td><td className="text-[var(--blueprint-text-dim)]">{c.position}</td><td>{c.email ? <div className="flex items-center gap-2"><span className="text-[var(--blueprint-cyan)]">{c.email}</span><BlueprintBadge variant={c.emailConfidence > 80 ? 'green' : 'orange'}>{c.emailConfidence}%</BlueprintBadge></div> : <span className="text-[var(--blueprint-text-dim)]">—</span>}</td><td>{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--blueprint-text-dim)] hover:text-[var(--blueprint-cyan)] flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a>}</td><td>{c.email && <BlueprintButton variant="ghost" onClick={() => copyToClipboard(c.email!)}><Copy className="w-4 h-4" /></BlueprintButton>}</td></tr>))}
                            </BlueprintTable>
                        </BlueprintCard>}
        </BlueprintLayout>
    );
}
