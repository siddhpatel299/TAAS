import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText,
    Plus,
    ChevronRight,
    ChevronDown,
    Trash2,
    Folder,
    PenTool,
    Copy,
    Pin
} from 'lucide-react';
import { BlueprintLayout } from '@/layouts/BlueprintLayout';
import { useNotesStore } from '@/stores/notes.store';
import { NoteFolder, Note } from '@/lib/notes-api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { TiptapEditor } from '@/components/notes/TiptapEditor';
import { CreateFolderDialog } from '@/components/notes/CreateFolderDialog';

// ====================
// BLUEPRINT FOLDER ITEM
// ====================

interface BlueprintFolderItemProps {
    folder: NoteFolder;
    level: number;
    selectedFolderId?: string;
    onSelectFolder: (folderId: string) => void;
    onSelectNote: (note: Note) => void;
    selectedNoteId?: string;
    notes?: Note[];
}

function BlueprintFolderItem({ folder, level, selectedFolderId, onSelectFolder, onSelectNote, selectedNoteId, notes = [] }: BlueprintFolderItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;
    const folderNotes = notes.filter(n => n.folderId === folder.id && !n.isTrashed);
    const hasContent = hasChildren || folderNotes.length > 0;

    return (
        <div className="relative">
            {/* Connecting line for hierarchy */}
            {level > 0 && (
                <div
                    className="absolute border-l border-dashed border-[#0096c7]/30 h-full"
                    style={{ left: `${level * 16 + 4}px`, top: 0 }}
                />
            )}

            <div
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs uppercase tracking-wider transition-colors border-l-2",
                    isSelected
                        ? "border-[#00b4d8] bg-[#0096c7]/10 text-[#00b4d8]"
                        : "border-transparent text-[#e0f7fa]/70 hover:text-[#e0f7fa] hover:bg-[#0096c7]/5"
                )}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
                onClick={() => onSelectFolder(folder.id)}
            >
                {hasContent ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className="hover:text-[#00b4d8]"
                    >
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                ) : (
                    <span className="w-3" />
                )}
                <Folder className={cn("w-3.5 h-3.5", isSelected ? "text-[#00b4d8]" : "text-[#0096c7]")} />
                <span className="font-semibold">{folder.name}</span>
                {folder._count?.notes !== undefined && folder._count.notes > 0 && (
                    <span className="ml-auto text-[9px] border border-[#0096c7]/30 px-1 rounded text-[#0096c7]">
                        {folder._count.notes}
                    </span>
                )}
            </div>

            {isOpen && hasContent && (
                <div>
                    {folder.children?.map(child => (
                        <BlueprintFolderItem
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
                                "flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs tracking-wide transition-colors border-l-2 ml-1",
                                selectedNoteId === note.id
                                    ? "border-[#00b4d8] bg-[#0096c7]/10 text-[#00b4d8] font-bold"
                                    : "border-transparent text-[#e0f7fa]/60 hover:text-[#e0f7fa] hover:bg-[#0096c7]/5"
                            )}
                            style={{ paddingLeft: `${(level + 1) * 20 + 24}px` }}
                        >
                            <FileText className="w-3 h-3 opacity-70" />
                            <span className="truncate">{note.title || 'UNTITLED'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ====================
// BLUEPRINT NOTE CARD
// ====================

interface BlueprintNoteCardProps {
    note: Note;
    isSelected: boolean;
    onSelect: () => void;
    onPin: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

function BlueprintNoteCard({ note, isSelected, onSelect, onPin, onDelete, onDuplicate }: BlueprintNoteCardProps) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative p-3 border mb-2 cursor-pointer group transition-all",
                isSelected
                    ? "bg-[#0d2137] border-[#00b4d8] shadow-[0_0_10px_rgba(0,180,216,0.1)]"
                    : "bg-[#0a1929] border-[#0096c7]/30 hover:border-[#0096c7]/60"
            )}
        >
            {/* Technical corners */}
            {isSelected && (
                <>
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-[#00b4d8]" />
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-[#00b4d8]" />
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-[#00b4d8]" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-[#00b4d8]" />
                </>
            )}

            <div className="flex justify-between items-start mb-1">
                <h4 className={cn(
                    "font-mono text-xs font-bold uppercase truncate pr-4 flex-1",
                    isSelected ? "text-[#00b4d8]" : "text-[#e0f7fa]"
                )}>
                    {note.title || 'UNTITLED_DOC'}
                </h4>
                {note.isPinned && <Pin className="w-3 h-3 text-[#ff9f1c]" />}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#e0f7fa]/40 font-mono mt-2">
                <span>ID: {note.id.substring(0, 6)}</span>
                <span>{formatDistanceToNow(new Date(note.updatedAt))}</span>
            </div>

            {/* Hover Actions */}
            <div className="absolute right-2 top-2 hidden group-hover:flex gap-1 bg-[#0a1929] border border-[#0096c7]/30 p-1 z-10">
                <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="text-[#0096c7] hover:text-[#00b4d8]"><Pin className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="text-[#0096c7] hover:text-[#00b4d8]"><Copy className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-[#ef476f] hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
        </div>
    );
}

// ====================
// BLUEPRINT PAGE
// ====================

export function BlueprintNotesPage() {
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
        duplicateNote,
    } = useNotesStore();

    const [createFolderOpen, setCreateFolderOpen] = useState(false);

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
        const newNote = await createNote({ title: 'New Schematic', content: '' });
        navigate(`/blueprint/notes/${newNote.id}`);
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
        <BlueprintLayout>
            <div className="flex h-[calc(100vh-120px)] border border-[#0096c7]/30 bg-[#0a1929] shadow-lg">

                {/* SIDEBAR: EXPLORER */}
                <div className="w-64 border-r border-[#0096c7]/30 flex flex-col bg-[#0d2137]/50">
                    <div className="p-3 border-b border-[#0096c7]/30 flex justify-between items-center bg-[#0d2137]">
                        <span className="text-xs font-bold text-[#00b4d8] tracking-widest uppercase">Explorer</span>
                        <div className="flex gap-2 text-[#0096c7]">
                            <button onClick={() => setCreateFolderOpen(true)} className="hover:text-[#00b4d8]"><FolderPlusIcon className="w-4 h-4" /></button>
                            <button onClick={handleCreateNote} className="hover:text-[#00b4d8]"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                        {folderTree.map(folder => (
                            <BlueprintFolderItem
                                key={folder.id}
                                folder={folder}
                                level={0}
                                selectedFolderId={undefined}
                                onSelectFolder={() => { }}
                                onSelectNote={(n) => navigate(`/blueprint/notes/${n.id}`)}
                                selectedNoteId={noteId}
                                notes={notes}
                            />
                        ))}
                    </div>

                    {/* Root notes list (mini) */}
                    <div className="p-2 border-t border-[#0096c7]/30 bg-[#0a1929]">
                        <div className="text-[10px] text-[#0096c7] uppercase tracking-wider mb-2 font-bold">Unsorted Docs</div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {rootNotes.map(note => (
                                <BlueprintNoteCard
                                    key={note.id}
                                    note={note}
                                    isSelected={note.id === noteId}
                                    onSelect={() => navigate(`/blueprint/notes/${note.id}`)}
                                    onPin={() => togglePin(note.id)}
                                    onDelete={() => deleteNote(note.id)}
                                    onDuplicate={() => duplicateNote(note.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER/RIGHT: EDITOR or PLACEHOLDER */}
                <div className="flex-1 flex flex-col relative bg-grid-pattern">
                    {selectedNote ? (
                        <>
                            {/* Toolbar */}
                            <div className="h-12 border-b border-[#0096c7]/30 flex items-center justify-between px-4 bg-[#0d2137]">
                                <div className="flex items-center gap-3 flex-1">
                                    <PenTool className="w-4 h-4 text-[#00b4d8]" />
                                    <input
                                        value={selectedNote.title}
                                        onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                                        className="bg-transparent border-none outline-none text-sm font-bold text-[#e0f7fa] w-full font-mono uppercase tracking-wide placeholder-[#0096c7]/50"
                                        placeholder="UNTITLED SCHEMATIC"
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono text-[#0096c7]">
                                    <span>VER: {1}</span>
                                    <span>STATUS: ACTIVE</span>
                                </div>
                            </div>

                            {/* Editor */}
                            <div className="flex-1 overflow-auto p-8 blueprint-editor-wrapper">
                                <style>{`
                                    .bg-grid-pattern {
                                        background-image: 
                                            linear-gradient(rgba(0, 150, 199, 0.05) 1px, transparent 1px),
                                            linear-gradient(90deg, rgba(0, 150, 199, 0.05) 1px, transparent 1px);
                                        background-size: 20px 20px;
                                    }
                                    .blueprint-editor-wrapper .ProseMirror {
                                        color: #e0f7fa !important;
                                        font-family: 'JetBrains Mono', monospace !important;
                                        line-height: 1.6 !important;
                                        min-height: 500px;
                                    }
                                    .blueprint-editor-wrapper .ProseMirror h1,
                                    .blueprint-editor-wrapper .ProseMirror h2, 
                                    .blueprint-editor-wrapper .ProseMirror h3 {
                                        color: #00b4d8 !important;
                                        text-transform: uppercase;
                                        letter-spacing: 0.1em;
                                        border-left: 3px solid #00b4d8;
                                        padding-left: 1rem;
                                    }
                                    .blueprint-editor-wrapper .ProseMirror blockquote {
                                        border: 1px dashed #0096c7;
                                        background: rgba(0, 150, 199, 0.05);
                                        color: #00b4d8;
                                        padding: 1rem;
                                    }
                                `}</style>

                                <div className="max-w-4xl mx-auto bg-[#0d2137]/30 border border-[#0096c7]/10 min-h-full p-8 shadow-inner">
                                    <TiptapEditor
                                        content={selectedNote.contentJson || null}
                                        onChange={handleEditorChange}
                                        onEditorReady={() => { }}
                                        placeholder="Initialize schematic data..."
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#0096c7]/50">
                            <div className="w-16 h-16 border-2 border-dashed border-[#0096c7]/30 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div className="font-mono text-sm uppercase tracking-widest">No Schematic Selected</div>
                        </div>
                    )}
                </div>

            </div>

            <CreateFolderDialog
                isOpen={createFolderOpen}
                onClose={() => setCreateFolderOpen(false)}
                parentId={undefined}
            />
        </BlueprintLayout>
    );
}

function FolderPlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 10v6" />
            <path d="M9 13h6" />
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
    )
}
