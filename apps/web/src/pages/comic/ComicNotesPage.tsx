import { ComicLayout } from '@/layouts/ComicLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { comicNotesTheme } from '@/components/notes/shared/theme-configs';

// Comic panel with bold black borders
function ComicPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border-4 border-black ${className || ''}`}
            style={{
                boxShadow: '4px 4px 0 black',
            }}
        >
            {children}
        </div>
    );
}

export function ComicNotesPage() {
    return (
        <NotesThemeProvider theme={comicNotesTheme}>
            <NotesPageLayout LayoutWrapper={ComicLayout} PanelWrapper={ComicPanel} />
        </NotesThemeProvider>
    );
}
