import { CanvasLayout } from '@/layouts/CanvasLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { canvasNotesTheme } from '@/components/notes/shared/theme-configs';

// Canvas panel with museum gallery feel
function CanvasPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#faf8f5] border border-amber-200 shadow-md ${className || ''}`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        >
            {children}
        </div>
    );
}

export function CanvasNotesPage() {
    return (
        <NotesThemeProvider theme={canvasNotesTheme}>
            <NotesPageLayout LayoutWrapper={CanvasLayout} PanelWrapper={CanvasPanel} />
        </NotesThemeProvider>
    );
}
