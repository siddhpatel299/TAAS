import { GlassLayout } from '@/layouts/GlassLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { glassNotesTheme } from '@/components/notes/shared/theme-configs';

// Glass panel with frosted effect
function GlassPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl ${className || ''}`}>
            {children}
        </div>
    );
}

export function GlassNotesPage() {
    return (
        <NotesThemeProvider theme={glassNotesTheme}>
            <NotesPageLayout LayoutWrapper={GlassLayout} PanelWrapper={GlassPanel} />
        </NotesThemeProvider>
    );
}
