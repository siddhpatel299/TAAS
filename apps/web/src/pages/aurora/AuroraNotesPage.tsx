import { AuroraLayout } from '@/layouts/AuroraLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { auroraNotesTheme } from '@/components/notes/shared/theme-configs';

// Aurora panel with glowing purple effect
function AuroraPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#1a1025]/80 backdrop-blur-md border border-purple-500/30 rounded-xl ${className || ''}`}
            style={{
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.1)',
            }}
        >
            {children}
        </div>
    );
}

export function AuroraNotesPage() {
    return (
        <NotesThemeProvider theme={auroraNotesTheme}>
            <NotesPageLayout LayoutWrapper={AuroraLayout} PanelWrapper={AuroraPanel} />
        </NotesThemeProvider>
    );
}
