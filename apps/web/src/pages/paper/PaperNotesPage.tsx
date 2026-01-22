import { PaperLayout } from '@/layouts/PaperLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { paperNotesTheme } from '@/components/notes/shared/theme-configs';

// Paper panel with clean white styling
function PaperPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className || ''}`}>
            {children}
        </div>
    );
}

export function PaperNotesPage() {
    return (
        <NotesThemeProvider theme={paperNotesTheme}>
            <NotesPageLayout LayoutWrapper={PaperLayout} PanelWrapper={PaperPanel} />
        </NotesThemeProvider>
    );
}
