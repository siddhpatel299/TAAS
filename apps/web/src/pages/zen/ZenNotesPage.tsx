import { ZenLayout } from '@/layouts/ZenLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { zenNotesTheme } from '@/components/notes/shared/theme-configs';

// Zen panel with minimal, calming styling
function ZenPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#f8f5f0] border border-stone-200 rounded ${className || ''}`}>
            {children}
        </div>
    );
}

export function ZenNotesPage() {
    return (
        <NotesThemeProvider theme={zenNotesTheme}>
            <NotesPageLayout LayoutWrapper={ZenLayout} PanelWrapper={ZenPanel} />
        </NotesThemeProvider>
    );
}
