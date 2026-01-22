import { ArchiveLayout } from '@/layouts/ArchiveLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { archiveNotesTheme } from '@/components/notes/shared/theme-configs';

// Archive panel with aged paper effect
function ArchivePanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#352f28] border border-amber-900/40 shadow-lg ${className || ''}`}>
            {children}
        </div>
    );
}

export function ArchiveNotesPage() {
    return (
        <NotesThemeProvider theme={archiveNotesTheme}>
            <NotesPageLayout LayoutWrapper={ArchiveLayout} PanelWrapper={ArchivePanel} />
        </NotesThemeProvider>
    );
}
