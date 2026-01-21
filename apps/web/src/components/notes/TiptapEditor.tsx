import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
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

const lowlight = createLowlight(common);

// ====================
// SLASH COMMAND ITEMS
// ====================

interface CommandItem {
    title: string;
    description: string;
    icon: React.ElementType;
    command: (editor: any) => void;
}

const slashCommands: CommandItem[] = [
    {
        title: 'Heading 1',
        description: 'Large section heading',
        icon: Heading1,
        command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: Heading2,
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: Heading3,
        command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
        title: 'Bullet List',
        description: 'Create a simple bullet list',
        icon: List,
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: ListOrdered,
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
        title: 'Task List',
        description: 'Track tasks with checkboxes',
        icon: CheckSquare,
        command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
        title: 'Quote',
        description: 'Capture a quote',
        icon: Quote,
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
        title: 'Code Block',
        description: 'Display a code snippet',
        icon: Code2,
        command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
        title: 'Divider',
        description: 'Visually divide blocks',
        icon: Minus,
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
        title: 'Table',
        description: 'Add a table',
        icon: TableIcon,
        command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
        title: 'Page Link',
        description: 'Link to another note',
        icon: LinkIcon,
        command: (editor) => {
            const noteTitle = window.prompt('Enter note title to link:');
            if (noteTitle) {
                editor.chain().focus().insertContent({
                    type: 'text',
                    marks: [{ type: 'link', attrs: { href: `#note:${noteTitle}` } }],
                    text: noteTitle,
                }).run();
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
}

function SlashCommandMenu({ editor, items, onClose }: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [search, setSearch] = useState('');

    const filteredItems = items.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = useCallback((item: CommandItem) => {
        item.command(editor);
        onClose();
    }, [editor, onClose]);

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

    return (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-72 max-h-80 overflow-y-auto">
            <div className="p-2 border-b border-gray-100">
                <input
                    type="text"
                    placeholder="Search commands..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                    autoFocus
                />
            </div>
            <div className="p-1">
                {filteredItems.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400">No commands found</p>
                ) : (
                    filteredItems.map((item, index) => (
                        <button
                            key={item.title}
                            onClick={() => handleSelect(item)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                                index === selectedIndex ? 'bg-sky-50 text-sky-700' : 'hover:bg-gray-50'
                            )}
                        >
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                <item.icon className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{item.title}</p>
                                <p className="text-xs text-gray-400">{item.description}</p>
                            </div>
                        </button>
                    ))
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

    return (
        <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700">
            {/* Basic formatting */}
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('bold') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('italic') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('underline') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Underline"
            >
                <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('strike') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Strikethrough"
            >
                <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-gray-600 mx-1" />

            {/* Link */}
            <button
                onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                    }
                }}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('link') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Add Link"
            >
                <LinkIcon className="w-4 h-4" />
            </button>

            {/* Inline Code */}
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    editor.isActive('code') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
                title="Inline Code"
            >
                <Code className="w-4 h-4" />
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
                    <Highlighter className="w-4 h-4" />
                </button>
                {showColorPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex gap-1 z-50">
                        {BUBBLE_HIGHLIGHT_COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => {
                                    editor.chain().focus().toggleHighlight({ color: color.value }).run();
                                    setShowColorPicker(false);
                                }}
                                className="w-6 h-6 rounded border-2 border-transparent hover:border-gray-400 transition-all"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                            />
                        ))}
                        <button
                            onClick={() => {
                                editor.chain().focus().unsetHighlight().run();
                                setShowColorPicker(false);
                            }}
                            className="w-6 h-6 rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                            title="Remove"
                        >
                            <Minus className="w-3 h-3 text-gray-400" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ====================
// MAIN EDITOR COMPONENT
// ====================

interface TiptapEditorProps {
    content: any; // JSON content
    onChange: (json: any, html: string, text: string) => void;
    onEditorReady?: (editor: any) => void; // Callback to expose editor instance
    placeholder?: string;
    editable?: boolean;
}

export function TiptapEditor({ content, onChange, onEditorReady, placeholder = 'Start writing...', editable = true }: TiptapEditorProps) {
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const isInitialized = useRef(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We use CodeBlockLowlight instead
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
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

    if (!editor) return null;

    return (
        <div className="tiptap-editor relative">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-2 py-1 flex items-center gap-1 flex-wrap">
                {/* Text Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Inline Code"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    isActive={editor.isActive('highlight')}
                    title="Highlight"
                >
                    <Highlighter className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    isActive={editor.isActive('taskList')}
                    title="Task List"
                >
                    <CheckSquare className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Blocks */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    title="Code Block"
                >
                    <Code2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    title="Insert Table"
                >
                    <TableIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Divider"
                >
                    <Minus className="w-4 h-4" />
                </ToolbarButton>

                {/* Delete current block (table or code block) */}
                {editor.isActive('table') && (
                    <ToolbarButton
                        onClick={() => editor.chain().focus().deleteTable().run()}
                        title="Delete Table"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </ToolbarButton>
                )}
                {editor.isActive('codeBlock') && (
                    <ToolbarButton
                        onClick={() => {
                            // Get current selection and delete the node
                            editor.chain().focus().clearNodes().run();
                        }}
                        title="Remove Code Block"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </ToolbarButton>
                )}

                <div className="flex-1" />

                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Floating Bubble Menu - appears on text selection */}
            <BubbleMenu
                editor={editor}
                tippyOptions={{ duration: 150, placement: 'top' }}
                shouldShow={({ editor, state }) => {
                    // Only show when there's a text selection (not just cursor)
                    const { from, to } = state.selection;
                    return from !== to && !editor.isActive('codeBlock');
                }}
            >
                <BubbleMenuToolbar editor={editor} />
            </BubbleMenu>

            {/* Slash Command Menu */}
            {showSlashMenu && (
                <div className="absolute left-4 top-16 z-50" onClick={(e) => e.stopPropagation()}>
                    <SlashCommandMenu
                        editor={editor}
                        items={slashCommands}
                        onClose={() => setShowSlashMenu(false)}
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
        /* Heading Styles - Bold and properly sized */
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
        .tiptap-editor .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          color: #6b7280;
          font-style: italic;
        }
        .tiptap-editor .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.5rem 0;
        }
        .tiptap-editor .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .tiptap-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        /* Internal note links */
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
        
        /* Block Handles - Notion-style */
        .tiptap-editor .ProseMirror > *:not(div.ProseMirror-trailingBreak) {
          position: relative;
          padding-left: 1.5rem;
          margin-left: -1.5rem;
        }
        .tiptap-editor .ProseMirror > *:not(div.ProseMirror-trailingBreak)::before {
          content: '⋮⋮';
          position: absolute;
          left: 0;
          top: 0.25rem;
          opacity: 0;
          color: #9ca3af;
          font-size: 12px;
          letter-spacing: -2px;
          cursor: grab;
          user-select: none;
          transition: opacity 0.15s ease;
          padding: 2px 4px;
          border-radius: 3px;
        }
        .tiptap-editor .ProseMirror > *:not(div.ProseMirror-trailingBreak):hover::before {
          opacity: 1;
        }
        .tiptap-editor .ProseMirror > *:not(div.ProseMirror-trailingBreak):hover {
          background-color: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
        }
        .tiptap-editor .ProseMirror > *:not(div.ProseMirror-trailingBreak)::before:hover {
          background-color: #f3f4f6;
        }
        /* Hide handles on headings line height */
        .tiptap-editor .ProseMirror > h1::before {
          top: 0.5rem;
        }
        .tiptap-editor .ProseMirror > h2::before {
          top: 0.4rem;
        }
        .tiptap-editor .ProseMirror > h3::before {
          top: 0.35rem;
        }
      `}</style>
        </div>
    );
}
