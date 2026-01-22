import { CRTLayout } from '@/layouts/CRTLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { crtNotesTheme } from '@/components/notes/shared/theme-configs';

// CRT panel with scanline effect
function CRTPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#0a0a0a] border-2 border-[#33ff33]/50 ${className || ''}`}
            style={{
                boxShadow: '0 0 20px rgba(51, 255, 51, 0.2), inset 0 0 100px rgba(51, 255, 51, 0.05)',
            }}
        >
            {children}
        </div>
    );
}

export function CRTNotesPage() {
    return (
        <NotesThemeProvider theme={crtNotesTheme}>
            <NotesPageLayout LayoutWrapper={CRTLayout} PanelWrapper={CRTPanel} />
        </NotesThemeProvider>
    );
}
