import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { blueprintNotesTheme } from '@/components/notes/shared/theme-configs';

/**
 * Blueprint Notes Page
 * 
 * Wraps the shared NotesPageLayout with Blueprint-specific styling:
 * - BlueprintLayout: Technical/architectural shell
 * - Grid background pattern
 * - Cyan/blue color scheme with dashed borders
 * - Technical CAD-like aesthetics
 * 
 * The Blueprint theme is characterized by:
 * - Architectural/engineering aesthetic
 * - Grid background patterns
 * - Technical corner decorations on cards
 * - Schematic terminology ("SCHEMATIC", "EXPLORER")
 */

// Blueprint panel with technical corners and subtle grid
function BlueprintPanel({ children, className }: { children: React.ReactNode; className?: string; glow?: boolean }) {
    return (
        <div className={`relative bg-[#0d2137]/50 border border-[#0096c7]/30 ${className || ''}`}>
            {/* Technical corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00b4d8]" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00b4d8]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#00b4d8]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#00b4d8]" />
            {children}
        </div>
    );
}

export function BlueprintNotesPage() {
    return (
        <NotesThemeProvider theme={blueprintNotesTheme}>
            <NotesPageLayout
                LayoutWrapper={BlueprintLayout}
                PanelWrapper={BlueprintPanel}
            />
        </NotesThemeProvider>
    );
}
