import { useState } from 'react';
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Quote,
    List,
    ListOrdered,
    CheckSquare,
    Table as TableIcon,
    Image,
    Link,
    Minus,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Palette,
    Info,
    Calendar,
    Clock,
    FileText,
    Settings2,
    Plus,
    ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Note } from '@/lib/notes-api';
import { formatDistanceToNow, format } from 'date-fns';

// ====================
// TYPES
// ====================

type TabType = 'insert' | 'format' | 'style' | 'info';

interface FormatPanelProps {
    editor: any;
    note?: Note | null;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

// ====================
// CONSTANTS
// ====================

const COLORS = [
    { name: 'Default', value: null },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
];

const HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' },
];

// ====================
// BUTTON COMPONENT
// ====================

interface ActionButtonProps {
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    isActive?: boolean;
    disabled?: boolean;
}

function ActionButton({ onClick, icon: Icon, label, isActive, disabled }: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors',
                'hover:bg-gray-100 text-left',
                isActive && 'bg-sky-50 text-sky-700',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
        </button>
    );
}

// ====================
// SECTION COMPONENT
// ====================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50"
            >
                {title}
                <ChevronDown className={cn('w-3 h-3 transition-transform', !isOpen && '-rotate-90')} />
            </button>
            {isOpen && <div className="px-2 pb-2">{children}</div>}
        </div>
    );
}

// ====================
// TAB COMPONENTS
// ====================

function InsertTab({ editor }: { editor: any }) {
    if (!editor) return null;

    return (
        <div className="space-y-1">
            <Section title="Text">
                <ActionButton
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    icon={Type}
                    label="Paragraph"
                    isActive={editor.isActive('paragraph')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    icon={Heading1}
                    label="Heading 1"
                    isActive={editor.isActive('heading', { level: 1 })}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    icon={Heading2}
                    label="Heading 2"
                    isActive={editor.isActive('heading', { level: 2 })}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    icon={Heading3}
                    label="Heading 3"
                    isActive={editor.isActive('heading', { level: 3 })}
                />
            </Section>

            <Section title="Lists">
                <ActionButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    icon={List}
                    label="Bullet List"
                    isActive={editor.isActive('bulletList')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    icon={ListOrdered}
                    label="Numbered List"
                    isActive={editor.isActive('orderedList')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    icon={CheckSquare}
                    label="Task List"
                    isActive={editor.isActive('taskList')}
                />
            </Section>

            <Section title="Blocks">
                <ActionButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    icon={Quote}
                    label="Quote"
                    isActive={editor.isActive('blockquote')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    icon={Code}
                    label="Code Block"
                    isActive={editor.isActive('codeBlock')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    icon={Minus}
                    label="Divider"
                />
                <ActionButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
                    icon={TableIcon}
                    label="Table"
                />
            </Section>

            <Section title="Media">
                <ActionButton
                    onClick={() => {
                        const url = window.prompt('Image URL:');
                        if (url) editor.chain().focus().setImage({ src: url }).run();
                    }}
                    icon={Image}
                    label="Image"
                />
                <ActionButton
                    onClick={() => {
                        const url = window.prompt('Link URL:');
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                    }}
                    icon={Link}
                    label="Link"
                />
            </Section>
        </div>
    );
}

function FormatTab({ editor }: { editor: any }) {
    if (!editor) return null;

    return (
        <div className="space-y-1">
            <Section title="Text Style">
                <ActionButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    icon={Bold}
                    label="Bold"
                    isActive={editor.isActive('bold')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    icon={Italic}
                    label="Italic"
                    isActive={editor.isActive('italic')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    icon={UnderlineIcon}
                    label="Underline"
                    isActive={editor.isActive('underline')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    icon={Strikethrough}
                    label="Strikethrough"
                    isActive={editor.isActive('strike')}
                />
                <ActionButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    icon={Code}
                    label="Inline Code"
                    isActive={editor.isActive('code')}
                />
            </Section>

            <Section title="Alignment">
                <div className="flex gap-1 px-1">
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={cn(
                            'flex-1 p-2 rounded-lg transition-colors',
                            editor.isActive({ textAlign: 'left' }) ? 'bg-sky-100 text-sky-700' : 'hover:bg-gray-100'
                        )}
                    >
                        <AlignLeft className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={cn(
                            'flex-1 p-2 rounded-lg transition-colors',
                            editor.isActive({ textAlign: 'center' }) ? 'bg-sky-100 text-sky-700' : 'hover:bg-gray-100'
                        )}
                    >
                        <AlignCenter className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={cn(
                            'flex-1 p-2 rounded-lg transition-colors',
                            editor.isActive({ textAlign: 'right' }) ? 'bg-sky-100 text-sky-700' : 'hover:bg-gray-100'
                        )}
                    >
                        <AlignRight className="w-4 h-4 mx-auto" />
                    </button>
                </div>
            </Section>

            <Section title="Highlight">
                <div className="flex flex-wrap gap-1.5 px-1">
                    {HIGHLIGHT_COLORS.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
                            className={cn(
                                'w-7 h-7 rounded-md border-2 transition-all',
                                editor.isActive('highlight', { color: color.value })
                                    ? 'border-gray-900 scale-110'
                                    : 'border-transparent hover:border-gray-300'
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                        />
                    ))}
                    <button
                        onClick={() => editor.chain().focus().unsetHighlight().run()}
                        className="w-7 h-7 rounded-md border border-gray-200 hover:bg-gray-100 flex items-center justify-center"
                        title="Remove highlight"
                    >
                        <Minus className="w-3 h-3 text-gray-400" />
                    </button>
                </div>
            </Section>

            <Section title="Text Color">
                <div className="flex flex-wrap gap-1.5 px-1">
                    {COLORS.map((color) => (
                        <button
                            key={color.value || 'default'}
                            onClick={() => {
                                if (color.value) {
                                    editor.chain().focus().setColor(color.value).run();
                                } else {
                                    editor.chain().focus().unsetColor().run();
                                }
                            }}
                            className={cn(
                                'w-7 h-7 rounded-md border-2 transition-all',
                                'hover:scale-110'
                            )}
                            style={{
                                backgroundColor: color.value || '#ffffff',
                                borderColor: color.value ? 'transparent' : '#e5e7eb',
                            }}
                            title={color.name}
                        />
                    ))}
                </div>
            </Section>
        </div>
    );
}

function StyleTab({ editor: _editor }: { editor: any }) {
    return (
        <div className="p-3 space-y-4">
            <div className="text-sm text-gray-500 text-center py-8">
                <Settings2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Theme and style options coming soon</p>
            </div>
        </div>
    );
}

function InfoTab({ note }: { note?: Note | null }) {
    if (!note) {
        return (
            <div className="p-3 space-y-4">
                <div className="text-sm text-gray-500 text-center py-8">
                    <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Select a note to see info</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 space-y-4">
            <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-gray-500">Words</p>
                        <p className="font-medium">{note.wordCount || 0}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-gray-500">Reading time</p>
                        <p className="font-medium">{note.readingTime || 0} min</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-gray-500">Created</p>
                        <p className="font-medium">{format(new Date(note.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-gray-500">Last edited</p>
                        <p className="font-medium">
                            {formatDistanceToNow(new Date(note.lastEditedAt || note.updatedAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            </div>

            {note.folder && (
                <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Folder</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                        <span style={{ color: note.folder.color || undefined }}>{note.folder.icon || '📁'}</span>
                        {note.folder.name}
                    </p>
                </div>
            )}

            {note.tags && note.tags.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                        {note.tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                    backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                                    color: tag.color || '#6b7280',
                                }}
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ====================
// MAIN COMPONENT
// ====================

export function FormatPanel({
    editor,
    note,
    isCollapsed = false,
    onToggleCollapse,
}: FormatPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('insert');

    const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
        { id: 'insert', label: 'Insert', icon: Plus },
        { id: 'format', label: 'Format', icon: Type },
        { id: 'style', label: 'Style', icon: Palette },
        { id: 'info', label: 'Info', icon: Info },
    ];

    if (isCollapsed) {
        return (
            <div className="w-10 h-full bg-gray-50/50 border-l border-gray-200 flex flex-col items-center py-3">
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-400"
                        title="Show format panel"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-64 h-full bg-gray-50/50 border-l border-gray-200 flex flex-col">
            {/* Tab Header */}
            <div className="flex items-center border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors',
                            activeTab === tab.id
                                ? 'text-sky-700 border-b-2 border-sky-500 bg-white'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Hide panel"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'insert' && <InsertTab editor={editor} />}
                {activeTab === 'format' && <FormatTab editor={editor} />}
                {activeTab === 'style' && <StyleTab editor={editor} />}
                {activeTab === 'info' && <InfoTab note={note} />}
            </div>
        </div>
    );
}
