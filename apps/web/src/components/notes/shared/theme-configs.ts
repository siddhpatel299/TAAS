import { NotesThemeConfig } from './NotesThemeContext';

// ====================
// HUD THEME
// ====================

export const hudNotesTheme: NotesThemeConfig = {
    id: 'hud',
    name: 'HUD',
    layoutComponent: 'HUDLayout',
    panelClass: 'hud-panel',
    panelGlow: true,
    colors: {
        primary: 'text-cyan-400',
        primaryHover: 'hover:text-cyan-300',
        accent: 'text-cyan-500',
        bg: 'bg-black',
        bgSecondary: 'bg-black/40',
        bgTertiary: 'bg-cyan-950/20',
        border: 'border-cyan-900/50',
        borderActive: 'border-cyan-500',
        text: 'text-gray-300',
        textSecondary: 'text-gray-400',
        textMuted: 'text-gray-600',
        danger: 'text-red-400',
        warning: 'text-amber-400',
        success: 'text-green-400',
    },
    fontFamily: 'font-mono',
    fontMono: true,
    folderStyle: 'modern',
    emptyStateTitle: 'SYSTEM_IDLE',
    emptyStateSubtitle: 'SELECT A DATA FILE TO INITIATE SEQUENCE',
    routePrefix: '/plugins/notes',
    editorCSS: `
        .notes-editor-wrapper .ProseMirror {
            color: #e2e8f0 !important;
            font-family: 'JetBrains Mono', ui-monospace, monospace !important;
            font-size: 14px !important;
            line-height: 1.7 !important;
        }
        .notes-editor-wrapper .ProseMirror h1,
        .notes-editor-wrapper .ProseMirror h2,
        .notes-editor-wrapper .ProseMirror h3 {
            color: #22d3ee !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid rgba(34, 211, 238, 0.2);
            padding-bottom: 0.5rem;
            margin-top: 1.5rem;
        }
        .notes-editor-wrapper .ProseMirror blockquote {
            border-left: 2px solid #06b6d4 !important;
            padding-left: 1rem;
            color: #67e8f9 !important;
            font-style: italic;
        }
        .notes-editor-wrapper .ProseMirror a {
            color: #00ffff !important;
            text-decoration: none;
            border-bottom: 1px dashed #00ffff;
        }
        .notes-editor-wrapper .ProseMirror code {
            background: rgba(34, 211, 238, 0.1) !important;
            color: #22d3ee !important;
        }
        .notes-editor-wrapper .ProseMirror pre {
            background: rgba(0, 0, 0, 0.5) !important;
            border: 1px solid rgba(34, 211, 238, 0.2) !important;
        }
    `,
    toolbarCSS: `
        .notes-toolbar {
            background-color: rgba(0, 0, 0, 0.6) !important;
            border-bottom: 1px solid rgba(34, 211, 238, 0.2) !important;
            backdrop-filter: blur(4px);
        }
        .notes-toolbar button {
            color: #64748b !important;
        }
        .notes-toolbar button:hover,
        .notes-toolbar button[data-active="true"] {
            color: #22d3ee !important;
            background-color: rgba(34, 211, 238, 0.1) !important;
        }
    `,
    tocCSS: `
        .notes-toc {
            background-color: transparent !important;
            border-right: none !important;
        }
        .notes-toc button {
            color: #94a3b8;
        }
        .notes-toc button:hover {
            background-color: rgba(34, 211, 238, 0.1) !important;
            color: #22d3ee !important;
        }
    `,
};

// ====================
// TERMINAL THEME
// ====================

export const terminalNotesTheme: NotesThemeConfig = {
    id: 'terminal',
    name: 'Terminal',
    layoutComponent: 'TerminalLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-green-400',
        primaryHover: 'hover:text-green-300',
        accent: 'text-amber-500',
        bg: 'bg-black',
        bgSecondary: 'bg-[#111]',
        bgTertiary: 'bg-[#0a0a0a]',
        border: 'border-[#333]',
        borderActive: 'border-green-500',
        text: 'text-gray-300',
        textSecondary: 'text-gray-500',
        textMuted: 'text-gray-700',
        danger: 'text-red-500',
        warning: 'text-amber-500',
        success: 'text-green-400',
    },
    fontFamily: 'font-mono',
    fontMono: true,
    folderStyle: 'ascii',
    emptyStateTitle: '[NO BUFFER SELECTED]',
    emptyStateSubtitle: 'Select a file to edit or create new.',
    routePrefix: '/plugins/notes',
    editorCSS: `
        .notes-editor-wrapper .ProseMirror {
            color: #ccc !important;
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
        }
        .notes-editor-wrapper .ProseMirror h1,
        .notes-editor-wrapper .ProseMirror h2, 
        .notes-editor-wrapper .ProseMirror h3 {
            color: #ffb000 !important;
            font-weight: bold;
            border-bottom: 1px dashed #333;
            padding-bottom: 0.5rem;
            margin-top: 1.5rem;
        }
        .notes-editor-wrapper .ProseMirror blockquote {
            border-left: 2px solid #00ff88 !important;
            color: #888 !important;
            margin-left: 0;
            padding-left: 1rem;
        }
        .notes-editor-wrapper .ProseMirror code {
            background: #222 !important;
            color: #00ff88 !important;
            padding: 0.2em 0.4em;
            border-radius: 0;
        }
        .notes-editor-wrapper .ProseMirror pre {
            background: #111 !important;
            border: 1px solid #333 !important;
        }
    `,
    toolbarCSS: `
        .notes-toolbar {
            background-color: #111 !important;
            border-bottom: 1px solid #333 !important;
        }
        .notes-toolbar button {
            color: #555 !important;
        }
        .notes-toolbar button:hover,
        .notes-toolbar button[data-active="true"] {
            color: #00ff88 !important;
            background-color: #222 !important;
        }
    `,
    tocCSS: `
        .notes-toc {
            background-color: #0a0a0a !important;
            border-left: 1px solid #333 !important;
        }
        .notes-toc button {
            color: #666;
        }
        .notes-toc button:hover {
            background-color: #222 !important;
            color: #00ff88 !important;
        }
    `,
};

// ====================
// BLUEPRINT THEME
// ====================

export const blueprintNotesTheme: NotesThemeConfig = {
    id: 'blueprint',
    name: 'Blueprint',
    layoutComponent: 'BlueprintLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-[#00b4d8]',
        primaryHover: 'hover:text-[#48cae4]',
        accent: 'text-[#0096c7]',
        bg: 'bg-[#0a1929]',
        bgSecondary: 'bg-[#0d2137]',
        bgTertiary: 'bg-[#0d2137]/50',
        border: 'border-[#0096c7]/30',
        borderActive: 'border-[#00b4d8]',
        text: 'text-[#e0f7fa]',
        textSecondary: 'text-[#e0f7fa]/70',
        textMuted: 'text-[#e0f7fa]/40',
        danger: 'text-[#ef476f]',
        warning: 'text-[#ff9f1c]',
        success: 'text-[#06d6a0]',
    },
    fontFamily: 'font-mono',
    fontMono: true,
    folderStyle: 'technical',
    emptyStateTitle: 'No Schematic Selected',
    emptyStateSubtitle: 'Select a document or create a new schematic.',
    routePrefix: '/plugins/notes',
    editorCSS: `
        .notes-editor-wrapper .ProseMirror {
            color: #e0f7fa !important;
            font-family: 'JetBrains Mono', monospace !important;
            line-height: 1.6 !important;
            min-height: 500px;
        }
        .notes-editor-wrapper .ProseMirror h1,
        .notes-editor-wrapper .ProseMirror h2, 
        .notes-editor-wrapper .ProseMirror h3 {
            color: #00b4d8 !important;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-left: 3px solid #00b4d8;
            padding-left: 1rem;
        }
        .notes-editor-wrapper .ProseMirror blockquote {
            border: 1px dashed #0096c7;
            background: rgba(0, 150, 199, 0.05);
            color: #00b4d8;
            padding: 1rem;
        }
    `,
    toolbarCSS: `
        .notes-toolbar {
            background-color: #0d2137 !important;
            border-bottom: 1px solid rgba(0, 150, 199, 0.3) !important;
        }
        .notes-toolbar button {
            color: #0096c7 !important;
        }
        .notes-toolbar button:hover,
        .notes-toolbar button[data-active="true"] {
            color: #00b4d8 !important;
            background-color: rgba(0, 150, 199, 0.1) !important;
        }
    `,
    tocCSS: `
        .notes-toc {
            background-color: #0d2137/50 !important;
            border-left: 1px solid rgba(0, 150, 199, 0.3) !important;
        }
        .notes-toc button {
            color: #0096c7;
        }
        .notes-toc button:hover {
            background-color: rgba(0, 150, 199, 0.1) !important;
            color: #00b4d8 !important;
        }
    `,
};

// ====================
// FOREST THEME
// ====================

export const forestNotesTheme: NotesThemeConfig = {
    id: 'forest',
    name: 'Forest',
    layoutComponent: 'ForestLayout',
    panelClass: 'forest-card',
    panelGlow: false,
    colors: {
        primary: 'text-emerald-400',
        primaryHover: 'hover:text-emerald-300',
        accent: 'text-lime-500',
        bg: 'bg-[#0a1f0a]',
        bgSecondary: 'bg-[#0f2a0f]',
        bgTertiary: 'bg-[#143a14]',
        border: 'border-emerald-900/50',
        borderActive: 'border-emerald-500',
        text: 'text-emerald-100',
        textSecondary: 'text-emerald-200/70',
        textMuted: 'text-emerald-900',
        danger: 'text-red-400',
        warning: 'text-amber-400',
        success: 'text-lime-400',
    },
    fontFamily: 'font-sans',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'No Document Selected',
    emptyStateSubtitle: 'Choose a note from the grove to begin.',
    routePrefix: '/plugins/notes',
    editorCSS: `
        .notes-editor-wrapper .ProseMirror {
            color: #d1fae5 !important;
            font-family: system-ui, sans-serif !important;
            line-height: 1.7 !important;
        }
        .notes-editor-wrapper .ProseMirror h1,
        .notes-editor-wrapper .ProseMirror h2, 
        .notes-editor-wrapper .ProseMirror h3 {
            color: #34d399 !important;
            border-bottom: 1px solid rgba(52, 211, 153, 0.2);
            padding-bottom: 0.5rem;
        }
        .notes-editor-wrapper .ProseMirror blockquote {
            border-left: 3px solid #10b981;
            background: rgba(16, 185, 129, 0.05);
            padding: 1rem;
        }
    `,
    toolbarCSS: `
        .notes-toolbar {
            background-color: #0f2a0f !important;
            border-bottom: 1px solid rgba(16, 185, 129, 0.2) !important;
        }
        .notes-toolbar button {
            color: #6ee7b7 !important;
        }
        .notes-toolbar button:hover,
        .notes-toolbar button[data-active="true"] {
            color: #34d399 !important;
            background-color: rgba(16, 185, 129, 0.1) !important;
        }
    `,
    tocCSS: `
        .notes-toc {
            background-color: #0f2a0f !important;
        }
        .notes-toc button:hover {
            background-color: rgba(16, 185, 129, 0.1) !important;
            color: #34d399 !important;
        }
    `,
};

// ====================
// PIXEL THEME
// ====================

export const pixelNotesTheme: NotesThemeConfig = {
    id: 'pixel',
    name: 'Pixel',
    layoutComponent: 'PixelLayout',
    panelClass: 'pixel-panel',
    panelGlow: false,
    colors: {
        primary: 'text-[#fcbf49]',
        primaryHover: 'hover:text-[#f77f00]',
        accent: 'text-[#d62828]',
        bg: 'bg-[#003049]',
        bgSecondary: 'bg-[#023047]',
        bgTertiary: 'bg-[#003d5c]',
        border: 'border-[#fcbf49]/30',
        borderActive: 'border-[#fcbf49]',
        text: 'text-[#eae2b7]',
        textSecondary: 'text-[#eae2b7]/70',
        textMuted: 'text-[#eae2b7]/40',
        danger: 'text-[#d62828]',
        warning: 'text-[#f77f00]',
        success: 'text-[#2a9d8f]',
    },
    fontFamily: 'font-pixel',
    fontMono: false,
    folderStyle: 'ascii',
    emptyStateTitle: '[ NO FILE LOADED ]',
    emptyStateSubtitle: 'Press START to select a document.',
    routePrefix: '/plugins/notes',
    editorCSS: `
        .notes-editor-wrapper .ProseMirror {
            color: #eae2b7 !important;
            font-family: 'Press Start 2P', cursive !important;
            font-size: 10px !important;
            line-height: 2 !important;
        }
        .notes-editor-wrapper .ProseMirror h1,
        .notes-editor-wrapper .ProseMirror h2, 
        .notes-editor-wrapper .ProseMirror h3 {
            color: #fcbf49 !important;
            text-transform: uppercase;
        }
    `,
    toolbarCSS: `
        .notes-toolbar {
            background-color: #023047 !important;
            border-bottom: 4px solid #fcbf49 !important;
        }
        .notes-toolbar button {
            color: #eae2b7 !important;
        }
        .notes-toolbar button:hover {
            color: #fcbf49 !important;
            background-color: #003d5c !important;
        }
    `,
    tocCSS: `
        .notes-toc {
            background-color: #023047 !important;
            border-left: 4px solid #fcbf49 !important;
        }
    `,
};

// ====================
// ORIGAMI THEME
// ====================

export const origamiNotesTheme: NotesThemeConfig = {
    id: 'origami',
    name: 'Origami',
    layoutComponent: 'OrigamiLayout',
    panelClass: 'origami-card',
    panelGlow: false,
    colors: {
        primary: 'text-rose-500',
        primaryHover: 'hover:text-rose-400',
        accent: 'text-amber-600',
        bg: 'bg-[#fef7ed]',
        bgSecondary: 'bg-white',
        bgTertiary: 'bg-amber-50',
        border: 'border-amber-200',
        borderActive: 'border-rose-400',
        text: 'text-stone-800',
        textSecondary: 'text-stone-600',
        textMuted: 'text-stone-400',
        danger: 'text-red-500',
        warning: 'text-amber-500',
        success: 'text-emerald-500',
    },
    fontFamily: 'font-serif',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'Select a Note',
    emptyStateSubtitle: 'Choose a document from the collection.',
    routePrefix: '/plugins/notes',
    editorCSS: `
        .notes-editor-wrapper .ProseMirror {
            color: #292524 !important;
            font-family: 'Noto Serif', Georgia, serif !important;
            line-height: 1.8 !important;
        }
        .notes-editor-wrapper .ProseMirror h1,
        .notes-editor-wrapper .ProseMirror h2, 
        .notes-editor-wrapper .ProseMirror h3 {
            color: #be185d !important;
            font-weight: 600;
        }
        .notes-editor-wrapper .ProseMirror blockquote {
            border-left: 3px solid #f59e0b;
            background: #fffbeb;
            padding: 1rem;
            font-style: italic;
        }
    `,
    toolbarCSS: `
        .notes-toolbar {
            background-color: #fffbeb !important;
            border-bottom: 1px solid #fde68a !important;
        }
        .notes-toolbar button {
            color: #92400e !important;
        }
        .notes-toolbar button:hover {
            color: #be185d !important;
            background-color: #fef3c7 !important;
        }
    `,
    tocCSS: `
        .notes-toc {
            background-color: #fffbeb !important;
            border-left: 1px solid #fde68a !important;
        }
        .notes-toc button:hover {
            background-color: #fef3c7 !important;
            color: #be185d !important;
        }
    `,
};

// ====================
// THEME REGISTRY
// ====================

export const notesThemeRegistry: Record<string, NotesThemeConfig> = {
    hud: hudNotesTheme,
    terminal: terminalNotesTheme,
    blueprint: blueprintNotesTheme,
    forest: forestNotesTheme,
    pixel: pixelNotesTheme,
    origami: origamiNotesTheme,
};

export function getNotesTheme(themeId: string): NotesThemeConfig {
    const theme = notesThemeRegistry[themeId];
    if (!theme) {
        console.warn(`Notes theme "${themeId}" not found, falling back to HUD`);
        return hudNotesTheme;
    }
    return theme;
}
