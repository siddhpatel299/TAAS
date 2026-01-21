import { ForestLayout } from '@/layouts/ForestLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { forestNotesTheme } from '@/components/notes/shared/theme-configs';

/**
 * Forest Notes Page
 * 
 * Wraps the shared NotesPageLayout with Forest-specific styling:
 * - ForestLayout: Nature-inspired organic shell
 * - Emerald/green color palette
 * - Rounded, organic panel shapes
 * - Nature-inspired terminology
 * 
 * The Forest theme is characterized by:
 * - Organic, nature-inspired aesthetic
 * - Green/emerald color palette
 * - Soft, rounded borders
 * - Natural terminology ("grove", "roots")
 */

// Forest panel with organic styling
function ForestPanel({ children, className }: { children: React.ReactNode; className?: string; glow?: boolean }) {
    return (
        <div className={`bg-[#0f2a0f] border border-emerald-900/50 rounded-lg shadow-lg shadow-emerald-900/20 ${className || ''}`}>
            {children}
        </div>
    );
}

export function ForestNotesPage() {
    return (
        <NotesThemeProvider theme={forestNotesTheme}>
            <NotesPageLayout
                LayoutWrapper={ForestLayout}
                PanelWrapper={ForestPanel}
            />
        </NotesThemeProvider>
    );
}
