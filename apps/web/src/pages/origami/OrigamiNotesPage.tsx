import { OrigamiLayout } from '@/layouts/OrigamiLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { origamiNotesTheme } from '@/components/notes/shared/theme-configs';

/**
 * Origami Notes Page
 * 
 * Wraps the shared NotesPageLayout with Origami-specific styling:
 * - OrigamiLayout: Japanese paper craft aesthetic
 * - Warm cream/amber color palette
 * - Serif typography for elegance
 * - Paper texture-inspired backgrounds
 * 
 * The Origami theme is characterized by:
 * - Japanese-inspired minimalist aesthetic
 * - Warm cream and rose accent colors
 * - Elegant serif typography
 * - Folded paper metaphors
 */

// Origami panel with paper-like styling
function OrigamiPanel({ children, className }: { children: React.ReactNode; className?: string; glow?: boolean }) {
    return (
        <div className={`bg-white border border-amber-200 rounded-sm shadow-md ${className || ''}`}
            style={{
                background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
            }}
        >
            {/* Subtle fold corner effect */}
            <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-l-[24px] border-t-amber-100 border-l-transparent" />
            </div>
            {children}
        </div>
    );
}

export function OrigamiNotesPage() {
    return (
        <NotesThemeProvider theme={origamiNotesTheme}>
            <NotesPageLayout
                LayoutWrapper={OrigamiLayout}
                PanelWrapper={OrigamiPanel}
            />
        </NotesThemeProvider>
    );
}
