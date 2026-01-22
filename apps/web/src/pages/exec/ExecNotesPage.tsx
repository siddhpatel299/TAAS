import { ExecLayout } from '@/layouts/ExecLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { execNotesTheme } from '@/components/notes/shared/theme-configs';

// Executive panel with professional clean styling
function ExecPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className || ''}`}>
            {children}
        </div>
    );
}

export function ExecNotesPage() {
    return (
        <NotesThemeProvider theme={execNotesTheme}>
            <NotesPageLayout LayoutWrapper={ExecLayout} PanelWrapper={ExecPanel} />
        </NotesThemeProvider>
    );
}
