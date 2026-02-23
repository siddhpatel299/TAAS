import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useNotesStore } from '@/stores/notes.store';
import { NoteSidebar } from '@/components/notes/NoteSidebar';
import { NoteListPanel } from '@/components/notes/NoteListPanel';
import { TiptapEditor } from '@/components/notes/TiptapEditor';

export function UnifiedNotesPage() {
    const { noteId } = useParams();
    const {
        fetchNotes,
        fetchFolderTree,
        fetchTags,
        fetchNote,
        selectedNote,
        updateNote
    } = useNotesStore();

    useEffect(() => {
        fetchNotes();
        fetchFolderTree();
        fetchTags();
    }, []);

    useEffect(() => {
        if (noteId) {
            fetchNote(noteId);
        }
    }, [noteId]);

    // Local state for immediate typing feedback
    const [title, setTitle] = useState('');
    const [content, setContent] = useState<any>(null);
    const [, setIsEditing] = useState(false);

    // === CRITICAL: Use a ref for the current note ID ===
    // This prevents stale closures from saving content to the wrong note.
    // When switchin notes, React updates selectedNote before the old editor
    // finishes its final onUpdate, causing the old content to save to the new note's ID.
    const currentNoteIdRef = useRef<string | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitializingRef = useRef(false);

    // Cancel any pending save — called before switching notes
    const cancelPendingSave = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        // Also clear any legacy timers
        if ((window as any).noteSaveTimer) {
            clearTimeout((window as any).noteSaveTimer);
            (window as any).noteSaveTimer = null;
        }
    }, []);

    // Sync selectedNote to local state when it changes
    useEffect(() => {
        // FIRST: cancel any pending save from the PREVIOUS note
        cancelPendingSave();

        if (selectedNote) {
            // Mark as initializing so we skip the onUpdate triggered by setContent
            isInitializingRef.current = true;

            // Update the ref BEFORE setting content
            currentNoteIdRef.current = selectedNote.id;

            setTitle(selectedNote.title);
            // Use contentJson (Tiptap JSON) to preserve formatting.
            // Fall back to contentHtml, then plain text content.
            const editorContent = selectedNote.contentJson
                || selectedNote.contentHtml
                || selectedNote.content
                || null;
            setContent(editorContent);
            setIsEditing(true);

            // Allow onUpdate after a brief delay (after editor initializes)
            setTimeout(() => {
                isInitializingRef.current = false;
            }, 100);
        } else {
            currentNoteIdRef.current = null;
            setTitle('');
            setContent(null);
            setIsEditing(false);
        }
    }, [selectedNote?.id, cancelPendingSave]); // Only re-sync when switching notes

    // Debounced save function — uses the noteId passed in, NOT selectedNote from closure
    const debouncedSave = useCallback(
        (noteId: string, data: { title?: string; contentJson?: any; contentHtml?: string; content?: string }) => {
            // Clear any existing timer
            cancelPendingSave();

            // Set new timer
            saveTimerRef.current = setTimeout(() => {
                // Double-check: only save if we're still on the same note
                if (currentNoteIdRef.current === noteId) {
                    updateNote(noteId, data);
                }
            }, 1000); // 1 second debounce
        },
        [updateNote, cancelPendingSave]
    );

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        const noteId = currentNoteIdRef.current;
        if (noteId) {
            debouncedSave(noteId, { title: newTitle });
        }
    };

    const handleEditorChange = useCallback((json: any, html: string, text: string) => {
        // Skip saves during editor initialization (setContent triggers onUpdate)
        if (isInitializingRef.current) {
            return;
        }

        // Use the ref for the current note ID — never stale
        const noteId = currentNoteIdRef.current;
        if (noteId) {
            debouncedSave(noteId, {
                contentJson: json,
                contentHtml: html,
                content: text
            });
        }
    }, [debouncedSave]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelPendingSave();
        };
    }, [cancelPendingSave]);

    return (
        <div className="h-screen bg-[#F8FAFC] flex overflow-hidden">
            {/* App Sidebar (Global) */}
            <ModernSidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-20 flex h-full">
                {/* Pane 1: Library/Folders */}
                <NoteSidebar />

                {/* Pane 2: Note List */}
                <NoteListPanel />

                {/* Pane 3: Editor */}
                <div className="flex-1 bg-white flex flex-col h-full overflow-hidden relative">
                    {selectedNote ? (
                        <div className="h-full flex flex-col">
                            {/* Editor Toolbar Area */}
                            <div className="px-8 pt-8 pb-4">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={handleTitleChange}
                                    placeholder="Untitled Note"
                                    className="w-full text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 focus:outline-none bg-transparent p-0"
                                />
                                <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                                    <span>{new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{selectedNote.folder?.name || 'No Folder'}</span>
                                </div>
                            </div>

                            {/* Editor Content */}
                            <div className="flex-1 overflow-y-auto px-8 pb-12">
                                <TiptapEditor
                                    key={selectedNote.id}
                                    content={content}
                                    onChange={handleEditorChange}
                                    placeholder="Start writing..."
                                    editable={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border-4 border-slate-100">
                                <span className="text-4xl">✨</span>
                            </div>
                            <p className="text-lg font-medium text-slate-600">Select a note to start writing</p>
                            <p className="text-sm text-slate-400 mt-2">or create a new one from the sidebar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
