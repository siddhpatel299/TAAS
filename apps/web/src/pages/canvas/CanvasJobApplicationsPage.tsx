import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft, Loader2, Briefcase } from 'lucide-react';
import { CanvasLayout } from '@/layouts/CanvasLayout';
import { CanvasWindow, CanvasButton, CanvasBadge, CanvasTable, CanvasEmpty, CanvasTitle } from '@/components/canvas/CanvasComponents';
import { PaginationBar } from '@/components/job-tracker/PaginationBar';
import { useJobApplicationsApi } from '@/hooks/useJobApplicationsApi';
import { cn } from '@/lib/utils';

export function CanvasJobApplicationsPage() {
    const navigate = useNavigate();
    const { apps, loading, page, total, hasMore, pageSize, statusFilter, searchInput, setSearchInput, setStatusFilter, goToPage } = useJobApplicationsApi();
    const colors: Record<string, 'blue' | 'pink' | 'purple'> = { applied: 'blue', interviewing: 'purple', offered: 'blue', rejected: 'pink' };
    const statuses = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'];

    return (
        <CanvasLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><Link to="/plugins/job-tracker"><CanvasButton><ArrowLeft className="w-4 h-4" /></CanvasButton></Link><CanvasTitle>Applications</CanvasTitle></div>
                <CanvasButton variant="primary" onClick={() => navigate('/plugins/job-tracker/applications/new')}><Plus className="w-4 h-4" /> New</CanvasButton>
            </div>
            <CanvasWindow title="Filters" icon={<Search className="w-4 h-4" />} zLevel="far" className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">{statuses.map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("canvas-btn !py-1.5", statusFilter === s && "canvas-btn-primary")}>{s}</button>))}</div>
                    <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--canvas-text-muted)]" /><input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." className="canvas-input !pl-10" /></div>
                </div>
            </CanvasWindow>
            {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--canvas-accent)]" /></div> :
                apps.length === 0 ? <CanvasEmpty text={searchInput || statusFilter !== 'all' ? 'No matches' : 'No applications'} icon={<Briefcase className="w-10 h-10" />} /> :
                    <CanvasWindow title={`Applications (${total})`} icon={<Briefcase className="w-4 h-4" />} zLevel="mid"><CanvasTable headers={['Company', 'Position', 'Status', 'Priority', '']}>{apps.map((a) => (<tr key={a.id}><td className="font-medium">{a.company}</td><td>{a.jobTitle}</td><td><CanvasBadge color={colors[a.status] || 'blue'}>{a.status}</CanvasBadge></td><td><CanvasBadge color={a.priority === 'high' ? 'pink' : 'blue'}>{a.priority}</CanvasBadge></td><td><Link to={`/plugins/job-tracker/applications/${a.id}`}><CanvasButton>Edit</CanvasButton></Link></td></tr>))}</CanvasTable></CanvasWindow>}

            {apps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--canvas-border)]">
                    <PaginationBar currentPage={page} totalItems={total} pageSize={pageSize} hasMore={hasMore} onPageChange={goToPage} />
                </div>
            )}
        </CanvasLayout>
    );
}
