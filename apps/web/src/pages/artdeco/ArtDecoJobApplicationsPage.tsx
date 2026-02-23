import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { DecoCard, DecoButton, DecoBadge, DecoTable, DecoEmpty, DecoTitle } from '@/components/artdeco/ArtDecoComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function ArtDecoJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'gold' | 'sage' | 'rose'> = { applied: 'gold', interviewing: 'sage', offered: 'sage', rejected: 'rose' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <ArtDecoLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><Link to="/plugins/job-tracker"><DecoButton><ArrowLeft className="w-5 h-5" /></DecoButton></Link><DecoTitle>Applications</DecoTitle></div>
                <DecoButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-5 h-5" /> New</DecoButton>
            </div>
            <DecoCard className="!p-4 mb-6 flex items-center justify-between">
                <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("deco-btn !py-2", statusFilter === s && "deco-btn-primary")}>{s}</button>))}</div>
                <div className="relative w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--deco-gold-dark)]" /><input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="deco-input !pl-12" /></div>
            </DecoCard>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--deco-gold)]" /></div> :
                apps.length === 0 ? <DecoEmpty text={searchInput || statusFilter !== 'all' ? 'No matches' : 'No applications'} /> :
                    <DecoCard><DecoTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><DecoBadge color={colors[a.status] || 'gold'}>{a.status}</DecoBadge></td><td><DecoBadge color={a.priority === 'high' ? 'rose' : 'sage'}>{a.priority}</DecoBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><DecoButton>Edit</DecoButton></Link></td></tr>))}</DecoTable></DecoCard>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--deco-gold)]/30">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </ArtDecoLayout>
    );
}
