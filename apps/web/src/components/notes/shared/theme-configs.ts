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
// GLASS THEME
// ====================

export const glassNotesTheme: NotesThemeConfig = {
    id: 'glass',
    name: 'Glass',
    layoutComponent: 'GlassLayout',
    panelClass: 'glass-panel',
    panelGlow: false,
    colors: {
        primary: 'text-white',
        primaryHover: 'hover:text-sky-200',
        accent: 'text-sky-300',
        bg: 'bg-white/5',
        bgSecondary: 'bg-white/10',
        bgTertiary: 'bg-white/15',
        border: 'border-white/20',
        borderActive: 'border-sky-400',
        text: 'text-white',
        textSecondary: 'text-white/70',
        textMuted: 'text-white/40',
        danger: 'text-red-400',
        warning: 'text-amber-400',
        success: 'text-emerald-400',
    },
    fontFamily: 'font-sans',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'Select a Note',
    emptyStateSubtitle: 'Choose a document to view or edit.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: white !important; }`,
    toolbarCSS: `.notes-toolbar { background: rgba(255,255,255,0.1) !important; backdrop-filter: blur(10px); }`,
    tocCSS: `.notes-toc { background: rgba(255,255,255,0.05) !important; }`,
};

// ====================
// CRT THEME
// ====================

export const crtNotesTheme: NotesThemeConfig = {
    id: 'crt',
    name: 'CRT',
    layoutComponent: 'CRTLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-[#33ff33]',
        primaryHover: 'hover:text-[#66ff66]',
        accent: 'text-[#22cc22]',
        bg: 'bg-[#0a0a0a]',
        bgSecondary: 'bg-[#111]',
        bgTertiary: 'bg-[#1a1a1a]',
        border: 'border-[#33ff33]/30',
        borderActive: 'border-[#33ff33]',
        text: 'text-[#33ff33]',
        textSecondary: 'text-[#33ff33]/70',
        textMuted: 'text-[#33ff33]/40',
        danger: 'text-[#ff3333]',
        warning: 'text-[#ffff33]',
        success: 'text-[#33ff33]',
    },
    fontFamily: 'font-mono',
    fontMono: true,
    folderStyle: 'ascii',
    emptyStateTitle: 'NO SIGNAL',
    emptyStateSubtitle: 'Tune to a frequency to display document.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #33ff33 !important; font-family: monospace !important; text-shadow: 0 0 5px #33ff33; }`,
    toolbarCSS: `.notes-toolbar { background: #0a0a0a !important; border-bottom: 2px solid #33ff33 !important; }`,
    tocCSS: `.notes-toc { background: #0a0a0a !important; }`,
};

// ====================
// BRUTALIST THEME
// ====================

export const brutalistNotesTheme: NotesThemeConfig = {
    id: 'brutalist',
    name: 'Brutalist',
    layoutComponent: 'BrutalistLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-black',
        primaryHover: 'hover:text-gray-800',
        accent: 'text-black',
        bg: 'bg-white',
        bgSecondary: 'bg-gray-100',
        bgTertiary: 'bg-gray-200',
        border: 'border-black',
        borderActive: 'border-black',
        text: 'text-black',
        textSecondary: 'text-gray-700',
        textMuted: 'text-gray-500',
        danger: 'text-red-600',
        warning: 'text-yellow-600',
        success: 'text-green-600',
    },
    fontFamily: 'font-mono',
    fontMono: true,
    folderStyle: 'modern',
    emptyStateTitle: 'NO DOCUMENT',
    emptyStateSubtitle: 'Select a file.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: black !important; font-family: monospace !important; }`,
    toolbarCSS: `.notes-toolbar { background: white !important; border-bottom: 4px solid black !important; }`,
    tocCSS: `.notes-toc { background: #f5f5f5 !important; border-left: 4px solid black !important; }`,
};

// ====================
// NEWSPRINT THEME
// ====================

export const newsprintNotesTheme: NotesThemeConfig = {
    id: 'newsprint',
    name: 'Newsprint',
    layoutComponent: 'NewsprintLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-stone-900',
        primaryHover: 'hover:text-stone-700',
        accent: 'text-stone-600',
        bg: 'bg-[#f5f0e6]',
        bgSecondary: 'bg-[#ebe6dc]',
        bgTertiary: 'bg-[#e0dbd1]',
        border: 'border-stone-300',
        borderActive: 'border-stone-600',
        text: 'text-stone-900',
        textSecondary: 'text-stone-600',
        textMuted: 'text-stone-400',
        danger: 'text-red-700',
        warning: 'text-amber-700',
        success: 'text-green-700',
    },
    fontFamily: 'font-serif',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'No Article Selected',
    emptyStateSubtitle: 'Choose a story from the archives.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #1c1917 !important; font-family: Georgia, serif !important; }`,
    toolbarCSS: `.notes-toolbar { background: #f5f0e6 !important; border-bottom: 2px solid #78716c !important; }`,
    tocCSS: `.notes-toc { background: #ebe6dc !important; }`,
};

// ====================
// ART DECO THEME
// ====================

export const artDecoNotesTheme: NotesThemeConfig = {
    id: 'artdeco',
    name: 'Art Deco',
    layoutComponent: 'ArtDecoLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-[#d4af37]',
        primaryHover: 'hover:text-[#f0c850]',
        accent: 'text-[#c9a227]',
        bg: 'bg-[#1a1a2e]',
        bgSecondary: 'bg-[#16213e]',
        bgTertiary: 'bg-[#1f2a4a]',
        border: 'border-[#d4af37]/30',
        borderActive: 'border-[#d4af37]',
        text: 'text-[#f5f5dc]',
        textSecondary: 'text-[#f5f5dc]/70',
        textMuted: 'text-[#f5f5dc]/40',
        danger: 'text-[#c94040]',
        warning: 'text-[#d4af37]',
        success: 'text-[#50c878]',
    },
    fontFamily: 'font-serif',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'Select a Document',
    emptyStateSubtitle: 'Choose from the collection.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #f5f5dc !important; }`,
    toolbarCSS: `.notes-toolbar { background: #16213e !important; border-bottom: 2px solid #d4af37 !important; }`,
    tocCSS: `.notes-toc { background: #1a1a2e !important; border-left: 2px solid #d4af37 !important; }`,
};

// ====================
// CANVAS THEME
// ====================

export const canvasNotesTheme: NotesThemeConfig = {
    id: 'canvas',
    name: 'Canvas',
    layoutComponent: 'CanvasLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-amber-800',
        primaryHover: 'hover:text-amber-700',
        accent: 'text-amber-600',
        bg: 'bg-[#faf8f5]',
        bgSecondary: 'bg-[#f5f2ed]',
        bgTertiary: 'bg-[#ebe7e0]',
        border: 'border-amber-200',
        borderActive: 'border-amber-500',
        text: 'text-stone-800',
        textSecondary: 'text-stone-600',
        textMuted: 'text-stone-400',
        danger: 'text-red-600',
        warning: 'text-amber-600',
        success: 'text-green-600',
    },
    fontFamily: 'font-serif',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'Gallery Empty',
    emptyStateSubtitle: 'Select a piece from the collection.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #44403c !important; font-family: Georgia, serif !important; }`,
    toolbarCSS: `.notes-toolbar { background: #faf8f5 !important; border-bottom: 1px solid #d6cfc4 !important; }`,
    tocCSS: `.notes-toc { background: #f5f2ed !important; }`,
};

// ====================
// ARCHIVE THEME
// ====================

export const archiveNotesTheme: NotesThemeConfig = {
    id: 'archive',
    name: 'Archive',
    layoutComponent: 'ArchiveLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-amber-700',
        primaryHover: 'hover:text-amber-600',
        accent: 'text-amber-500',
        bg: 'bg-[#2a2520]',
        bgSecondary: 'bg-[#352f28]',
        bgTertiary: 'bg-[#403830]',
        border: 'border-amber-900/50',
        borderActive: 'border-amber-600',
        text: 'text-amber-100',
        textSecondary: 'text-amber-200/70',
        textMuted: 'text-amber-300/40',
        danger: 'text-red-400',
        warning: 'text-amber-400',
        success: 'text-green-400',
    },
    fontFamily: 'font-serif',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'No Document Open',
    emptyStateSubtitle: 'Select a file from the archive.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #fef3c7 !important; font-family: Georgia, serif !important; }`,
    toolbarCSS: `.notes-toolbar { background: #352f28 !important; border-bottom: 1px solid rgba(217,119,6,0.3) !important; }`,
    tocCSS: `.notes-toc { background: #2a2520 !important; }`,
};

// ====================
// PAPER THEME
// ====================

export const paperNotesTheme: NotesThemeConfig = {
    id: 'paper',
    name: 'Paper',
    layoutComponent: 'PaperLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-gray-800',
        primaryHover: 'hover:text-gray-600',
        accent: 'text-blue-600',
        bg: 'bg-white',
        bgSecondary: 'bg-gray-50',
        bgTertiary: 'bg-gray-100',
        border: 'border-gray-200',
        borderActive: 'border-blue-500',
        text: 'text-gray-800',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-400',
        danger: 'text-red-500',
        warning: 'text-amber-500',
        success: 'text-green-500',
    },
    fontFamily: 'font-sans',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'No Document Selected',
    emptyStateSubtitle: 'Choose a note to begin editing.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #1f2937 !important; }`,
    toolbarCSS: `.notes-toolbar { background: white !important; border-bottom: 1px solid #e5e7eb !important; }`,
    tocCSS: `.notes-toc { background: #f9fafb !important; }`,
};

// ====================
// STEAM THEME
// ====================

export const steamNotesTheme: NotesThemeConfig = {
    id: 'steam',
    name: 'Steam',
    layoutComponent: 'SteamLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-[#c9a227]',
        primaryHover: 'hover:text-[#ddb82a]',
        accent: 'text-[#8b6914]',
        bg: 'bg-[#2d2215]',
        bgSecondary: 'bg-[#3d2e1a]',
        bgTertiary: 'bg-[#4a3820]',
        border: 'border-[#c9a227]/30',
        borderActive: 'border-[#c9a227]',
        text: 'text-[#e8d5b3]',
        textSecondary: 'text-[#c9b896]',
        textMuted: 'text-[#8a7a5a]',
        danger: 'text-[#c94040]',
        warning: 'text-[#c9a227]',
        success: 'text-[#4a8c4a]',
    },
    fontFamily: 'font-serif',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'Engine Idle',
    emptyStateSubtitle: 'Engage a document to start.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #e8d5b3 !important; }`,
    toolbarCSS: `.notes-toolbar { background: #3d2e1a !important; border-bottom: 2px solid #c9a227 !important; }`,
    tocCSS: `.notes-toc { background: #2d2215 !important; }`,
};

// ====================
// SKEU THEME
// ====================

export const skeuNotesTheme: NotesThemeConfig = {
    id: 'skeu',
    name: 'Skeu',
    layoutComponent: 'SkeuLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-blue-600',
        primaryHover: 'hover:text-blue-500',
        accent: 'text-blue-500',
        bg: 'bg-gradient-to-b from-gray-100 to-gray-200',
        bgSecondary: 'bg-white',
        bgTertiary: 'bg-gray-50',
        border: 'border-gray-300',
        borderActive: 'border-blue-500',
        text: 'text-gray-800',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-400',
        danger: 'text-red-500',
        warning: 'text-amber-500',
        success: 'text-green-500',
    },
    fontFamily: 'font-sans',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'No Document Open',
    emptyStateSubtitle: 'Double-click a file to open.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #1f2937 !important; }`,
    toolbarCSS: `.notes-toolbar { background: linear-gradient(to bottom, #f3f4f6, #e5e7eb) !important; border-bottom: 1px solid #d1d5db !important; }`,
    tocCSS: `.notes-toc { background: #f9fafb !important; }`,
};

// ====================
// ZEN THEME
// ====================

export const zenNotesTheme: NotesThemeConfig = {
    id: 'zen',
    name: 'Zen',
    layoutComponent: 'ZenLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-stone-600',
        primaryHover: 'hover:text-stone-500',
        accent: 'text-stone-500',
        bg: 'bg-[#f8f5f0]',
        bgSecondary: 'bg-[#f0ebe3]',
        bgTertiary: 'bg-[#e8e2d8]',
        border: 'border-stone-200',
        borderActive: 'border-stone-500',
        text: 'text-stone-700',
        textSecondary: 'text-stone-500',
        textMuted: 'text-stone-400',
        danger: 'text-red-500',
        warning: 'text-amber-500',
        success: 'text-green-500',
    },
    fontFamily: 'font-sans',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: '空 Empty',
    emptyStateSubtitle: 'Select a note to begin your practice.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #44403c !important; line-height: 2 !important; }`,
    toolbarCSS: `.notes-toolbar { background: #f8f5f0 !important; border-bottom: 1px solid #d6d3d1 !important; }`,
    tocCSS: `.notes-toc { background: #f0ebe3 !important; }`,
};

// ====================
// AURORA THEME
// ====================

export const auroraNotesTheme: NotesThemeConfig = {
    id: 'aurora',
    name: 'Aurora',
    layoutComponent: 'AuroraLayout',
    panelClass: '',
    panelGlow: true,
    colors: {
        primary: 'text-purple-400',
        primaryHover: 'hover:text-purple-300',
        accent: 'text-pink-400',
        bg: 'bg-[#0f0a1a]',
        bgSecondary: 'bg-[#1a1025]',
        bgTertiary: 'bg-[#251530]',
        border: 'border-purple-500/30',
        borderActive: 'border-purple-400',
        text: 'text-purple-100',
        textSecondary: 'text-purple-200/70',
        textMuted: 'text-purple-300/40',
        danger: 'text-red-400',
        warning: 'text-amber-400',
        success: 'text-emerald-400',
    },
    fontFamily: 'font-sans',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'Awaiting Light',
    emptyStateSubtitle: 'Select a note to illuminate.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #e9d5ff !important; }`,
    toolbarCSS: `.notes-toolbar { background: rgba(26, 16, 37, 0.8) !important; backdrop-filter: blur(8px); border-bottom: 1px solid rgba(168, 85, 247, 0.3) !important; }`,
    tocCSS: `.notes-toc { background: rgba(15, 10, 26, 0.8) !important; }`,
};

// ====================
// COMIC THEME
// ====================

export const comicNotesTheme: NotesThemeConfig = {
    id: 'comic',
    name: 'Comic',
    layoutComponent: 'ComicLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-[#ff3366]',
        primaryHover: 'hover:text-[#ff5588]',
        accent: 'text-[#ffcc00]',
        bg: 'bg-[#fffef0]',
        bgSecondary: 'bg-white',
        bgTertiary: 'bg-yellow-50',
        border: 'border-black',
        borderActive: 'border-[#ff3366]',
        text: 'text-black',
        textSecondary: 'text-gray-700',
        textMuted: 'text-gray-400',
        danger: 'text-red-600',
        warning: 'text-[#ffcc00]',
        success: 'text-green-600',
    },
    fontFamily: 'font-sans',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'POW! No Page!',
    emptyStateSubtitle: 'Select a panel to read.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: black !important; font-family: 'Comic Sans MS', cursive !important; }`,
    toolbarCSS: `.notes-toolbar { background: white !important; border-bottom: 3px solid black !important; }`,
    tocCSS: `.notes-toc { background: #fffef0 !important; border-left: 3px solid black !important; }`,
};

// ====================
// EXEC THEME
// ====================

export const execNotesTheme: NotesThemeConfig = {
    id: 'exec',
    name: 'Exec',
    layoutComponent: 'ExecLayout',
    panelClass: '',
    panelGlow: false,
    colors: {
        primary: 'text-slate-800',
        primaryHover: 'hover:text-slate-600',
        accent: 'text-blue-700',
        bg: 'bg-slate-50',
        bgSecondary: 'bg-white',
        bgTertiary: 'bg-slate-100',
        border: 'border-slate-200',
        borderActive: 'border-blue-600',
        text: 'text-slate-800',
        textSecondary: 'text-slate-600',
        textMuted: 'text-slate-400',
        danger: 'text-red-600',
        warning: 'text-amber-600',
        success: 'text-green-600',
    },
    fontFamily: 'font-sans',
    fontMono: false,
    folderStyle: 'modern',
    emptyStateTitle: 'No Document Selected',
    emptyStateSubtitle: 'Choose a briefing to review.',
    routePrefix: '/plugins/notes',
    editorCSS: `.notes-editor-wrapper .ProseMirror { color: #1e293b !important; }`,
    toolbarCSS: `.notes-toolbar { background: white !important; border-bottom: 1px solid #e2e8f0 !important; }`,
    tocCSS: `.notes-toc { background: #f8fafc !important; }`,
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
    glass: glassNotesTheme,
    crt: crtNotesTheme,
    brutalist: brutalistNotesTheme,
    newsprint: newsprintNotesTheme,
    artdeco: artDecoNotesTheme,
    canvas: canvasNotesTheme,
    archive: archiveNotesTheme,
    paper: paperNotesTheme,
    steam: steamNotesTheme,
    skeu: skeuNotesTheme,
    zen: zenNotesTheme,
    aurora: auroraNotesTheme,
    comic: comicNotesTheme,
    exec: execNotesTheme,
};

export function getNotesTheme(themeId: string): NotesThemeConfig {
    const theme = notesThemeRegistry[themeId];
    if (!theme) {
        console.warn(`Notes theme "${themeId}" not found, falling back to HUD`);
        return hudNotesTheme;
    }
    return theme;
}
