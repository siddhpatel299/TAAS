import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    Pin,
    Trash2,
    MoreHorizontal,
    Copy,
    FolderOpen,
    Folder,
    RotateCcw,
    Star,
    Archive,
    Move,
    List,
    Edit2,
    CornerDownRight,
} from 'lucide-react';
import { useNotesStore } from '@/stores/notes.store';
import { NoteFolder, Note, NoteTag as NoteTagType } from '@/lib/notes-api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { TiptapEditor } from '@/components/notes/TiptapEditor';
import { CreateFolderDialog } from '@/components/notes/CreateFolderDialog';
import { MoveToFolderDialog } from '@/components/notes/MoveToFolderDialog';
import { PageLinkPicker } from '@/components/notes/PageLinkPicker';
import { TableOfContents } from '@/components/notes/TableOfContents';
import { useNotesTheme } from './NotesThemeContext';

// ====================
// FOLDER TREE ITEM (Shared)
// ====================

interface FolderTreeItemProps {
    folder: NoteFolder;
    level: number;
    selectedFolderId?: string | null;
    selectedNoteId?: string;
    notes?: Note[];
    onSelectFolder: (folderId: string) => void;
    onSelectNote?: (note: Note) => void;
    onAction?: (action: string, folder: NoteFolder) => void;
}

function FolderTreeItem({ folder, level, selectedFolderId, selectedNoteId, notes = [], onSelectFolder, onSelectNote, onAction }: FolderTreeItemProps) {
    const { theme } = useNotesTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;
    const folderNotes = notes.filter(n => n.folderId === folder.id && !n.isTrashed);
    const hasContent = hasChildren || folderNotes.length > 0;

    // ASCII style for terminal theme
    const isAscii = theme.folderStyle === 'ascii';

    return (
        <div className="select-none relative group/folder">
            <div
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-all cursor-pointer relative',
                    theme.fontFamily,
                    isSelected
                        ? `${theme.colors.borderActive} ${theme.colors.bgTertiary} ${theme.colors.primary}`
                        : `border-transparent ${theme.colors.textSecondary} ${theme.colors.primaryHover}`,
                    !isAscii && 'border-l-2',
                    isAscii && 'hover:bg-[#222]'
                )}
                style={{ paddingLeft: `${12 + level * 16}px` }}
            >
                {/* Expand/Collapse Toggle */}
                {isAscii ? (
                    <span
                        className="cursor-pointer font-bold w-4 text-center"
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    >
                        {hasContent ? (isOpen ? '[-]' : '[+]') : '[ ]'}
                    </span>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className={cn("p-0.5 rounded transition-colors", !hasChildren && "invisible", theme.colors.primaryHover)}
                    >
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                )}

                {/* Folder Icon */}
                {isOpen ? (
                    <FolderOpen className={cn("w-4 h-4", isSelected ? theme.colors.primary : theme.colors.accent)} />
                ) : (
                    <Folder className={cn("w-4 h-4", isSelected ? theme.colors.primary : theme.colors.accent)} />
                )}

                <span className="flex-1 truncate text-left">{folder.name}</span>

                {/* Note Count Badge */}
                {folderNotes.length > 0 && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", theme.colors.border, theme.colors.accent)}>
                        {folderNotes.length}
                    </span>
                )}

                {/* Context Menu Trigger */}
                <div className="absolute right-1 opacity-0 group-hover/folder:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className={cn("p-1 rounded mx-1", theme.colors.accent, theme.colors.primaryHover)}
                    >
                        <MoreHorizontal className="w-3 h-3" />
                    </button>
                </div>

                {/* Context Menu */}
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                        <div className={cn(
                            "absolute right-0 top-full mt-1 w-40 rounded shadow-lg z-50 py-1 text-xs",
                            theme.colors.bg, theme.colors.border, "border",
                            theme.fontFamily
                        )}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction?.('create_note', folder); setShowMenu(false); }}
                                className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.text, theme.colors.primaryHover)}
                            >
                                <FileText className="w-3 h-3" /> New Note
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction?.('create_sub', folder); setShowMenu(false); }}
                                className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.text, theme.colors.primaryHover)}
                            >
                                <Plus className="w-3 h-3" /> New Subfolder
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction?.('rename', folder); setShowMenu(false); }}
                                className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.text, theme.colors.primaryHover)}
                            >
                                <Edit2 className="w-3 h-3" /> Rename
                            </button>
                            <div className={cn("h-px my-1", theme.colors.border)} />
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction?.('delete', folder); setShowMenu(false); }}
                                className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.danger)}
                            >
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Children & Notes */}
            <AnimatePresence>
                {isOpen && hasContent && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        {folder.children?.map((child) => (
                            <FolderTreeItem
                                key={child.id}
                                folder={child}
                                level={level + 1}
                                selectedFolderId={selectedFolderId}
                                selectedNoteId={selectedNoteId}
                                notes={notes}
                                onSelectFolder={onSelectFolder}
                                onSelectNote={onSelectNote}
                                onAction={onAction}
                            />
                        ))}
                        {/* Notes within this folder */}
                        {folderNotes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => onSelectNote?.(note)}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm transition-colors",
                                    theme.fontFamily,
                                    selectedNoteId === note.id
                                        ? `${theme.colors.primary} ${theme.colors.bgTertiary}`
                                        : `${theme.colors.textMuted} ${theme.colors.primaryHover}`
                                )}
                                style={{ paddingLeft: `${(level + 1) * 20 + 24}px` }}
                            >
                                <CornerDownRight className="w-3 h-3 opacity-50" />
                                <span className="truncate">{note.title || 'Untitled'}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ====================
// NOTE CARD (Shared)
// ====================

interface NoteCardProps {
    note: Note;
    isSelected: boolean;
    onSelect: () => void;
    onPin: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMove: () => void;
    onRestore?: () => void;
    onDeletePermanently?: () => void;
}

function NoteCard({ note, isSelected, onSelect, onPin, onDelete, onDuplicate, onMove, onRestore, onDeletePermanently }: NoteCardProps) {
    const { theme } = useNotesTheme();
    const [showMenu, setShowMenu] = useState(false);

    const preview = useMemo(() => {
        if (!note.contentJson?.content) return note.content || '';
        const extractText = (node: any): string => {
            if (node.type === 'text') return node.text || '';
            if (node.content) return node.content.map(extractText).join(' ');
            return '';
        };
        const text = note.contentJson.content.map(extractText).join(' ');
        return text.slice(0, 100);
    }, [note.contentJson, note.content]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={onSelect}
            className={cn(
                'group relative rounded border cursor-pointer transition-all overflow-hidden p-3 mb-2',
                theme.fontFamily,
                isSelected
                    ? `${theme.colors.borderActive} ${theme.colors.bgTertiary} ${theme.colors.primary}`
                    : `${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textSecondary}`
            )}
        >
            {/* Quick Actions */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onPin(); }}
                    className={cn("p-1 rounded", note.isPinned ? theme.colors.warning : theme.colors.textMuted)}
                >
                    <Pin className="w-3 h-3" />
                </button>
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className={cn("p-1 rounded", theme.colors.textMuted)}
                    >
                        <MoreHorizontal className="w-3 h-3" />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                            <div className={cn(
                                "absolute right-0 top-full mt-1 w-40 rounded shadow-lg z-20 py-1 text-xs border",
                                theme.colors.bg, theme.colors.border, theme.fontFamily
                            )}>
                                {note.isTrashed ? (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRestore?.(); setShowMenu(false); }}
                                            className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.success)}
                                        >
                                            <RotateCcw className="w-3 h-3" /> Restore
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeletePermanently?.(); setShowMenu(false); }}
                                            className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.danger)}
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete Forever
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMove(); setShowMenu(false); }}
                                            className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.text, theme.colors.primaryHover)}
                                        >
                                            <Move className="w-3 h-3" /> Move to...
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowMenu(false); }}
                                            className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.text, theme.colors.primaryHover)}
                                        >
                                            <Copy className="w-3 h-3" /> Duplicate
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                                            className={cn("w-full flex items-center gap-2 px-3 py-2", theme.colors.danger)}
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex items-start gap-2 mb-1 pr-12">
                {note.icon && <span className="text-lg opacity-80">{note.icon}</span>}
                <div>
                    <h3 className={cn("text-sm font-semibold truncate", isSelected ? theme.colors.primary : theme.colors.text)}>
                        {note.title || 'Untitled'}
                    </h3>
                    <div className={cn("flex items-center gap-2 text-[10px] mt-0.5", theme.colors.textMuted)}>
                        <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                {note.tags.slice(0, 2).map((t: NoteTagType) => (
                                    <span
                                        key={t.id}
                                        className={cn("px-1 rounded text-[9px]", theme.colors.border, "border")}
                                        style={{ backgroundColor: t.color + '20', color: t.color }}
                                    >
                                        {t.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview */}
            {preview && (
                <p className={cn("text-[11px] line-clamp-2 mt-1", theme.colors.textMuted)}>
                    {preview}
                </p>
            )}

            {/* Status indicators */}
            <div className="flex items-center gap-2 mt-2">
                {note.isPinned && <Pin className={cn("w-3 h-3", theme.colors.warning)} />}
                {note.isFavorite && <Star className={cn("w-3 h-3", theme.colors.warning)} />}
            </div>
        </motion.div>
    );
}

// ====================
// NOTE EDITOR (Shared)
// ====================

interface NoteEditorProps {
    note: Note;
}

function NoteEditor({ note }: NoteEditorProps) {
    const { theme } = useNotesTheme();
    const { updateNote } = useNotesStore();
    const [showPageLinkPicker, setShowPageLinkPicker] = useState(false);
    const [editorInstance, setEditorInstance] = useState<any>(null);

    const handleEditorChange = (json: any, html: string, text: string) => {
        // Extract title from first heading or first line
        let title = note.title;
        if (json?.content?.[0]) {
            const firstNode = json.content[0];
            if (firstNode.type === 'heading' && firstNode.content?.[0]?.text) {
                title = firstNode.content[0].text;
            }
        }

        updateNote(note.id, {
            title,
            contentJson: json,
            contentHtml: html,
            content: text,
            createVersion: true,
        });
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with title input */}
            <div className={cn("px-6 py-4 border-b flex items-center gap-4", theme.colors.border, theme.colors.bgSecondary)}>
                <input
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    className={cn(
                        "flex-1 bg-transparent border-none outline-none text-xl font-bold placeholder-opacity-50",
                        theme.colors.primary, theme.fontFamily
                    )}
                    placeholder="Untitled"
                />
                <div className={cn("text-xs", theme.colors.textMuted)}>
                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                </div>
            </div>

            {/* Cover Image */}
            {note.coverImage && (
                <div className="relative h-48 overflow-hidden">
                    <img src={note.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <button
                        onClick={() => updateNote(note.id, { coverImage: null })}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded text-white hover:bg-black/70"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Editor */}
            <div className="flex-1 overflow-auto p-6 notes-editor-wrapper">
                <style>{theme.editorCSS}</style>
                <style>{theme.toolbarCSS}</style>
                <TiptapEditor
                    key={note.id}
                    content={note.contentJson || null}
                    onChange={handleEditorChange}
                    onEditorReady={setEditorInstance}
                    onOpenPageLink={() => setShowPageLinkPicker(true)}
                    placeholder="Start writing..."
                />
            </div>

            {/* Page Link Picker */}
            <PageLinkPicker
                isOpen={showPageLinkPicker}
                onClose={() => setShowPageLinkPicker(false)}
                excludeNoteId={note.id}
                onSelect={(selectedNote) => {
                    if (editorInstance) {
                        editorInstance.chain().focus().insertContent({
                            type: 'text',
                            marks: [{ type: 'link', attrs: { href: `${theme.routePrefix}/${selectedNote.id}` } }],
                            text: selectedNote.title || 'Untitled',
                        }).run();
                    }
                    setShowPageLinkPicker(false);
                }}
            />
        </div>
    );
}

// ====================
// MAIN LAYOUT (Shared)
// ====================

interface NotesPageLayoutProps {
    LayoutWrapper: React.ComponentType<{ children: React.ReactNode }>;
    PanelWrapper?: React.ComponentType<{ children: React.ReactNode; className?: string; glow?: boolean }>;
}

export function NotesPageLayout({ LayoutWrapper, PanelWrapper }: NotesPageLayoutProps) {
    const navigate = useNavigate();
    const { noteId } = useParams();
    const { theme } = useNotesTheme();

    const {
        notes,
        selectedNote,
        folderTree,
        filters,
        fetchNotes,
        fetchNote,
        fetchFolderTree,
        createNote,
        deleteNote,
        togglePin,
        restoreNote,
        deleteFolder,
        duplicateNote,
        setSelectedNote,
        setFilters,
        emptyTrash,
    } = useNotesStore();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isTOCCollapsed, setIsTOCCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [moveToFolderOpen, setMoveToFolderOpen] = useState(false);
    const [parentFolderId, setParentFolderId] = useState<string | undefined>(undefined);
    const [noteToMove, setNoteToMove] = useState<string | null>(null);

    useEffect(() => {
        fetchNotes();
        fetchFolderTree();
    }, [fetchNotes, fetchFolderTree]);

    useEffect(() => {
        if (noteId) {
            fetchNote(noteId);
        } else {
            setSelectedNote(null);
        }
    }, [noteId]);

    const handleCreateNote = async () => {
        try {
            const newNote = await createNote({
                title: 'Untitled Note',
                content: '',
                folderId: filters.folderId || undefined
            });
            navigate(`${theme.routePrefix}/${newNote.id}`);
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    };

    const handleFolderAction = (action: string, folder: NoteFolder) => {
        if (action === 'create_note') {
            createNote({
                title: 'Untitled Note',
                content: '',
                folderId: folder.id
            }).then(note => navigate(`${theme.routePrefix}/${note.id}`));
        } else if (action === 'create_sub') {
            setParentFolderId(folder.id);
            setCreateFolderOpen(true);
        } else if (action === 'delete') {
            if (confirm(`Delete folder "${folder.name}" and all contents? This cannot be undone.`)) {
                deleteFolder(folder.id);
            }
        } else if (action === 'rename') {
            const newName = prompt("Enter new folder name:", folder.name);
            if (newName && newName !== folder.name) {
                useNotesStore.getState().updateFolder(folder.id, { name: newName });
            }
        }
    };

    // Filter notes
    const filteredNotes = notes.filter(n => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                n.title.toLowerCase().includes(query) ||
                (n.content && n.content.toLowerCase().includes(query))
            );
        }
        return true;
    });

    // Use a simple div wrapper if no PanelWrapper provided
    const Panel = PanelWrapper || (({ children, className }: any) => <div className={className}>{children}</div>);

    return (
        <LayoutWrapper>
            <div className={cn("h-[calc(100vh-140px)] flex gap-4 overflow-hidden relative", theme.colors.bg)}>
                {/* Left Sidebar */}
                <Panel
                    className={cn(
                        "flex flex-col transition-all duration-300 relative z-20",
                        isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-80",
                        theme.colors.border, "border"
                    )}
                    glow={theme.panelGlow}
                >
                    {/* Header */}
                    <div className={cn("p-4 border-b flex items-center justify-between", theme.colors.border, theme.colors.bgSecondary)}>
                        <h2 className={cn("font-bold tracking-widest text-sm flex items-center gap-2", theme.colors.primary, theme.fontFamily)}>
                            <Archive className="w-4 h-4" /> NOTES
                        </h2>
                        <div className="flex gap-1">
                            <button
                                onClick={() => { setParentFolderId(undefined); setCreateFolderOpen(true); }}
                                title="New Folder"
                                className={cn("p-2 rounded", theme.colors.text, theme.colors.primaryHover)}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCreateNote}
                                title="New Note"
                                className={cn("p-2 rounded", theme.colors.text, theme.colors.primaryHover)}
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className={cn("p-3 border-b", theme.colors.border)}>
                        <div className="relative">
                            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3", theme.colors.textMuted)} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notes..."
                                className={cn(
                                    "w-full rounded px-8 py-1.5 text-xs outline-none border",
                                    theme.colors.bgTertiary, theme.colors.border, theme.colors.text,
                                    theme.fontFamily
                                )}
                            />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className={cn("flex p-2 gap-1 border-b overflow-x-auto", theme.colors.border)}>
                        <button
                            onClick={() => setFilters({ view: 'all', folderId: undefined })}
                            className={cn(
                                "px-3 py-1 text-[10px] rounded border whitespace-nowrap",
                                theme.fontFamily,
                                filters.view === 'all' && !filters.folderId
                                    ? `${theme.colors.bgTertiary} ${theme.colors.borderActive} ${theme.colors.primary}`
                                    : `border-transparent ${theme.colors.textMuted} ${theme.colors.primaryHover}`
                            )}
                        >
                            ALL
                        </button>
                        <button
                            onClick={() => setFilters({ view: 'favorites' })}
                            className={cn(
                                "px-3 py-1 text-[10px] rounded border whitespace-nowrap flex items-center gap-1",
                                theme.fontFamily,
                                filters.view === 'favorites'
                                    ? `${theme.colors.bgTertiary} ${theme.colors.borderActive} ${theme.colors.primary}`
                                    : `border-transparent ${theme.colors.textMuted} ${theme.colors.primaryHover}`
                            )}
                        >
                            <Star className="w-3 h-3" /> FAVORITES
                        </button>
                        <button
                            onClick={() => setFilters({ view: 'trash' })}
                            className={cn(
                                "px-3 py-1 text-[10px] rounded border whitespace-nowrap flex items-center gap-1",
                                theme.fontFamily,
                                filters.view === 'trash'
                                    ? `${theme.colors.bgTertiary} ${theme.colors.borderActive} ${theme.colors.primary}`
                                    : `border-transparent ${theme.colors.textMuted} ${theme.colors.primaryHover}`
                            )}
                        >
                            <Trash2 className="w-3 h-3" /> TRASH
                        </button>
                    </div>

                    {/* Folder Tree & Note List */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {/* Folders (only in 'all' view) */}
                        {filters.view === 'all' && (
                            <div className="mb-4 space-y-0.5">
                                {folderTree.map(folder => (
                                    <FolderTreeItem
                                        key={folder.id}
                                        folder={folder}
                                        level={0}
                                        selectedFolderId={filters.folderId}
                                        selectedNoteId={noteId}
                                        notes={notes}
                                        onSelectFolder={(id) => setFilters({ folderId: id, view: 'all' })}
                                        onSelectNote={(note) => navigate(`${theme.routePrefix}/${note.id}`)}
                                        onAction={handleFolderAction}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Trash Header */}
                        {filters.view === 'trash' && notes.length > 0 && (
                            <div className="mb-2 px-2 flex justify-between items-center">
                                <span className={cn("text-xs", theme.colors.danger, theme.fontFamily)}>
                                    Deleted ({notes.length})
                                </span>
                                <button
                                    onClick={() => { if (confirm("Empty trash permanently?")) emptyTrash(); }}
                                    className={cn("text-[10px] underline", theme.colors.danger)}
                                >
                                    Empty All
                                </button>
                            </div>
                        )}

                        {/* Notes List */}
                        <div className="space-y-1">
                            {filteredNotes.length === 0 ? (
                                <div className={cn("p-8 text-center", theme.colors.textMuted)}>
                                    <p className={cn("text-xs", theme.fontFamily)}>No notes found</p>
                                </div>
                            ) : (
                                filteredNotes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isSelected={note.id === noteId}
                                        onSelect={() => navigate(`${theme.routePrefix}/${note.id}`)}
                                        onPin={() => togglePin(note.id)}
                                        onDelete={() => deleteNote(note.id)}
                                        onDuplicate={() => duplicateNote(note.id)}
                                        onMove={() => { setNoteToMove(note.id); setMoveToFolderOpen(true); }}
                                        onRestore={() => restoreNote(note.id)}
                                        onDeletePermanently={() => deleteNote(note.id, true)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </Panel>

                {/* Sidebar Toggle */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className={cn(
                        "absolute top-1/2 z-30 transform -translate-y-1/2 rounded-full p-1 transition-all",
                        theme.colors.bgSecondary, theme.colors.border, "border",
                        theme.colors.primary, theme.colors.primaryHover
                    )}
                    style={{ left: isSidebarCollapsed ? '0px' : '320px' }}
                >
                    <ChevronRight className={cn("w-4 h-4", !isSidebarCollapsed && "rotate-180")} />
                </button>

                {/* Main Editor Area */}
                <div className="flex-1 flex gap-4 overflow-hidden min-w-0">
                    <Panel
                        className={cn("flex-1 overflow-hidden flex flex-col relative", theme.colors.border, "border")}
                        glow={theme.panelGlow}
                    >
                        {selectedNote ? (
                            <NoteEditor note={selectedNote} />
                        ) : (
                            <div className={cn("flex-1 flex flex-col items-center justify-center", theme.colors.textMuted)}>
                                <FileText className="w-12 h-12 mb-4 opacity-50" />
                                <h2 className={cn("text-xl mb-2", theme.fontFamily)}>{theme.emptyStateTitle}</h2>
                                <p className={cn("text-xs", theme.fontFamily)}>{theme.emptyStateSubtitle}</p>
                            </div>
                        )}
                    </Panel>

                    {/* Table of Contents */}
                    {selectedNote && (
                        <Panel
                            className={cn(
                                "flex flex-col transition-all duration-300 relative z-20 overflow-hidden",
                                isTOCCollapsed ? "w-0 opacity-0 border-0 p-0" : "w-60",
                                theme.colors.border, "border"
                            )}
                            glow={theme.panelGlow}
                        >
                            <div className="h-full notes-toc">
                                <style>{theme.tocCSS}</style>
                                <TableOfContents
                                    contentJson={selectedNote.contentJson}
                                    onHeadingClick={(_id) => {
                                        // TODO: Scroll to heading in editor
                                    }}
                                    isCollapsed={false}
                                />
                            </div>
                        </Panel>
                    )}

                    {/* TOC Toggle */}
                    {selectedNote && (
                        <button
                            onClick={() => setIsTOCCollapsed(!isTOCCollapsed)}
                            className={cn(
                                "absolute right-0 top-1/2 transform -translate-y-1/2 z-30 rounded-l p-1",
                                theme.colors.bgSecondary, theme.colors.border, "border-l border-t border-b",
                                theme.colors.primary, theme.colors.primaryHover
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <CreateFolderDialog
                isOpen={createFolderOpen}
                onClose={() => { setCreateFolderOpen(false); setParentFolderId(undefined); }}
                parentId={parentFolderId}
            />

            {noteToMove && (
                <MoveToFolderDialog
                    isOpen={moveToFolderOpen}
                    onClose={() => { setMoveToFolderOpen(false); setNoteToMove(null); }}
                    noteIds={[noteToMove]}
                />
            )}
        </LayoutWrapper>
    );
}
