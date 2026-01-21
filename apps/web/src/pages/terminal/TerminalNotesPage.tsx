import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    Star,
    Trash2,
    Folder,
    FolderOpen,
    Terminal,
    Save,
    CornerDownRight
} from 'lucide-react';
import { TerminalLayout } from '@/layouts/TerminalLayout';
import { useNotesStore } from '@/stores/notes.store';
import { NoteFolder, Note } from '@/lib/notes-api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { TiptapEditor } from '@/components/notes/TiptapEditor';
import { CreateFolderDialog } from '@/components/notes/CreateFolderDialog';
import { PageLinkPicker } from '@/components/notes/PageLinkPicker';

// ====================
// TERMINAL FOLDER ITEM
// ====================

interface TerminalFolderItemProps {
    folder: NoteFolder;
    level: number;
    selectedFolderId?: string;
    onSelectFolder: (folderId: string) => void;
    onSelectNote: (note: Note) => void;
    selectedNoteId?: string;
    notes?: Note[];
}

function TerminalFolderItem({ folder, level, selectedFolderId, onSelectFolder, onSelectNote, selectedNoteId, notes = [] }: TerminalFolderItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;
    const folderNotes = notes.filter(n => n.folderId === folder.id && !n.isTrashed);
    const hasContent = hasChildren || folderNotes.length > 0;

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-2 px-2 py-1 cursor-pointer select-none font-mono text-sm",
                    isSelected ? "bg-[#333] text-amber-400" : "text-gray-400 hover:text-white"
                )}
                style={{ paddingLeft: `${level * 16}px` }}
                onClick={() => onSelectFolder(folder.id)}
            >
                <span
                    className="cursor-pointer font-bold w-4 text-center"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                >
                    {hasContent ? (isOpen ? '[-]' : '[+]') : '[ ]'}
                </span>

                {isOpen ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                <span className="truncate">{folder.name}</span>
            </div>

            {isOpen && hasContent && (
                <div>
                    {folder.children?.map(child => (
                        <TerminalFolderItem
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            onSelectNote={onSelectNote}
                            selectedNoteId={selectedNoteId}
                            notes={notes}
                        />
                    ))}
                    {folderNotes.map(note => (
                        <div
                            key={note.id}
                            onClick={() => onSelectNote(note)}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1 cursor-pointer font-mono text-sm hover:bg-[#222]",
                                selectedNoteId === note.id ? "text-green-400" : "text-gray-500"
                            )}
                            style={{ paddingLeft: `${(level + 1) * 20 + 20}px` }}
                        >
                            <CornerDownRight className="w-3 h-3 opacity-50" />
                            <span className="truncate">{note.title || 'untitled.txt'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ====================
// TERMINAL PAGE
// ====================

export function TerminalNotesPage() {
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
        updateNote,
        deleteNote,
        togglePin,
    } = useNotesStore();

    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    // Removed unused state
    // const [searchQuery, setSearchQuery] = useState('');
    // const [editorInstance, setEditorInstance] = useState<any>(null);

    useEffect(() => {
        fetchNotes();
        fetchFolderTree();
    }, [fetchNotes, fetchFolderTree]);

    useEffect(() => {
        if (noteId) {
            fetchNote(noteId);
        }
    }, [noteId, fetchNote]);

    const handleCreateNote = async () => {
        const newNote = await createNote({ title: 'untitled.txt', content: '' });
        navigate(`/terminal/notes/${newNote.id}`);
    };

    const handleEditorChange = (json: any, html: string, text: string) => {
        if (!selectedNote) return;
        updateNote(selectedNote.id, {
            contentJson: json,
            contentHtml: html,
            content: text,
            createVersion: true,
        });
    };

    // Filter root notes
    const rootNotes = notes.filter(n => !n.folderId && !n.isTrashed);

    return (
        <TerminalLayout>
            <div className="grid grid-cols-12 gap-0 border border-[#333] h-[calc(100vh-140px)] bg-black font-mono text-gray-300">

                {/* LEFT: DIRECTORY */}
                <div className="col-span-3 border-r border-[#333] flex flex-col">
                    <div className="bg-[#111] px-3 py-2 border-b border-[#333] flex justify-between items-center text-xs text-amber-500 font-bold uppercase">
                        <div>Directory Listing</div>
                        <div className="flex gap-2">
                            <button onClick={() => setCreateFolderOpen(true)} className="hover:text-white">[MKDIR]</button>
                            <button onClick={handleCreateNote} className="hover:text-white">[TOUCH]</button>
                        </div>
                    </div>

                    <div className="p-2 overflow-y-auto flex-1 scrollbar-none">
                        <div className="text-xs text-[#555] mb-2">./root</div>

                        {folderTree.map(folder => (
                            <TerminalFolderItem
                                key={folder.id}
                                folder={folder}
                                level={0}
                                selectedFolderId={undefined}
                                onSelectFolder={() => { }}
                                onSelectNote={(n) => navigate(`/terminal/notes/${n.id}`)}
                                selectedNoteId={noteId}
                                notes={notes}
                            />
                        ))}

                        {rootNotes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => navigate(`/terminal/notes/${note.id}`)}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1 cursor-pointer text-sm hover:bg-[#222]",
                                    noteId === note.id ? "text-green-400 bg-[#151515]" : "text-gray-500"
                                )}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="truncate">{note.title || 'untitled.txt'}</span>
                                {note.isPinned && <Star className="w-3 h-3 text-amber-500 ml-auto" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: BUFFER (EDITOR) */}
                <div className="col-span-9 flex flex-col relative bg-[#050505]">
                    {selectedNote ? (
                        <>
                            {/* Editor Header */}
                            <div className="bg-[#111] px-4 py-2 border-b border-[#333] flex justify-between items-center">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Terminal className="w-4 h-4 text-green-500" />
                                    <span className="text-green-500 text-sm">vi</span>
                                    <input
                                        value={selectedNote.title}
                                        onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                                        className="bg-transparent border-none outline-none text-sm text-gray-300 w-full font-mono placeholder-gray-700"
                                        placeholder="filename.txt"
                                    />
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    {selectedNote.isPinned ?
                                        <button onClick={() => togglePin(selectedNote.id)} className="text-amber-500">[UNPIN]</button> :
                                        <button onClick={() => togglePin(selectedNote.id)} className="text-gray-500 hover:text-white">[PIN]</button>
                                    }
                                    <button onClick={() => deleteNote(selectedNote.id)} className="text-red-900 hover:text-red-500">[RM]</button>
                                    <span className="text-gray-600">{formatDistanceToNow(new Date(selectedNote.updatedAt))} ago</span>
                                </div>
                            </div>

                            {/* Editor Body */}
                            <div className="flex-1 overflow-auto p-4 terminal-editor-wrapper relative">
                                <style>{`
                                    .terminal-editor-wrapper .ProseMirror {
                                        color: #ccc !important;
                                        font-family: 'JetBrains Mono', monospace !important;
                                        font-size: 13px !important;
                                        line-height: 1.5 !important;
                                    }
                                    .terminal-editor-wrapper .ProseMirror h1,
                                    .terminal-editor-wrapper .ProseMirror h2, 
                                    .terminal-editor-wrapper .ProseMirror h3 {
                                        color: #ffb000 !important;
                                        font-weight: bold;
                                        border-bottom: 1px dashed #333;
                                        padding-bottom: 0.5rem;
                                        margin-top: 1.5rem;
                                    }
                                    .terminal-editor-wrapper .ProseMirror blockquote {
                                        border-left: 2px solid #00ff88 !important;
                                        color: #888 !important;
                                        margin-left: 0;
                                        padding-left: 1rem;
                                    }
                                    .terminal-editor-wrapper .ProseMirror code {
                                        background: #222 !important;
                                        color: #00ff88 !important;
                                        padding: 0.2em 0.4em;
                                        border-radius: 0;
                                    }
                                    .terminal-editor-wrapper .ProseMirror pre {
                                        background: #111 !important;
                                        border: 1px solid #333 !important;
                                    }
                                `}</style>

                                <TiptapEditor
                                    content={selectedNote.contentJson || null}
                                    onChange={handleEditorChange}
                                    onEditorReady={() => { }} // Remove unused setter
                                    placeholder="-- INSERT MODE --"
                                />
                            </div>

                            {/* Status Line */}
                            <div className="bg-[#111] px-3 py-1 text-[10px] text-gray-500 flex justify-between uppercase border-t border-[#333]">
                                <span>{selectedNote.id.substring(0, 8)}...</span>
                                <span>UTF-8 | UNIX</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-700">
                            <div className="font-mono text-sm">[NO BUFFER SELECTED]</div>
                            <div className="text-xs mt-2">Select a file to edit or create new.</div>
                        </div>
                    )}
                </div>
            </div>

            <CreateFolderDialog
                open={createFolderOpen}
                onOpenChange={setCreateFolderOpen}
                parentId={null}
            />
        </TerminalLayout>
    );
}
