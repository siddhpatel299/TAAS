import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    Star,
    Pin,
    Archive,
    Trash2,
    MoreHorizontal,
    Copy,
    FolderOpen,
    Tag,
    Clock,
    Loader2,
    PanelLeftClose,
    PanelLeft,
    Grid3X3,
    List,
    SortAsc,
    SortDesc,
    X,
    Home,
    RotateCcw,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useNotesStore, NotesView } from '@/stores/notes.store';
import { NoteFolder, Note, NoteTag as NoteTagType } from '@/lib/notes-api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { CreateFolderDialog } from '@/components/notes/CreateFolderDialog';
import { DocumentPropertiesPanel } from '@/components/notes/DocumentPropertiesPanel';

// ====================
// FOLDER TREE COMPONENT
// ====================

interface FolderTreeItemProps {
    folder: NoteFolder;
    level: number;
    selectedFolderId?: string;
    onSelect: (folderId: string) => void;
}

function FolderTreeItem({ folder, level, selectedFolderId, onSelect }: FolderTreeItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;

    return (
        <div>
            <button
                onClick={() => onSelect(folder.id)}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                    'hover:bg-gray-100',
                    isSelected && 'bg-sky-50 text-sky-700'
                )}
                style={{ paddingLeft: `${12 + level * 16}px` }}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        className="p-0.5 hover:bg-gray-200 rounded"
                    >
                        {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                    </button>
                ) : (
                    <span className="w-4" />
                )}
                <FolderOpen className="w-4 h-4 text-gray-500" style={{ color: folder.color || undefined }} />
                <span className="flex-1 truncate text-left">{folder.name}</span>
                {folder._count?.notes !== undefined && folder._count.notes > 0 && (
                    <span className="text-xs text-gray-400">{folder._count.notes}</span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {folder.children!.map((child) => (
                            <FolderTreeItem
                                key={child.id}
                                folder={child}
                                level={level + 1}
                                selectedFolderId={selectedFolderId}
                                onSelect={onSelect}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ====================
// TAG PILL COMPONENT
// ====================

function TagPill({ tag, onClick, removable, onRemove }: { tag: NoteTagType; onClick?: () => void; removable?: boolean; onRemove?: () => void }) {
    return (
        <span
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                'bg-gray-100 text-gray-700',
                onClick && 'cursor-pointer hover:bg-gray-200'
            )}
            style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
        >
            <Tag className="w-3 h-3" />
            {tag.name}
            {removable && onRemove && (
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-0.5 hover:text-red-500">
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}

// ====================
// NOTE CARD COMPONENT
// ====================

interface NoteCardProps {
    note: Note;
    isSelected: boolean;
    onSelect: () => void;
    onPin: () => void;
    onFavorite: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onRestore?: () => void;
    onDeletePermanently?: () => void;
}

function NoteCard({ note, isSelected, onSelect, onPin, onFavorite, onDelete, onDuplicate, onRestore, onDeletePermanently }: NoteCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={onSelect}
            className={cn(
                'group relative p-4 rounded-xl border cursor-pointer transition-all',
                'hover:shadow-md hover:border-gray-300',
                isSelected ? 'border-sky-500 bg-sky-50 shadow-md' : 'border-gray-200 bg-white'
            )}
            style={note.color && note.color !== 'default' ? { backgroundColor: note.color } : undefined}
        >
            {/* Quick Actions */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onPin(); }}
                    className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        note.isPinned ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                >
                    <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                    className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        note.isFavorite ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                >
                    <Star className="w-3.5 h-3.5" fill={note.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                {note.isTrashed ? (
                                    <>
                                        {onRestore && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRestore(); setShowMenu(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                            >
                                                <RotateCcw className="w-4 h-4" /> Restore
                                            </button>
                                        )}
                                        {onDeletePermanently && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeletePermanently(); setShowMenu(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete Permanently
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowMenu(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Copy className="w-4 h-4" /> Duplicate
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" /> Move to Trash
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Pinned Badge */}
            {note.isPinned && (
                <div className="absolute top-2 left-2">
                    <Pin className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
                </div>
            )}

            {/* Content */}
            <div className={cn('space-y-2', note.isPinned && 'mt-4')}>
                <h3 className="font-semibold text-gray-900 line-clamp-2">{note.title || 'Untitled'}</h3>

                {note.content && (
                    <p className="text-sm text-gray-500 line-clamp-3">{note.content}</p>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.slice(0, 3).map((tag) => (
                            <TagPill key={tag.id} tag={tag} />
                        ))}
                        {note.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{note.tags.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(note.lastEditedAt || note.updatedAt), { addSuffix: true })}</span>
                    {note.folder && (
                        <>
                            <span>•</span>
                            <FolderOpen className="w-3 h-3" />
                            <span>{note.folder.name}</span>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ====================
// RICH TEXT EDITOR
// ====================

import { TiptapEditor } from '@/components/notes/TiptapEditor';

function NoteEditor({ note }: { note: Note }) {
    const { updateNote, isSaving } = useNotesStore();
    const [title, setTitle] = useState(note.title);
    const [hasChanges, setHasChanges] = useState(false);

    // Debounced title save
    useEffect(() => {
        if (!hasChanges) return;
        const timeout = setTimeout(() => {
            if (title !== note.title) {
                updateNote(note.id, { title, createVersion: false });
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [title, hasChanges, note.id, note.title, updateNote]);

    // Sync title when note changes
    useEffect(() => {
        setTitle(note.title);
        setHasChanges(false);
    }, [note.id, note.title]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        setHasChanges(true);
    };

    const handleEditorChange = (json: any, html: string, text: string) => {
        updateNote(note.id, {
            contentJson: json,
            contentHtml: html,
            content: text,
            createVersion: true,
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3 flex-1">
                    {note.icon && <span className="text-2xl">{note.icon}</span>}
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled"
                        className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 w-full"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {isSaving && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                    )}
                    {note.isFavorite && <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />}
                    {note.isPinned && <Pin className="w-4 h-4 text-amber-500" fill="currentColor" />}
                </div>
            </div>

            {/* Tags Bar */}
            {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-2 px-6 py-2 border-b border-gray-100">
                    {note.tags.map((tag) => (
                        <TagPill key={tag.id} tag={tag} />
                    ))}
                </div>
            )}

            {/* Tiptap Editor */}
            <div className="flex-1 overflow-auto">
                <TiptapEditor
                    content={note.contentJson || null}
                    onChange={handleEditorChange}
                    placeholder="Start writing your note... Type '/' for commands"
                />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
                <span>{note.wordCount} words • {note.readingTime} min read</span>
                <span>Last edited {formatDistanceToNow(new Date(note.lastEditedAt || note.updatedAt), { addSuffix: true })}</span>
            </div>
        </div>
    );
}

// ====================
// MAIN PAGE COMPONENT
// ====================

export function NotesPage() {
    const navigate = useNavigate();
    const { noteId } = useParams();

    const {
        notes,
        selectedNote,
        folderTree,
        tags,
        dashboard,
        filters,
        sortBy,
        sortOrder,
        viewMode,
        isLoading,
        isLoadingNote,
        sidebarCollapsed,
        editorPanelOpen,
        fetchNotes,
        fetchNote,
        fetchFolderTree,
        fetchTags,
        fetchDashboard,
        createNote,
        deleteNote,
        restoreNote,
        togglePin,
        toggleFavorite,
        duplicateNote,
        setFilters,
        setView,
        setSorting,
        setViewMode,
        setSelectedNote,
        toggleSidebar,
        setEditorPanelOpen,
    } = useNotesStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

    // Initial load
    useEffect(() => {
        fetchNotes();
        fetchFolderTree();
        fetchTags();
        fetchDashboard();
    }, [fetchNotes, fetchFolderTree, fetchTags, fetchDashboard]);

    // Load note from URL
    useEffect(() => {
        if (noteId && !selectedNote) {
            fetchNote(noteId);
        }
    }, [noteId, selectedNote, fetchNote]);

    // Search handler with debounce
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchQuery !== filters.search) {
                setFilters({ search: searchQuery || undefined });
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, filters.search, setFilters]);

    const handleNewNote = async () => {
        // alert('Starting Note Creation... (If you see this, the button works)');
        try {
            console.log('Creating note with folder:', filters.folderId);
            const note = await createNote({
                title: 'Untitled',
                folderId: filters.folderId || undefined,
            });
            navigate(`/plugins/notes/${note.id}`);
        } catch (error: any) {
            console.error('Failed to create note:', error);
            alert(error.response?.data?.error || 'Failed to create note');
        }
    };

    const handleSelectNote = (note: Note) => {
        setSelectedNote(note);
        navigate(`/plugins/notes/${note.id}`);
    };

    const handleCloseEditor = () => {
        setEditorPanelOpen(false);
        setSelectedNote(null);
        navigate('/plugins/notes');
    };

    const viewOptions: { view: NotesView; label: string; icon: React.ElementType }[] = [
        { view: 'all', label: 'All Notes', icon: FileText },
        { view: 'pinned', label: 'Pinned', icon: Pin },
        { view: 'favorites', label: 'Favorites', icon: Star },
        { view: 'archived', label: 'Archived', icon: Archive },
        { view: 'trash', label: 'Trash', icon: Trash2 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <ModernSidebar />

            <main className="ml-20 flex h-screen">
                {/* LEFT SIDEBAR - Folders & Navigation */}
                <AnimatePresence>
                    {!sidebarCollapsed && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 260, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full border-r border-gray-200 bg-white flex flex-col overflow-hidden"
                        >
                            {/* New Note Button */}
                            <div className="p-4">
                                <button
                                    onClick={handleNewNote}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/25"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Note
                                </button>
                            </div>

                            {/* Quick Filters */}
                            <div className="px-3 pb-2 space-y-0.5">
                                {viewOptions.map(({ view, label, icon: Icon }) => (
                                    <button
                                        key={view}
                                        onClick={() => setView(view)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                                            filters.view === view && !filters.folderId
                                                ? 'bg-sky-50 text-sky-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="flex-1 text-left">{label}</span>
                                        {view === 'all' && dashboard && (
                                            <span className="text-xs text-gray-400">{dashboard.totalNotes}</span>
                                        )}
                                        {view === 'pinned' && dashboard && dashboard.pinnedCount > 0 && (
                                            <span className="text-xs text-gray-400">{dashboard.pinnedCount}</span>
                                        )}
                                        {view === 'favorites' && dashboard && dashboard.favoriteCount > 0 && (
                                            <span className="text-xs text-gray-400">{dashboard.favoriteCount}</span>
                                        )}
                                        {view === 'trash' && dashboard && dashboard.trashedCount > 0 && (
                                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{dashboard.trashedCount}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Folder Tree */}
                            <div className="flex-1 overflow-auto border-t border-gray-100">
                                <div className="sticky top-0 bg-white px-4 py-2 flex items-center justify-between border-b border-gray-100">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Folders</span>
                                    <button
                                        onClick={() => setShowFolderDialog(true)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                        title="Create folder"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="p-2">
                                    {folderTree.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4">No folders yet</p>
                                    ) : (
                                        folderTree.map((folder) => (
                                            <FolderTreeItem
                                                key={folder.id}
                                                folder={folder}
                                                level={0}
                                                selectedFolderId={filters.folderId || undefined}
                                                onSelect={(folderId) => setFilters({ folderId, view: 'all' })}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="border-t border-gray-100">
                                <div className="px-4 py-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</span>
                                </div>
                                <div className="px-3 pb-3 flex flex-wrap gap-1.5 max-h-24 overflow-auto">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => {
                                                const currentTags = filters.tagIds || [];
                                                const newTags = currentTags.includes(tag.id)
                                                    ? currentTags.filter((id) => id !== tag.id)
                                                    : [...currentTags, tag.id];
                                                setFilters({ tagIds: newTags.length > 0 ? newTags : undefined });
                                            }}
                                            className={cn(
                                                'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                                                filters.tagIds?.includes(tag.id)
                                                    ? 'ring-2 ring-offset-1'
                                                    : 'hover:ring-1 ring-gray-300'
                                            )}
                                            style={{
                                                backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                                                color: tag.color || '#6b7280',
                                            }}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                    {tags.length === 0 && (
                                        <p className="text-xs text-gray-400 w-full text-center py-2">No tags yet</p>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* MIDDLE - Notes List */}
                <div className={cn(
                    'flex-1 flex flex-col h-full min-w-0 border-r border-gray-200 bg-white',
                    editorPanelOpen && 'max-w-md'
                )}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <button
                                onClick={toggleSidebar}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                            >
                                {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                            </button>

                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn('p-2 rounded-lg', viewMode === 'list' ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100')}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn('p-2 rounded-lg', viewMode === 'grid' ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100')}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => setSorting(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                            >
                                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Breadcrumb / Current View */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <button onClick={() => setFilters({ folderId: undefined, view: 'all' })} className="hover:text-gray-700">
                                <Home className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-3 h-3" />
                            <span className="font-medium text-gray-700">
                                {filters.folderId
                                    ? folderTree.find((f) => f.id === filters.folderId)?.name || 'Folder'
                                    : viewOptions.find((v) => v.view === filters.view)?.label || 'All Notes'}
                            </span>
                        </div>
                    </div>

                    {/* Notes List */}
                    <div className="flex-1 overflow-auto p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <FileText className="w-12 h-12 mb-3" />
                                <p className="text-lg font-medium">No notes yet</p>
                                <p className="text-sm">Create your first note to get started</p>
                                <button
                                    onClick={handleNewNote}
                                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> New Note
                                </button>
                            </div>
                        ) : (
                            <div className={cn(
                                'gap-4',
                                viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col'
                            )}>
                                <AnimatePresence mode="popLayout">
                                    {notes.map((note) => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            isSelected={selectedNote?.id === note.id}
                                            onSelect={() => handleSelectNote(note)}
                                            onPin={() => togglePin(note.id)}
                                            onFavorite={() => toggleFavorite(note.id)}
                                            onDelete={() => deleteNote(note.id)}
                                            onDuplicate={() => duplicateNote(note.id)}
                                            onRestore={() => restoreNote(note.id)}
                                            onDeletePermanently={() => deleteNote(note.id, true)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT - Editor Panel */}
                <AnimatePresence>
                    {editorPanelOpen && selectedNote && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '50%', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full bg-white flex flex-col overflow-hidden min-w-[400px]"
                        >
                            {/* Close button */}
                            <button
                                onClick={handleCloseEditor}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg text-gray-500 z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {isLoadingNote ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                                </div>
                            ) : (
                                <NoteEditor note={selectedNote} />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Document Properties Panel */}
                <AnimatePresence>
                    {showPropertiesPanel && selectedNote && (
                        <DocumentPropertiesPanel
                            note={selectedNote}
                            isOpen={showPropertiesPanel}
                            onClose={() => setShowPropertiesPanel(false)}
                        />
                    )}
                </AnimatePresence>
            </main>

            {/* Create Folder Dialog */}
            <CreateFolderDialog
                isOpen={showFolderDialog}
                onClose={() => setShowFolderDialog(false)}
                parentId={filters.folderId || undefined}
            />
        </div>
    );
}
