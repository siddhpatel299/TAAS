import { SkeuLayout } from '@/layouts/SkeuLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { skeuNotesTheme } from '@/components/notes/shared/theme-configs';

// Skeuomorphic panel with 3D gradient effect
function SkeuPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-300 rounded-lg shadow-md ${className || ''}`}
            style={{
                boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 4px 12px rgba(0,0,0,0.15)',
            }}
        >
            {children}
        </div>
    );
}

export function SkeuNotesPage() {
    return (
        <NotesThemeProvider theme={skeuNotesTheme}>
            <NotesPageLayout LayoutWrapper={SkeuLayout} PanelWrapper={SkeuPanel} />
        </NotesThemeProvider>
    );
}
