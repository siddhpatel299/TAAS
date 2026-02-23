import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Node, mergeAttributes } from '@tiptap/core';
import { useEffect, useCallback, useState, useRef } from 'react';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Link as LinkIcon,
    CheckSquare,
    Quote,
    Minus,
    Table as TableIcon,
    Code2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Highlighter,
    Undo,
    Redo,
    Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Lightbulb, ChevronRight as ChevronRightIcon, Youtube } from 'lucide-react';

const lowlight = createLowlight(common);

// ====================
// CUSTOM EXTENSIONS
// ====================

// Callout Node Extension
const Callout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,
    draggable: true,
    addAttributes() {
        return {
            type: {
                default: 'info',
                parseHTML: (element: HTMLElement) => element.getAttribute('data-callout-type') || 'info',
                renderHTML: (attributes: Record<string, any>) => ({ 'data-callout-type': attributes.type }),
            },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-callout]' }];
    },
    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '', class: `callout callout-${HTMLAttributes['data-callout-type'] || 'info'}` }), 0];
    },
});

// Toggle NodeView React Component
function ToggleNodeView({ node, updateAttributes }: any) {
    const [isOpen, setIsOpen] = useState(node.attrs.open !== false);

    return (
        <NodeViewWrapper className="toggle-wrapper">
            <div className="toggle-header" contentEditable={false}>
                <button
                    className={`toggle-arrow-btn ${isOpen ? 'open' : ''}`}
                    onClick={() => {
                        const next = !isOpen;
                        setIsOpen(next);
                        updateAttributes({ open: next });
                    }}
                    type="button"
                >
                    ▶
                </button>
                <span
                    contentEditable
                    suppressContentEditableWarning
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    onBlur={(e: React.FocusEvent<HTMLSpanElement>) =>
                        updateAttributes({ summary: e.currentTarget.textContent || 'Toggle section' })
                    }
                    className="toggle-summary-text"
                >
                    {node.attrs.summary}
                </span>
            </div>
            {isOpen && (
                <div className="toggle-body">
                    <NodeViewContent />
                </div>
            )}
        </NodeViewWrapper>
    );
}

// Details/Toggle Node Extension
const DetailsBlock = Node.create({
    name: 'detailsBlock',
    group: 'block',
    content: 'block+',
    defining: true,
    draggable: true,
    addAttributes() {
        return {
            summary: {
                default: 'Toggle section',
                parseHTML: (element: HTMLElement) => element.querySelector('summary')?.textContent || 'Toggle section',
                renderHTML: () => ({}),
            },
            open: {
                default: true,
                parseHTML: (element: HTMLElement) => element.hasAttribute('open'),
                renderHTML: (attributes: Record<string, any>) => attributes.open ? { open: 'open' } : {},
            },
        };
    },
    parseHTML() {
        return [{ tag: 'details' }];
    },
    renderHTML({ HTMLAttributes, node }: { HTMLAttributes: Record<string, any>, node: any }) {
        const { summary, ...rest } = HTMLAttributes;
        return [
            'details',
            mergeAttributes(rest, { class: 'toggle-block' }),
            ['summary', { class: 'toggle-summary' }, node.attrs.summary || 'Toggle section'],
            ['div', { class: 'toggle-content' }, 0],
        ];
    },
    addNodeView() {
        return ReactNodeViewRenderer(ToggleNodeView);
    },
});

// ====================
// SLASH COMMAND ITEMS
// ====================

interface CommandItem {
    title: string;
    description: string;
    icon: React.ElementType;
    category: 'basic' | 'lists' | 'blocks' | 'media';
    command: (editor: any, callbacks?: { onOpenPageLink?: () => void }) => void;
}

const slashCommands: CommandItem[] = [
    // Basic
    {
        title: 'Heading 1',
        description: 'Large section heading',
        icon: Heading1,
        category: 'basic',
        command: (editor) => (editor.chain().focus() as any).toggleHeading({ level: 1 }).run(),
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: Heading2,
        category: 'basic',
        command: (editor) => (editor.chain().focus() as any).toggleHeading({ level: 2 }).run(),
    },
    {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: Heading3,
        category: 'basic',
        command: (editor) => (editor.chain().focus() as any).toggleHeading({ level: 3 }).run(),
    },
    // Lists
    {
        title: 'Bullet List',
        description: 'Create a simple bullet list',
        icon: List,
        category: 'lists',
        command: (editor) => (editor.chain().focus() as any).toggleBulletList().run(),
    },
    {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: ListOrdered,
        category: 'lists',
        command: (editor) => (editor.chain().focus() as any).toggleOrderedList().run(),
    },
    {
        title: 'Task List',
        description: 'Track tasks with checkboxes',
        icon: CheckSquare,
        category: 'lists',
        command: (editor) => (editor.chain().focus() as any).toggleTaskList().run(),
    },
    // Blocks
    {
        title: 'Quote',
        description: 'Capture a quote',
        icon: Quote,
        category: 'blocks',
        command: (editor) => (editor.chain().focus() as any).toggleBlockquote().run(),
    },
    {
        title: 'Code Block',
        description: 'Display a code snippet',
        icon: Code2,
        category: 'blocks',
        command: (editor) => (editor.chain().focus() as any).toggleCodeBlock().run(),
    },
    {
        title: 'Info Callout',
        description: 'Highlighted info box',
        icon: AlertCircle,
        category: 'blocks',
        command: (editor) => {
            (editor.chain().focus() as any).insertContent({
                type: 'callout',
                attrs: { type: 'info' },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type your info message here...' }] }]
            }).run();
        },
    },
    {
        title: 'Warning Callout',
        description: 'Highlighted warning box',
        icon: AlertTriangle,
        category: 'blocks',
        command: (editor) => {
            (editor.chain().focus() as any).insertContent({
                type: 'callout',
                attrs: { type: 'warning' },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type your warning message here...' }] }]
            }).run();
        },
    },
    {
        title: 'Tip Callout',
        description: 'Highlighted tip box',
        icon: Lightbulb,
        category: 'blocks',
        command: (editor) => {
            (editor.chain().focus() as any).insertContent({
                type: 'callout',
                attrs: { type: 'tip' },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type your tip message here...' }] }]
            }).run();
        },
    },
    {
        title: 'Toggle Section',
        description: 'Collapsible content section',
        icon: ChevronRightIcon,
        category: 'blocks',
        command: (editor) => {
            (editor.chain().focus() as any).insertContent({
                type: 'detailsBlock',
                attrs: { summary: 'Click to expand', open: true },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hidden content goes here...' }] }]
            }).run();
        },
    },
    {
        title: 'Divider',
        description: 'Visually divide blocks',
        icon: Minus,
        category: 'blocks',
        command: (editor) => (editor.chain().focus() as any).setHorizontalRule().run(),
    },
    {
        title: 'Table',
        description: 'Add a table',
        icon: TableIcon,
        category: 'blocks',
        command: (editor) => (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    // Media
    {
        title: 'Page Link',
        description: 'Link to another note',
        icon: LinkIcon,
        category: 'media',
        command: (_editor, callbacks) => {
            // Trigger page link picker via callback
            if (callbacks?.onOpenPageLink) {
                callbacks.onOpenPageLink();
            } else {
                // Fallback to prompt if callback not available
                const noteTitle = window.prompt('Enter note title to link:');
                if (noteTitle) {
                    (_editor.chain().focus() as any).insertContent({
                        type: 'text',
                        marks: [{ type: 'link', attrs: { href: `#note:${noteTitle}` } }],
                        text: noteTitle,
                    }).run();
                }
            }
        },
    },
    {
        title: 'YouTube Video',
        description: 'Embed a YouTube video',
        icon: Youtube,
        category: 'media',
        command: (editor) => {
            const url = window.prompt('Enter YouTube URL:');
            if (url) {
                // Extract video ID and create embed
                const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
                if (videoId) {
                    (editor.chain().focus() as any).insertContent({
                        type: 'paragraph',
                        content: [{ type: 'text', text: `[YouTube: ${url}]` }]
                    }).run();
                }
            }
        },
    },
];

// ====================
// TOOLBAR BUTTON
// ====================

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                'p-1.5 rounded hover:bg-gray-200 transition-colors',
                isActive && 'bg-gray-200 text-sky-600',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            {children}
        </button>
    );
}

// ====================
// SLASH COMMAND MENU
// ====================

interface SlashCommandMenuProps {
    editor: any;
    items: CommandItem[];
    onClose: () => void;
    callbacks?: { onOpenPageLink?: () => void };
}

function SlashCommandMenu({ editor, items, onClose, callbacks }: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [search, setSearch] = useState('');

    const filteredItems = items.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    );

    // Group items by category
    const categories = [
        { key: 'basic', label: 'Basic' },
        { key: 'lists', label: 'Lists' },
        { key: 'blocks', label: 'Blocks' },
        { key: 'media', label: 'Media' },
    ];

    const handleSelect = useCallback((item: CommandItem) => {
        item.command(editor, callbacks);
        onClose();
    }, [editor, onClose, callbacks]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    handleSelect(filteredItems[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, handleSelect, onClose]);

    // Calculate the actual index in filtered list for selection
    let itemIndex = -1;

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <input
                    type="text"
                    placeholder="Search commands..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    autoFocus
                />
            </div>
            <div className="max-h-72 overflow-y-auto">
                {filteredItems.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-gray-400 text-center">No commands found</p>
                ) : (
                    categories.map(({ key, label }) => {
                        const categoryItems = filteredItems.filter(item => item.category === key);
                        if (categoryItems.length === 0) return null;

                        return (
                            <div key={key}>
                                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80 border-y border-gray-100">
                                    {label}
                                </div>
                                <div className="p-1">
                                    {categoryItems.map((item) => {
                                        itemIndex++;
                                        const currentIndex = itemIndex;
                                        return (
                                            <button
                                                key={item.title}
                                                onClick={() => handleSelect(item)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                                                    currentIndex === selectedIndex ? 'bg-sky-50 text-sky-700' : 'hover:bg-gray-50'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-9 h-9 rounded-lg flex items-center justify-center',
                                                    currentIndex === selectedIndex ? 'bg-sky-100' : 'bg-gray-100'
                                                )}>
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-gray-400 truncate">{item.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ====================
// BUBBLE MENU TOOLBAR (Floating Selection Menu)
// ====================

const BUBBLE_HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' },
];

function BubbleMenuToolbar({ editor }: { editor: any }) {
    const [showColorPicker, setShowColorPicker] = useState(false);

    if (!editor) return null;

    const isTableActive = editor.isActive('table');

    if (isTableActive) {
        return (
            <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700 max-w-[90vw] overflow-x-auto">
                <button
                    onClick={() => (editor.chain().focus() as any).addColumnBefore().run()}
                    className="p-1.5 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Add Column Before"
                >
                    <IconWrapper icon={AlignLeft} className="w-4 h-4 rotate-90" />
                </button>
                <button
                    onClick={() => (editor.chain().focus() as any).addColumnAfter().run()}
                    className="p-1.5 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Add Column After"
                >
                    <IconWrapper icon={AlignRight} className="w-4 h-4 rotate-90" />
                </button>
                <button
                    onClick={() => (editor.chain().focus() as any).deleteColumn().run()}
                    className="p-1.5 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    title="Delete Column"
                >
                    <IconWrapper icon={Trash2} className="w-4 h-4 rotate-90" />
                </button>

                <div className="w-px h-5 bg-gray-600 mx-1" />

                <button
                    onClick={() => (editor.chain().focus() as any).addRowBefore().run()}
                    className="p-1.5 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Add Row Before"
                >
                    <IconWrapper icon={AlignLeft} className="w-4 h-4" />
                </button>
                <button
                    onClick={() => (editor.chain().focus() as any).addRowAfter().run()}
                    className="p-1.5 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Add Row After"
                >
                    <IconWrapper icon={AlignRight} className="w-4 h-4" />
                </button>
                <button
                    onClick={() => (editor.chain().focus() as any).deleteRow().run()}
                    className="p-1.5 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    title="Delete Row"
                >
                    <IconWrapper icon={Trash2} className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-gray-600 mx-1" />

                <button
                    onClick={() => (editor.chain().focus() as any).mergeCells().run()}
                    className="p-1.5 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Merge Cells"
                >
                    <span className="text-xs font-bold">M</span>
                </button>
                <button
                    onClick={() => (editor.chain().focus() as any).splitCell().run()}
                    className="p-1.5 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Split Cell"
                >
                    <span className="text-xs font-bold">S</span>
                </button>
                <button
                    onClick={() => (editor.chain().focus() as any).deleteTable().run()}
                    className="p-1.5 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors ml-1"
                    title="Delete Table"
                >
                    <IconWrapper icon={Trash2} className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700">
            {/* Basic formatting */}
            <button
                onClick={() => (editor.chain().focus() as any).toggleBold().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('bold') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Bold"
            >
                <IconWrapper icon={Bold} className="w-4 h-4" />
            </button>
            <button
                onClick={() => (editor.chain().focus() as any).toggleItalic().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('italic') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Italic"
            >
                <IconWrapper icon={Italic} className="w-4 h-4" />
            </button>
            <button
                onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('underline') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Underline"
            >
                <IconWrapper icon={UnderlineIcon} className="w-4 h-4" />
            </button>
            <button
                onClick={() => (editor.chain().focus() as any).toggleStrike().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('strike') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Strikethrough"
            >
                <IconWrapper icon={Strikethrough} className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-gray-600 mx-1" />

            {/* Link */}
            <button
                onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) {
                        (editor.chain().focus() as any).setLink({ href: url }).run();
                    }
                }}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('link') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Add Link"
            >
                <IconWrapper icon={LinkIcon} className="w-4 h-4" />
            </button>

            {/* Inline Code */}
            <button
                onClick={() => (editor.chain().focus() as any).toggleCode().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('code') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Inline Code"
            >
                <IconWrapper icon={Code} className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-gray-600 mx-1" />

            {/* Highlight Color Picker */}
            <div className="relative">
                <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={cn(
                        'p-1.5 rounded transition-colors',
                        editor.isActive('highlight') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    )}
                    title="Highlight"
                >
                    <IconWrapper icon={Highlighter} className="w-4 h-4" />
                </button>
                {showColorPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex gap-1 z-50">
                        {BUBBLE_HIGHLIGHT_COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => {
                                    (editor.chain().focus() as any).toggleHighlight({ color: color.value }).run();
                                    setShowColorPicker(false);
                                }}
                                className="w-6 h-6 rounded border-2 border-transparent hover:border-gray-400 transition-all"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                            />
                        ))}
                        <button
                            onClick={() => {
                                (editor.chain().focus() as any).unsetHighlight().run();
                                setShowColorPicker(false);
                            }}
                            className="w-6 h-6 rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                            title="Remove"
                        >
                            <IconWrapper icon={Minus} className="w-3 h-3 text-gray-400" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to avoid type errors with Lucide icons
const IconWrapper = ({ icon: Icon, className }: { icon: any, className?: string }) => <Icon className={className} />;

// ====================
// MAIN EDITOR COMPONENT
// ====================

interface TiptapEditorProps {
    content: any; // JSON content
    onChange: (json: any, html: string, text: string) => void;
    onEditorReady?: (editor: any) => void; // Callback to expose editor instance
    onOpenPageLink?: () => void; // Callback to open page link picker
    placeholder?: string;
    editable?: boolean;
}

export function TiptapEditor({ content, onChange, onEditorReady, onOpenPageLink, placeholder = 'Start writing...', editable = true }: TiptapEditorProps) {
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [showBubbleMenu, setShowBubbleMenu] = useState(false);
    const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 });
    const isInitialized = useRef(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We use CodeBlockLowlight instead
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }) as any,
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-sky-600 underline cursor-pointer hover:text-sky-700',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full rounded-lg',
                },
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: 'flex items-start gap-2',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full',
                },
            }),
            TableRow,
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 px-3 py-2',
                },
            }),
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 px-3 py-2 bg-gray-50 font-semibold',
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight.configure({
                multicolor: true,
            }),
            Typography,
            Callout,
            DetailsBlock,
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'rounded-lg bg-gray-900 text-gray-100 p-4 text-sm font-mono overflow-x-auto',
                },
            }),
        ],
        content,
        editable,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[300px]',
            },
            handleKeyDown: (view, event) => {
                if (event.key === '/') {
                    // Check if we're at the start of a line or after whitespace
                    const { state } = view;
                    const { from } = state.selection;
                    const textBefore = state.doc.textBetween(Math.max(0, from - 1), from);
                    if (textBefore === '' || textBefore === ' ' || textBefore === '\n') {
                        // Prevent the "/" from being typed into the editor
                        event.preventDefault();
                        setShowSlashMenu(true);
                        return true; // Prevent default behavior
                    }
                }
                // Close slash menu on any other key press if it's open
                if (showSlashMenu && event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter' && event.key !== 'Escape') {
                    setShowSlashMenu(false);
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            const json = editor.getJSON();
            const html = editor.getHTML();
            const text = editor.getText();
            onChange(json, html, text);
        },
    });

    // Close slash menu when clicking outside or pressing escape
    useEffect(() => {
        const handleClick = () => setShowSlashMenu(false);
        if (showSlashMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [showSlashMenu]);

    // Initialize content ONLY once when editor first becomes available
    // This prevents constant re-renders and cursor jumping
    useEffect(() => {
        if (editor && content && !isInitialized.current) {
            editor.commands.setContent(content);
            isInitialized.current = true;
        }
    }, [editor, content]);

    // Expose editor instance to parent component
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Track selection changes for bubble menu
    useEffect(() => {
        if (!editor) return;

        const updateBubbleMenu = () => {
            // Small delay to ensure selection is finalized
            setTimeout(() => {
                const { from, to } = editor.state.selection;
                const hasSelection = from !== to;
                const isCodeBlock = editor.isActive('codeBlock');
                const selection = window.getSelection();
                const hasTextSelected = selection && selection.toString().trim().length > 0;

                if (hasSelection && !isCodeBlock && hasTextSelected) {
                    // Get selection position from browser (use viewport coordinates for fixed positioning)
                    if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        // Ensure rect has valid dimensions
                        if (rect.width > 0 && rect.height > 0) {
                            // Use viewport coordinates directly since bubble menu is position: fixed
                            setBubbleMenuPosition({
                                top: rect.top, // Viewport-relative Y
                                left: rect.left + rect.width / 2, // Center horizontally
                            });
                            setShowBubbleMenu(true);
                        }
                    }
                } else {
                    setShowBubbleMenu(false);
                }
            }, 10);
        };

        // Listen to both selection update and mouseup for better detection
        editor.on('selectionUpdate', updateBubbleMenu);

        // Also listen to mouseup to catch drag selections
        const handleMouseUp = () => {
            updateBubbleMenu();
        };

        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            editor.off('selectionUpdate', updateBubbleMenu);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="tiptap-editor relative">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-2 py-1 flex items-center gap-1 flex-wrap">
                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Inline Code"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleHighlight().run()}
                    isActive={editor.isActive('highlight')}
                    title="Highlight"
                >
                    <Highlighter className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleTaskList().run()}
                    isActive={editor.isActive('taskList')}
                    title="Task List"
                >
                    <CheckSquare className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Blocks */}
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    title="Code Block"
                >
                    <Code2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    title="Insert Table"
                >
                    <TableIcon className="w-4 h-4" />
                </ToolbarButton>

                {/* Table Controls - shown when cursor is inside a table */}
                {editor.isActive('table') && (
                    <>
                        <ToolbarButton
                            onClick={() => (editor.chain().focus() as any).addColumnAfter().run()}
                            title="Add Column"
                        >
                            <span className="text-xs font-bold text-emerald-600">+C</span>
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => (editor.chain().focus() as any).addRowAfter().run()}
                            title="Add Row"
                        >
                            <span className="text-xs font-bold text-emerald-600">+R</span>
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => (editor.chain().focus() as any).deleteColumn().run()}
                            title="Delete Column"
                        >
                            <span className="text-xs font-bold text-red-500">-C</span>
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => (editor.chain().focus() as any).deleteRow().run()}
                            title="Delete Row"
                        >
                            <span className="text-xs font-bold text-red-500">-R</span>
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => (editor.chain().focus() as any).deleteTable().run()}
                            title="Delete Table"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </ToolbarButton>
                    </>
                )}

                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).setHorizontalRule().run()}
                    title="Divider"
                >
                    <Minus className="w-4 h-4" />
                </ToolbarButton>

                {editor.isActive('codeBlock') && (
                    <ToolbarButton
                        onClick={() => {
                            // Get current selection and delete the node
                            (editor.chain().focus() as any).clearNodes().run();
                        }}
                        title="Remove Code Block"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </ToolbarButton>
                )}

                <div className="flex-1" />

                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => (editor.chain().focus() as any).redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Floating Selection Toolbar */}
            {showBubbleMenu && (
                <div
                    className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                    style={{
                        top: bubbleMenuPosition.top - 50,
                        left: bubbleMenuPosition.left,
                        transform: 'translateX(-50%)',
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <BubbleMenuToolbar editor={editor} />
                </div>
            )}

            {/* Slash Command Menu */}
            {showSlashMenu && (
                <div className="absolute left-4 top-16 z-50" onClick={(e) => e.stopPropagation()}>
                    <SlashCommandMenu
                        editor={editor}
                        items={slashCommands}
                        onClose={() => setShowSlashMenu(false)}
                        callbacks={{ onOpenPageLink }}
                    />
                </div>
            )}

            {/* Editor Content */}
            <div className="p-4">
                <EditorContent editor={editor} />
            </div>

            {/* Editor Styles */}
            <style>{`
        .tiptap-editor .ProseMirror {
          min-height: 300px;
        }
        .tiptap-editor .ProseMirror:focus {
          outline: none;
        }
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        /* Heading Styles */
        .tiptap-editor .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        .tiptap-editor .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .tiptap-editor .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .tiptap-editor .ProseMirror h4 {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #4b5563;
        }

        /* ===== LIST STYLES ===== */
        .tiptap-editor .ProseMirror ul:not([data-type="taskList"]) {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
          margin: 0.5rem 0 1rem 0;
        }
        .tiptap-editor .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
          margin: 0.5rem 0 1rem 0;
        }
        .tiptap-editor .ProseMirror ul:not([data-type="taskList"]) li,
        .tiptap-editor .ProseMirror ol li {
          margin-bottom: 0.25rem;
          display: list-item !important;
        }
        .tiptap-editor .ProseMirror ul:not([data-type="taskList"]) li p,
        .tiptap-editor .ProseMirror ol li p {
          margin: 0;
        }
        /* Nested lists */
        .tiptap-editor .ProseMirror ul:not([data-type="taskList"]) ul {
          list-style-type: circle !important;
        }
        .tiptap-editor .ProseMirror ul:not([data-type="taskList"]) ul ul {
          list-style-type: square !important;
        }

        /* Task lists */
        .tiptap-editor .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .tiptap-editor .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .tiptap-editor .ProseMirror ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        .tiptap-editor .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1;
        }

        /* ===== BLOCKQUOTE ===== */
        .tiptap-editor .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          color: #6b7280;
          font-style: italic;
        }

        /* ===== HORIZONTAL RULE ===== */
        .tiptap-editor .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.5rem 0;
        }

        /* ===== CODE BLOCKS ===== */
        .tiptap-editor .ProseMirror pre {
          background: #1e293b !important;
          color: #e2e8f0 !important;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.875rem;
          padding: 1rem 1.25rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
          border: 1px solid #334155;
        }
        .tiptap-editor .ProseMirror pre code {
          color: inherit !important;
          background: none !important;
          padding: 0 !important;
          font-size: inherit;
          border-radius: 0;
          border: none;
        }
        /* Inline code */
        .tiptap-editor .ProseMirror :not(pre) > code {
          background-color: #f1f5f9;
          color: #e11d48;
          font-size: 0.85em;
          padding: 0.15em 0.4em;
          border-radius: 0.25rem;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          border: 1px solid #e2e8f0;
        }

        /* ===== TABLE STYLES ===== */
        .tiptap-editor .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
        }
        .tiptap-editor .ProseMirror table td,
        .tiptap-editor .ProseMirror table th {
          min-width: 1em;
          border: 1px solid #d1d5db;
          padding: 0.5rem 0.75rem;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap-editor .ProseMirror table th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: left;
          color: #374151;
        }
        .tiptap-editor .ProseMirror table td {
          background-color: #ffffff;
        }
        .tiptap-editor .ProseMirror table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(99, 102, 241, 0.15);
          pointer-events: none;
        }
        .tiptap-editor .ProseMirror table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #6366f1;
          pointer-events: none;
        }
        .tiptap-editor .ProseMirror .tableWrapper {
          overflow-x: auto;
          margin: 1rem 0;
        }
        .tiptap-editor.resize-cursor {
          cursor: col-resize;
        }

        /* ===== IMAGE ===== */
        .tiptap-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }

        /* ===== INTERNAL NOTE LINKS ===== */
        .tiptap-editor .ProseMirror a[href^="#note:"] {
          color: #0ea5e9;
          text-decoration: none;
          background-color: #f0f9ff;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }
        .tiptap-editor .ProseMirror a[href^="#note:"]:hover {
          background-color: #e0f2fe;
          text-decoration: underline;
        }
        
        /* ===== TOGGLE / DETAILS STYLES ===== */
        .tiptap-editor .ProseMirror .toggle-wrapper {
          margin: 0.5rem 0;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .tiptap-editor .ProseMirror .toggle-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .tiptap-editor .ProseMirror .toggle-arrow-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.7rem;
          color: #9ca3af;
          padding: 4px 6px;
          border-radius: 4px;
          transition: transform 0.2s, color 0.15s, background 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tiptap-editor .ProseMirror .toggle-arrow-btn.open {
          transform: rotate(90deg);
        }
        .tiptap-editor .ProseMirror .toggle-arrow-btn:hover {
          color: #374151;
          background: #e5e7eb;
        }
        .tiptap-editor .ProseMirror .toggle-summary-text {
          font-weight: 600;
          color: #374151;
          outline: none;
          cursor: text;
          flex: 1;
        }
        .tiptap-editor .ProseMirror .toggle-body {
          padding: 0.75rem 1rem;
        }
        .tiptap-editor .ProseMirror .toggle-body p {
          margin: 0;
        }

      `}</style>
        </div>
    );
}
