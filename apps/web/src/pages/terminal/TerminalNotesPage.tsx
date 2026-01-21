import { TerminalLayout } from '@/layouts/TerminalLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { terminalNotesTheme } from '@/components/notes/shared/theme-configs';

/**
 * Terminal Notes Page
 * 
 * Wraps the shared NotesPageLayout with Terminal-specific styling:
 * - TerminalLayout: Retro terminal shell with status bar
 * - ASCII folder icons: [+] [-] style instead of chevrons
 * - Green/amber color scheme on black background
 * - vi-style editor terminology
 * 
 * The Terminal theme is characterized by:
 * - Retro command-line aesthetic
 * - Green-on-black with amber accents
 * - Monospace typography throughout
 * - Unix/hacker terminology ("BUFFER", "vi", "MKDIR")
 */

// Simple panel wrapper for Terminal (no special component, just styled div)
function TerminalPanel({ children, className }: { children: React.ReactNode; className?: string; glow?: boolean }) {
    return (
        <div className={`bg-[#0a0a0a] border border-[#333] ${className || ''}`}>
            {children}
        </div>
    );
}

export function TerminalNotesPage() {
    return (
        <NotesThemeProvider theme={terminalNotesTheme}>
            <NotesPageLayout
                LayoutWrapper={TerminalLayout}
                PanelWrapper={TerminalPanel}
            />
        </NotesThemeProvider>
    );
}
