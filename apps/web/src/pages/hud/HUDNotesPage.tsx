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
} from 'lucide-react';
import { HUDLayout } from '@/layouts/HUDLayout';
import { HUDPanel } from '@/components/hud/HUDComponents';
import { useNotesStore } from '@/stores/notes.store';
import { NoteFolder, Note, NoteTag as NoteTagType } from '@/lib/notes-api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { TiptapEditor } from '@/components/notes/TiptapEditor';
import { CreateFolderDialog } from '@/components/notes/CreateFolderDialog';
import { PageLinkPicker } from '@/components/notes/PageLinkPicker';

// ====================
// HUD FOLDER TREE ITEM
// ====================

interface HUDFolderTreeItemProps {
    folder: NoteFolder;
    level: number;
    selectedFolderId?: string;
    selectedNoteId?: string;
    notes?: Note[];
    onSelectFolder: (folderId: string) => void;
    onSelectNote?: (note: Note) => void;
}

function HUDFolderTreeItem({ folder, level, selectedFolderId, selectedNoteId, notes = [], onSelectFolder, onSelectNote }: HUDFolderTreeItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;

    // Filter notes that belong to this folder
    const folderNotes = notes.filter(n => n.folderId === folder.id && !n.isTrashed);
    const hasContent = hasChildren || folderNotes.length > 0;

    return (
        <div>
            <div
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-all border-l-2 cursor-pointer',
                    'hover:bg-cyan-950/30 hover:text-cyan-400',
                    isSelected
                        ? 'border-cyan-500 bg-cyan-950/50 text-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                        : 'border-transparent text-gray-400'
                )}
                style={{ paddingLeft: `${12 + level * 16}px` }}
            >
                {hasContent ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        className="p-0.5 hover:text-cyan-300 rounded transition-colors"
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
                <FolderOpen className={cn("w-4 h-4", isSelected ? "text-cyan-400" : "text-gray-500")} />
                <span className="flex-1 truncate text-left font-mono">{folder.name}</span>
                {folder._count?.notes !== undefined && folder._count.notes > 0 && (
                    <span className="text-[10px] bg-cyan-900/50 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                        {folder._count.notes}
                    </span>
                )}
            </div>

            <AnimatePresence>
                {isOpen && hasContent && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        {/* Child Folders */}
                        {hasChildren && folder.children!.map((child) => (
                            <HUDFolderTreeItem
                                key={child.id}
                                folder={child}
                                level={level + 1}
                                selectedFolderId={selectedFolderId}
                                selectedNoteId={selectedNoteId}
                                notes={notes}
                                onSelectFolder={onSelectFolder}
                                onSelectNote={onSelectNote}
                            />
                        ))}

                        {/* Notes in this folder */}
                        {folderNotes.map((note) => (
                            <div
                                key={note.id}
                                onClick={() => onSelectNote?.(note)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-all border-l-2 cursor-pointer',
                                    'hover:bg-cyan-950/30 hover:text-cyan-300',
                                    selectedNoteId === note.id
                                        ? 'border-cyan-400 bg-cyan-900/30 text-cyan-300'
                                        : 'border-transparent text-gray-500'
                                )}
                                style={{ paddingLeft: `${28 + (level + 1) * 16}px` }}
                            >
                                {note.icon ? (
                                    <span className="text-sm grayscale opacity-70">{note.icon}</span>
                                ) : (
                                    <FileText className="w-3.5 h-3.5 opacity-50" />
                                )}
                                <span className="flex-1 truncate text-left font-mono text-xs">{note.title || 'Untitled'}</span>
                            </div>
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
    onRestore?: () => void;
    onDeletePermanently?: () => void;
}

function HUDNoteCard({ note, isSelected, onSelect, onPin, onDelete, onDuplicate, onRestore, onDeletePermanently }: HUDNoteCardProps) {
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
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-black border border-cyan-700/50 rounded shadow-[0_0_20px_rgba(0,255,255,0.2)] z-20 py-1">
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
            <div className="flex-1 overflow-auto p-6 relative z-10 hud-editor-wrapper">
                <style>{`
                    .hud-editor-wrapper .ProseMirror {
                        color: #a5f3fc !important;
                        font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
                        background: transparent !important;
                    }
                    .hud-editor-wrapper .ProseMirror h1, 
                    .hud-editor-wrapper .ProseMirror h2, 
                    .hud-editor-wrapper .ProseMirror h3 {
                        color: #22d3ee !important;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        border-bottom: 1px solid rgba(34, 211, 238, 0.2);
                        padding-bottom: 0.5rem;
                    }
                    .hud-editor-wrapper .ProseMirror blockquote {
                        border-left-color: #06b6d4 !important;
                        color: #67e8f9 !important;
                        font-style: italic;
                    }
                    .hud-editor-wrapper .ProseMirror a {
                        color: #00ffff !important;
                        text-decoration: none;
                        border-bottom: 1px dashed #00ffff;
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
        fetchNotes,
        fetchNote,
        fetchFolderTree,
        createNote,
        deleteNote,
        togglePin,
        duplicateNote,
        setSelectedNote,
    } = useNotesStore();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [createFolderOpen, setCreateFolderOpen] = useState(false);

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
    }, [noteId, fetchNote, setSelectedNote]);

    const handleCreateNote = async () => {
        try {
            const newNote = await createNote({ title: '', content: '' });
            navigate(`/hud/notes/${newNote.id}`);
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    };

    const filteredNotes = notes.filter(n =>
        !n.isTrashed &&
        (n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase())))
    );

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
                    <div className="p-4 border-b border-cyan-900/50 flex items-center justify-between">
                        <h2 className="text-cyan-400 font-bold tracking-widest text-sm">ARCHIVES</h2>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCreateFolderOpen(true)}
                                title="New Folder"
                                className="hud-btn p-2"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCreateNote}
                                title="New Note"
                                className="hud-btn p-2"
                            >
                                <Plus className="w-4 h-4" />
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

                    {/* Folder Tree & Note List */}
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-cyan-900">
                        {/* Folders */}
                        <div className="mb-4">
                            {folderTree.map(folder => (
                                <HUDFolderTreeItem
                                    key={folder.id}
                                    folder={folder}
                                    level={0}
                                    selectedNoteId={noteId}
                                    notes={notes}
                                    onSelectFolder={() => { }}
                                    onSelectNote={(note) => navigate(`/hud/notes/${note.id}`)}
                                />
                            ))}
                        </div>

                        {/* Root Notes / All Notes List */}
                        <div className="space-y-1">
                            {filteredNotes
                                .filter(n => !n.folderId)
                                .map(note => (
                                    <HUDNoteCard
                                        key={note.id}
                                        note={note}
                                        isSelected={note.id === noteId}
                                        onSelect={() => navigate(`/hud/notes/${note.id}`)}
                                        onPin={() => togglePin(note.id)}
                                        onDelete={() => deleteNote(note.id)}
                                        onDuplicate={() => duplicateNote(note.id)}
                                    />
                                ))}
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

                {/* Main Editor Panel */}
                <HUDPanel className="flex-1 overflow-hidden flex flex-col relative" glow>
                    {selectedNote ? (
                        <HUDNoteEditor note={selectedNote} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-cyan-800 opacity-50">
                            <FileText className="w-24 h-24 mb-4 opacity-20" />
                            <h2 className="text-xl font-mono tracking-widest">NO DATA SELECTED</h2>
                            <p className="text-xs mt-2">SELECT A FILE FROM THE ARCHIVES</p>
                        </div>
                    )}
                </HUDPanel>
            </div>

            <CreateFolderDialog
                isOpen={createFolderOpen}
                onClose={() => setCreateFolderOpen(false)}
                parentId={undefined}
            />
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
