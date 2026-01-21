import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel } from '@/components/hud/HUDComponents';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { hudNotesTheme } from '@/components/notes/shared/theme-configs';

/**
 * HUD Notes Page
 * 
 * Wraps the shared NotesPageLayout with HUD-specific components:
 * - HUDLayout: Provides the main HUD shell with sidebar
 * - HUDPanel: Adds the signature cyan glow and panel styling
 * - hudNotesTheme: Cyan/dark color scheme, monospace fonts, "SYSTEM_IDLE" messaging
 * 
 * The HUD theme is characterized by:
 * - Futuristic sci-fi aesthetic
 * - Cyan/teal accent colors with glow effects
 * - Monospace typography
 * - Technical/military terminology ("DATA FILE", "INITIATE SEQUENCE")
 */
export function HUDNotesPage() {
    return (
        <NotesThemeProvider theme={hudNotesTheme}>
            <NotesPageLayout
                LayoutWrapper={HUDLayout}
                PanelWrapper={({ children, className, glow }) => (
                    <HUDPanel className={className} glow={glow}>
                        {children}
                    </HUDPanel>
                )}
            />
        </NotesThemeProvider>
    );
}
