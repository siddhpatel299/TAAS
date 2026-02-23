import { SteamLayout } from '@/layouts/SteamLayout';
import { NotesThemeProvider } from '@/components/notes/shared/NotesThemeContext';
import { NotesPageLayout } from '@/components/notes/shared/NotesPageLayout';
import { steamNotesTheme } from '@/components/notes/shared/theme-configs';
import { cn } from '@/lib/utils';

// Premium Glass Panel
function SteamPanel({ children, className, glow }: { children: React.ReactNode; className?: string; glow?: boolean }) {
    return (
        <div
            className={cn(
                "steam-panel flex flex-col transition-all duration-300",
                glow && "shadow-glow",
                className
            )}
        >
            {children}
        </div>
    );
}

export function SteamNotesPage() {
    return (
        <NotesThemeProvider theme={steamNotesTheme}>
            <NotesPageLayout LayoutWrapper={SteamLayout} PanelWrapper={SteamPanel} />
        </NotesThemeProvider>
    );
}
