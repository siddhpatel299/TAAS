import { createContext, useContext, ReactNode } from 'react';

// ====================
// THEME CONFIGURATION TYPES
// ====================

export interface NotesThemeColors {
    primary: string;        // Main accent color (e.g., 'cyan-400', '#00b4d8')
    primaryHover: string;   // Hover state
    accent: string;         // Secondary accent
    bg: string;             // Background color
    bgSecondary: string;    // Secondary background (panels)
    bgTertiary: string;     // Tertiary background (inputs)
    border: string;         // Border color
    borderActive: string;   // Active/selected border
    text: string;           // Primary text
    textSecondary: string;  // Secondary text
    textMuted: string;      // Muted/placeholder text
    danger: string;         // Delete/error color
    warning: string;        // Warning/pin color
    success: string;        // Success color
}

export interface NotesThemeConfig {
    id: string;
    name: string;

    // Layout wrapper component name
    layoutComponent: string;

    // Panel styling
    panelClass: string;
    panelGlow?: boolean;

    // Colors (can be Tailwind classes or CSS values)
    colors: NotesThemeColors;

    // Typography
    fontFamily: string;
    fontMono: boolean;

    // Folder tree style
    folderStyle: 'modern' | 'ascii' | 'technical';

    // Empty state messaging
    emptyStateTitle: string;
    emptyStateSubtitle: string;

    // Editor-specific CSS override string
    editorCSS: string;

    // Toolbar override CSS
    toolbarCSS: string;

    // TOC override CSS
    tocCSS: string;

    // Route prefix for navigation
    routePrefix: string;
}

// ====================
// CONTEXT
// ====================

interface NotesThemeContextValue {
    theme: NotesThemeConfig;
    themeId: string;
}

const NotesThemeContext = createContext<NotesThemeContextValue | null>(null);

export function useNotesTheme() {
    const context = useContext(NotesThemeContext);
    if (!context) {
        throw new Error('useNotesTheme must be used within a NotesThemeProvider');
    }
    return context;
}

// ====================
// PROVIDER
// ====================

interface NotesThemeProviderProps {
    theme: NotesThemeConfig;
    children: ReactNode;
}

export function NotesThemeProvider({ theme, children }: NotesThemeProviderProps) {
    return (
        <NotesThemeContext.Provider value={{ theme, themeId: theme.id }}>
            {children}
        </NotesThemeContext.Provider>
    );
}

export { NotesThemeContext };
