import { BrutalistLayout } from '@/layouts/BrutalistLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { brutalistNotesTheme } from '@/components/notes/shared/theme-configs';

// Brutalist panel with thick black borders
function BrutalistPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border-4 border-black ${className || ''}`}>
            {children}
        </div>
    );
}

export function BrutalistNotesPage() {
    return (
        <NotesThemeProvider theme={brutalistNotesTheme}>
            <NotesPageLayout LayoutWrapper={BrutalistLayout} PanelWrapper={BrutalistPanel} />
        </NotesThemeProvider>
    );
}
