import { SteamLayout } from '@/layouts/SteamLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { steamNotesTheme } from '@/components/notes/shared/theme-configs';

// Steampunk panel with brass/copper accents
function SteamPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#3d2e1a] border-2 border-[#c9a227]/40 rounded-sm ${className || ''}`}
            style={{
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3)',
            }}
        >
            {/* Brass rivet corners */}
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-[#c9a227]/60" />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#c9a227]/60" />
            <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-[#c9a227]/60" />
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#c9a227]/60" />
            {children}
        </div>
    );
}

export function SteamNotesPage() {
    return (
        <NotesThemeProvider theme={steamNotesTheme}>
            <NotesPageLayout LayoutWrapper={SteamLayout} PanelWrapper={SteamPanel} />
        </NotesThemeProvider>
    );
}
