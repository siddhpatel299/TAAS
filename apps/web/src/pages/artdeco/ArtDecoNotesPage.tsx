import { ArtDecoLayout } from '@/layouts/ArtDecoLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { artDecoNotesTheme } from '@/components/notes/shared/theme-configs';

// Art Deco panel with gold accents
function ArtDecoPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative bg-[#16213e] border border-[#d4af37]/40 ${className || ''}`}>
            {/* Art deco gold corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]" />
            {children}
        </div>
    );
}

export function ArtDecoNotesPage() {
    return (
        <NotesThemeProvider theme={artDecoNotesTheme}>
            <NotesPageLayout LayoutWrapper={ArtDecoLayout} PanelWrapper={ArtDecoPanel} />
        </NotesThemeProvider>
    );
}
