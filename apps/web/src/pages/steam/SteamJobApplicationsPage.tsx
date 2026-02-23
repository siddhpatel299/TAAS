import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { SteamLayout } from '@/layouts/SteamLayout';
import { SteamPanel, SteamButton, SteamBadge, SteamTable, SteamEmpty, SteamTitle } from '@/components/steam/SteamComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function SteamJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'brass' | 'copper' | 'rust'> = { applied: 'brass', interviewing: 'copper', offered: 'brass', rejected: 'rust' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <SteamLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><SteamButton><ArrowLeft className="w-4 h-4" /></SteamButton></Link><SteamTitle>Applications Register</SteamTitle></div>
                <SteamButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New Entry</SteamButton>
            </div>

            <SteamPanel title="Filter Apparatus" className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("steam-btn", statusFilter === s && "steam-btn-primary")}>{s}</button>))}</div>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="steam-input w-64" />
                </div>
            </SteamPanel>

            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--steam-brass)]" /></div> :
                apps.length === 0 ? <SteamEmpty text={searchInput || statusFilter !== 'all' ? 'No matching entries' : 'No applications recorded'} /> :
                    <SteamPanel title={`${total} Entries`}><SteamTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td>{a.company}</td><td>{a.jobTitle}</td><td><SteamBadge color={colors[a.status] || 'brass'}>{a.status}</SteamBadge></td><td><SteamBadge color={a.priority === 'high' ? 'copper' : 'brass'}>{a.priority}</SteamBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><SteamButton>Edit</SteamButton></Link></td></tr>))}</SteamTable></SteamPanel>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--steam-rule)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </SteamLayout>
    );
}
