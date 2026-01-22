import { NewsprintLayout } from '@/layouts/NewsprintLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { newsprintNotesTheme } from '@/components/notes/shared/theme-configs';

// Newsprint panel with paper texture feel
function NewsprintPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#f5f0e6] border border-stone-300 shadow-sm ${className || ''}`}
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Crect width=\'1\' height=\'100\' x=\'50\'/%3E%3Crect width=\'100\' height=\'1\' y=\'50\'/%3E%3C/g%3E%3C/svg%3E")' }}
        >
            {children}
        </div>
    );
}

export function NewsprintNotesPage() {
    return (
        <NotesThemeProvider theme={newsprintNotesTheme}>
            <NotesPageLayout LayoutWrapper={NewsprintLayout} PanelWrapper={NewsprintPanel} />
        </NotesThemeProvider>
    );
}
