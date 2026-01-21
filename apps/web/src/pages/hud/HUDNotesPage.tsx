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
    ImagePlus,
    RotateCcw,
    Star,
    Archive,
    Move,
    List,
    PanelRightClose,
    Edit2,
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel } from '@/components/hud/HUDComponents';
import { useNotesStore } from '@/stores/notes.store';
import { NoteFolder, Note, NoteTag as NoteTagType } from '@/lib/notes-api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { TiptapEditor } from '@/components/notes/TiptapEditor';
import { CreateFolderDialog } from '@/components/notes/CreateFolderDialog';
import { MoveToFolderDialog } from '@/components/notes/MoveToFolderDialog';
import { PageLinkPicker } from '@/components/notes/PageLinkPicker';
import { TableOfContents } from '@/components/notes/TableOfContents';

// ====================
// HUD FOLDER TREE ITEM
// ====================

interface HUDFolderTreeItemProps {
    folder: NoteFolder;
    level: number;
    selectedFolderId?: string | null;
    selectedNoteId?: string;
    notes?: Note[];
    onSelectFolder: (folderId: string) => void;
    onSelectNote?: (note: Note) => void;
    onAction?: (action: string, folder: NoteFolder) => void;
}

function HUDFolderTreeItem({ folder, level, selectedFolderId, selectedNoteId, notes = [], onSelectFolder, onSelectNote, onAction }: HUDFolderTreeItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;

    // Filter notes that belong to this folder
    const folderNotes = notes.filter(n => n.folderId === folder.id && !n.isTrashed);

    return (
        <div className="select-none relative group/folder">
            <div
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-all border-l-2 cursor-pointer relative',
                    'hover:bg-cyan-950/30 hover:text-cyan-400 group/item',
                    isSelected
                        ? 'border-cyan-500 bg-cyan-950/50 text-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                        : 'border-transparent text-gray-400'
                )}
                style={{ paddingLeft: `${12 + level * 16}px` }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className={cn("p-0.5 hover:text-cyan-300 rounded transition-colors", !hasChildren && "invisible")}
                >
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {folder.icon ? <span>{folder.icon}</span> : <FolderOpen className={cn("w-4 h-4", isSelected ? "text-cyan-400" : "text-gray-500")} />}

                <span className="flex-1 truncate text-left font-mono">{folder.name}</span>

                {folderNotes.length > 0 && (
                    <span className="text-[10px] bg-cyan-900/50 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                        {folderNotes.length}
                    </span>
                )}

                {/* Folder Actions Menu Trigger */}
                <div className="absolute right-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className="p-1 hover:bg-cyan-900/80 rounded mx-1 text-cyan-500"
                    >
                        <MoreHorizontal className="w-3 h-3" />
                    </button>
                </div>

                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                        <div className="absolute right-0 top-full mt-1 w-40 bg-black border border-cyan-700/50 rounded shadow-[0_0_20px_rgba(0,255,255,0.2)] z-50 py-1 font-mono text-xs">
                            <button onClick={(e) => { e.stopPropagation(); onAction?.('create_note', folder); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-cyan-200 hover:bg-cyan-900/30">
                                <FileText className="w-3 h-3" /> New Note
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onAction?.('create_sub', folder); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-cyan-200 hover:bg-cyan-900/30">
                                <Plus className="w-3 h-3" /> New Subfolder
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onAction?.('rename', folder); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-cyan-200 hover:bg-cyan-900/30">
                                <Edit2 className="w-3 h-3" /> Rename
                            </button>
                            <div className="h-px bg-cyan-900/30 my-1" />
                            <button onClick={(e) => { e.stopPropagation(); onAction?.('delete', folder); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-900/20">
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    </>
                )}
            </div>

            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        {folder.children!.map((child) => (
                            <HUDFolderTreeItem
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ====================
// HUD NOTE CARD
// ====================

interface HUDNoteCardProps {
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

function HUDNoteCard({ note, isSelected, onSelect, onPin, onDelete, onDuplicate, onMove, onRestore, onDeletePermanently }: HUDNoteCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    // Extract simple preview
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
                'hover:shadow-[0_0_15px_rgba(0,255,255,0.15)] hover:border-cyan-500/50',
                isSelected
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                    : 'border-cyan-900/50 bg-black/40 text-gray-400'
            )}
        >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50" />

            {/* Quick Actions */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={(e) => { e.stopPropagation(); onPin(); }} className={cn("p-1 rounded hover:bg-cyan-900/50", note.isPinned ? "text-amber-400" : "text-gray-500")}>
                    <Pin className="w-3 h-3" />
                </button>
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1 rounded hover:bg-cyan-900/50 text-gray-500">
                        <MoreHorizontal className="w-3 h-3" />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-black border border-cyan-700/50 rounded shadow-[0_0_20px_rgba(0,255,255,0.2)] z-20 py-1 font-mono">
                                {note.isTrashed ? (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); onRestore?.(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-400 hover:bg-cyan-900/30">
                                            <RotateCcw className="w-3 h-3" /> Restore
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeletePermanently?.(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20">
                                            <Trash2 className="w-3 h-3" /> Delete Forever
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); onMove(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-900/30">
                                            <Move className="w-3 h-3" /> Move to...
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-900/30">
                                            <Copy className="w-3 h-3" /> Duplicate
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20">
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
                {note.icon && <span className="text-lg opacity-80 grayscale">{note.icon}</span>}
                <div>
                    <h3 className={cn("font-mono text-sm font-semibold truncate", isSelected ? "text-cyan-300" : "text-gray-300")}>
                        {note.title || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-0.5 font-mono">
                        <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                {note.tags.slice(0, 2).map((t: NoteTagType) => (
                                    <span key={t.id} className="text-cyan-600">#{t.name}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview text */}
            <p className="text-[11px] text-gray-500 line-clamp-2 font-mono opacity-80 pl-1 border-l border-zinc-800">
                {preview || 'No content...'}
            </p>
        </motion.div>
    );
}

// ====================
// HUD NOTE EDITOR
// ====================

interface HUDNoteEditorProps {
    note: Note;
}

function HUDNoteEditor({ note }: HUDNoteEditorProps) {
    const { updateNote, isSaving } = useNotesStore();
    const [title, setTitle] = useState(note.title);
    const [coverImage, setCoverImage] = useState<string | null>(note.coverImage || null);
    const [showPageLinkPicker, setShowPageLinkPicker] = useState(false);
    const [editorInstance, setEditorInstance] = useState<any>(null);

    // Sync title
    useEffect(() => {
        setTitle(note.title);
        setCoverImage(note.coverImage || null);
    }, [note.id, note.title, note.coverImage]);

    // Save title debounced
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (title !== note.title) {
                updateNote(note.id, { title, createVersion: false });
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [title]);

    const handleEditorChange = (json: any, html: string, text: string) => {
        updateNote(note.id, {
            contentJson: json,
            contentHtml: html,
            content: text,
            createVersion: true,
        });
    };

    return (
        <div className="flex flex-col h-full bg-black/40 relative">
            {/* Grid Background Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Cover Image in HUD style - Monochromatic or filtered */}
            {coverImage && (
                <div className="h-40 w-full relative overflow-hidden border-b border-cyan-900/50 skew-y-1 transform origin-top-left">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 grayscale mix-blend-screen"
                        style={{ backgroundImage: `url(${coverImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                    <button
                        onClick={() => updateNote(note.id, { coverImage: null })}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded hover:bg-red-500/50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-cyan-900/30 relative z-10">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="UNTITLED_NOTE"
                    className="bg-transparent border-none outline-none text-2xl font-bold font-mono text-cyan-400 placeholder-cyan-900/50 w-full tracking-wider"
                    style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}
                />
                <div className="flex items-center gap-3">
                    {isSaving && <span className="text-xs text-cyan-600 animate-pulse font-mono">SAVING...</span>}
                    <button
                        onClick={() => {
                            const url = window.prompt("ENTER IMAGE URL:");
                            if (url) { setCoverImage(url); updateNote(note.id, { coverImage: url }); }
                        }}
                        className="text-cyan-700 hover:text-cyan-400 transition-colors"
                        title="SET COVER"
                    >
                        <ImagePlus className="w-5 h-5" />
                    </button>
                    <button
                        className={cn("text-cyan-700 hover:text-cyan-400 transition-colors", note.isPinned && "text-amber-500")}
                        onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                    >
                        <Pin className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Editor Area - Customizing Tiptap via CSS injection or wrapper */}
            <div className="flex-1 overflow-auto p-6 relative z-10 hud-editor-wrapper scrollbar-thin scrollbar-thumb-cyan-900">
                <style>{`
                    .hud-editor-wrapper .ProseMirror {
                        color: #a5f3fc !important;
                        font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
                        background: transparent !important;
                        min-height: 400px;
                    }
                    .hud-editor-wrapper .ProseMirror:focus {
                        outline: none;
                    }
                    .hud-editor-wrapper .ProseMirror h1, 
                    .hud-editor-wrapper .ProseMirror h2, 
                    .hud-editor-wrapper .ProseMirror h3 {
                        color: #22d3ee !important;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        border-bottom: 1px solid rgba(34, 211, 238, 0.2);
                        padding-bottom: 0.5rem;
                        margin-top: 1.5rem;
                    }
                    .hud-editor-wrapper .ProseMirror ul,
                    .hud-editor-wrapper .ProseMirror ol {
                        padding-left: 1.5rem;
                    }
                    .hud-editor-wrapper .ProseMirror li {
                        margin-bottom: 0.5rem;
                    }
                    .hud-editor-wrapper .ProseMirror blockquote {
                        border-left: 2px solid #06b6d4 !important;
                        padding-left: 1rem;
                        color: #67e8f9 !important;
                        font-style: italic;
                    }
                    .hud-editor-wrapper .ProseMirror a {
                        color: #00ffff !important;
                        text-decoration: none;
                        border-bottom: 1px dashed #00ffff;
                    }
                        color: rgba(34, 211, 238, 0.3) !important;
                        content: attr(data-placeholder);
                        float: left;
                        pointer-events: none;
                        height: 0;
                    }

                    /* Override Tiptap Toolbar for HUD */
                    .hud-theme .tiptap-editor .sticky {
                        background-color: rgba(0, 0, 0, 0.6) !important;
                        border-bottom: 1px solid rgba(34, 211, 238, 0.2) !important;
                        backdrop-filter: blur(4px);
                    }
                    .hud-theme .tiptap-editor button {
                        color: #64748b !important;
                    }
                    .hud-theme .tiptap-editor button:hover,
                    .hud-theme .tiptap-editor button[data-active="true"],
                    .hud-theme .tiptap-editor button[data-state="on"] {
                        color: #22d3ee !important;
                        background-color: rgba(34, 211, 238, 0.1) !important;
                    }
                    .hud-theme .tiptap-editor .w-px {
                        background-color: rgba(34, 211, 238, 0.2) !important;
                    }

                    /* Override TOC Styles */
                    .hud-toc-wrapper > div {
                        background-color: transparent !important;
                        border-right: none !important;
                        color: #94a3b8;
                    }
                    .hud-toc-wrapper button {
                         color: #94a3b8;
                    }
                    .hud-toc-wrapper button:hover {
                        background-color: rgba(34, 211, 238, 0.1) !important;
                        color: #22d3ee !important;
                    }
                    .hud-toc-wrapper .font-medium {
                        color: #e2e8f0 !important;
                    }
                `}</style>
                <TiptapEditor
                    content={note.contentJson || null}
                    onChange={handleEditorChange}
                    onEditorReady={setEditorInstance}
                    onOpenPageLink={() => setShowPageLinkPicker(true)}
                    placeholder="INITIATE DATA ENTRY..."
                />
            </div>

            <PageLinkPicker
                isOpen={showPageLinkPicker}
                onClose={() => setShowPageLinkPicker(false)}
                excludeNoteId={note.id}
                onSelect={(selectedNote) => {
                    if (editorInstance) {
                        editorInstance.chain().focus().insertContent({
                            type: 'text',
                            marks: [{ type: 'link', attrs: { href: `/plugins/notes/${selectedNote.id}` } }],
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
// MAIN HUD PAGE
// ====================

export function HUDNotesPage() {
    const navigate = useNavigate();
    const { noteId } = useParams();

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

    // Handle initial load based on route
    useEffect(() => {
        if (noteId) {
            fetchNote(noteId);
        } else {
            setSelectedNote(null);
        }
    }, [noteId]); // Removed recursive deps

    const handleCreateNote = async () => {
        try {
            const newNote = await createNote({
                title: '',
                content: '',
                folderId: filters.folderId || undefined
            });
            navigate(`/hud/notes/${newNote.id}`);
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    };

    const handleFolderAction = (action: string, folder: NoteFolder) => {
        if (action === 'create_note') {
            createNote({
                title: '',
                content: '',
                folderId: folder.id
            }).then(note => navigate(`/plugins/notes/${note.id}`));
        } else if (action === 'create_sub') {
            setParentFolderId(folder.id);
            setCreateFolderOpen(true);
        } else if (action === 'delete') {
            if (confirm(`DELETE FOLDER "${folder.name}" AND ALL CONTENTS? THIS ACTION IS IRREVERSIBLE.`)) {
                deleteFolder(folder.id);
            }
        } else if (action === 'rename') {
            // TODO: Add rename dialog
            const newName = prompt("ENTER NEW FOLDER NAME:", folder.name);
            if (newName && newName !== folder.name) {
                useNotesStore.getState().updateFolder(folder.id, { name: newName });
            }
        }
    };

    // Filter notes client-side only for search, otherwise rely on store filters
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

    return (
        <HUDLayout>
            <div className="h-[calc(100vh-140px)] flex gap-4 overflow-hidden relative">
                {/* Left Panel: Folders & List */}
                <HUDPanel
                    className={cn(
                        "flex flex-col transition-all duration-300 relative z-20",
                        isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-80"
                    )}
                    glow
                >
                    <div className="p-4 border-b border-cyan-900/50 flex items-center justify-between bg-black/40">
                        <h2 className="text-cyan-400 font-bold tracking-widest text-sm flex items-center gap-2">
                            <Archive className="w-4 h-4" /> ARCHIVES
                        </h2>
                        <div className="flex gap-1">
                            <button
                                onClick={() => { setParentFolderId(undefined); setCreateFolderOpen(true); }}
                                title="New Root Folder"
                                className="hud-btn p-2"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCreateNote}
                                title="New Note"
                                className="hud-btn p-2"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-cyan-900/30">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-cyan-600" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="SEARCH_DATABASE..."
                                className="w-full bg-cyan-950/20 border border-cyan-800 rounded px-8 py-1.5 text-xs text-cyan-300 outline-none focus:border-cyan-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Navigation Filter Tabs */}
                    <div className="flex p-2 gap-1 border-b border-cyan-900/30 overflow-x-auto scrollbar-none">
                        <button
                            onClick={() => setFilters({ view: 'all', folderId: undefined })}
                            className={cn("px-3 py-1 text-[10px] rounded font-mono border whitespace-nowrap", filters.view === 'all' && !filters.folderId ? "bg-cyan-900/50 border-cyan-500 text-cyan-300" : "border-transparent text-gray-500 hover:text-cyan-400")}
                        >
                            ALL DATA
                        </button>
                        <button
                            onClick={() => setFilters({ view: 'favorites' })}
                            className={cn("px-3 py-1 text-[10px] rounded font-mono border whitespace-nowrap flex items-center gap-1", filters.view === 'favorites' ? "bg-cyan-900/50 border-cyan-500 text-cyan-300" : "border-transparent text-gray-500 hover:text-cyan-400")}
                        >
                            <Star className="w-3 h-3" /> FAVORITES
                        </button>
                        <button
                            onClick={() => setFilters({ view: 'trash' })}
                            className={cn("px-3 py-1 text-[10px] rounded font-mono border whitespace-nowrap flex items-center gap-1", filters.view === 'trash' ? "bg-cyan-900/50 border-cyan-500 text-cyan-300" : "border-transparent text-gray-500 hover:text-cyan-400")}
                        >
                            <Trash2 className="w-3 h-3" /> TRASH
                        </button>
                    </div>

                    {/* Folder Tree & Note List */}
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-cyan-900">
                        {/* Folders (Only show in 'all' view) */}
                        {filters.view === 'all' && (
                            <div className="mb-4 space-y-0.5">
                                {folderTree.map(folder => (
                                    <HUDFolderTreeItem
                                        key={folder.id}
                                        folder={folder}
                                        level={0}
                                        selectedFolderId={filters.folderId}
                                        selectedNoteId={noteId}
                                        notes={notes} // Pass all notes to calculate counts correctly
                                        onSelectFolder={(id) => setFilters({ folderId: id, view: 'all' })}
                                        onSelectNote={(note) => navigate(`/plugins/notes/${note.id}`)}
                                        onAction={handleFolderAction}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Trash Header */}
                        {filters.view === 'trash' && notes.length > 0 && (
                            <div className="mb-2 px-2 flex justify-between items-center">
                                <span className="text-xs text-red-400 font-mono">DELETED_ITEMS ({notes.length})</span>
                                <button onClick={() => { if (confirm("EMPTY TRASH?")) emptyTrash(); }} className="text-[10px] text-red-500 hover:text-red-400 underline">EMPTY_ALL</button>
                            </div>
                        )}

                        {/* Filtered Notes List */}
                        <div className="space-y-1">
                            {/* If we are filtering by folder, only show notes in that folder. 
                                The store handles fetching efficiently, but we might want to ensure we're reacting to the active list */}
                            {filteredNotes.length === 0 ? (
                                <div className="p-8 text-center opacity-40">
                                    <p className="font-mono text-xs text-cyan-600">NO_DATA_FOUND</p>
                                </div>
                            ) : (
                                filteredNotes.map(note => (
                                    <HUDNoteCard
                                        key={note.id}
                                        note={note}
                                        isSelected={note.id === noteId}
                                        onSelect={() => navigate(`/plugins/notes/${note.id}`)}
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
                </HUDPanel>

                {/* Toggle Sidebar Button */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute top-1/2 left-0 z-30 transform -translate-y-1/2 -translate-x-1/2 bg-cyan-950 border border-cyan-500 rounded-full p-1 text-cyan-400 hover:text-white transition-all hover:scale-110"
                    style={{ left: isSidebarCollapsed ? '0px' : '320px' }}
                >
                    {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>

                {/* Main Editor Area */}
                <div className="flex-1 flex gap-4 overflow-hidden min-w-0">
                    <HUDPanel className="flex-1 overflow-hidden flex flex-col relative" glow>
                        {selectedNote ? (
                            <HUDNoteEditor note={selectedNote} />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-cyan-800 opacity-50 bg-[url('/grid.png')]">
                                <div className="w-32 h-32 mb-6 relative">
                                    <div className="absolute inset-0 border-2 border-cyan-800 rounded-full animate-ping opacity-20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FileText className="w-12 h-12 text-cyan-600" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-mono tracking-widest text-cyan-500 mb-2">SYSTEM_IDLE</h2>
                                <p className="text-xs font-mono text-cyan-700">SELECT A DATA FILE TO INITIATE SEQUENCE</p>
                            </div>
                        )}
                    </HUDPanel>

                    {/* Table of Contents Panel */}
                    {selectedNote && (
                        <HUDPanel
                            className={cn(
                                "flex flex-col transition-all duration-300 relative z-20 overflow-hidden",
                                isTOCCollapsed ? "w-0 opacity-0 border-0 p-0" : "w-60"
                            )}
                            glow
                        >
                            <div className="h-full hud-toc-wrapper">
                                <TableOfContents
                                    contentJson={selectedNote.contentJson}
                                    onHeadingClick={(_id) => {
                                        // TODO: Implement scrolling logic for Tiptap
                                    }}
                                    isCollapsed={false} // Managed by parent panel visibility
                                />
                            </div>

                            {/* Floating Toggle for TOC */}
                            <button
                                onClick={() => setIsTOCCollapsed(!isTOCCollapsed)}
                                className="absolute top-2 right-full mr-2 z-30 bg-cyan-950 border border-cyan-500 rounded p-1 text-cyan-400 hover:text-white"
                                title="Toggle Table of Contents"
                            >
                                {isTOCCollapsed ? <List className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                            </button>
                        </HUDPanel>
                    )}

                    {/* Toggle Button if TOC is hidden but note is selected */}
                    {selectedNote && isTOCCollapsed && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30">
                            <button
                                onClick={() => setIsTOCCollapsed(false)}
                                className="bg-cyan-950 border border-cyan-500 rounded-l p-1 text-cyan-400 hover:text-white shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
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
        </HUDLayout>
    );
}

// Helper icon
function PanelLeftClose({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <path d="m14 9-3 3 3 3" />
        </svg>
    )
}
