import { PixelLayout } from '@/layouts/PixelLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { pixelNotesTheme } from '@/components/notes/shared/theme-configs';

/**
 * Pixel Notes Page
 * 
 * Wraps the shared NotesPageLayout with Pixel-specific styling:
 * - PixelLayout: Retro 8-bit game aesthetic
 * - NES-inspired color palette (navy, gold, red)
 * - Chunky pixel borders
 * - ASCII folder icons for retro feel
 * 
 * The Pixel theme is characterized by:
 * - 8-bit retro game aesthetic
 * - "Press Start 2P" pixelated font
 * - Thick, blocky borders
 * - Game-inspired terminology ("PRESS START", "GAME OVER")
 */

// Pixel panel with chunky retro borders
function PixelPanel({ children, className }: { children: React.ReactNode; className?: string; glow?: boolean }) {
    return (
        <div className={`bg-[#023047] border-4 border-[#fcbf49] ${className || ''}`}
            style={{
                boxShadow: '4px 4px 0px #003d5c, 8px 8px 0px rgba(252, 191, 73, 0.3)',
                imageRendering: 'pixelated',
            }}
        >
            {children}
        </div>
    );
}

export function PixelNotesPage() {
    return (
        <NotesThemeProvider theme={pixelNotesTheme}>
            <NotesPageLayout
                LayoutWrapper={PixelLayout}
                PanelWrapper={PixelPanel}
            />
        </NotesThemeProvider>
    );
}
