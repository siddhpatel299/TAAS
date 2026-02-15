import { useEffect, useState, useCallback } from 'react';
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

    // Sync selectedNote to local state when it changes
    useEffect(() => {
        if (selectedNote) {
            setTitle(selectedNote.title);
            setContent(selectedNote.content);
            setIsEditing(true);
        } else {
            setTitle('');
            setContent(null);
            setIsEditing(false);
        }
    }, [selectedNote?.id]); // Only re-sync when switching notes, not on every store update



    // Debounced save function
    const debouncedSave = useCallback(
        (id: string, data: { title?: string; contentJson?: any; contentHtml?: string; content?: string }) => {
            // Clear any existing timer
            if ((window as any).noteSaveTimer) {
                clearTimeout((window as any).noteSaveTimer);
            }

            // Set new timer
            (window as any).noteSaveTimer = setTimeout(() => {
                updateNote(id, data);
            }, 1000); // 1 second debounce
        },
        [updateNote]
    );

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (selectedNote) {
            debouncedSave(selectedNote.id, { title: newTitle });
        }
    };

    const handleEditorChange = (json: any, html: string, text: string) => {
        // Only save if we have actual content change and a selected note
        if (selectedNote) {
            // We'll trust Tiptap's onUpdate to be correct, but we could add deep comparison here if needed
            debouncedSave(selectedNote.id, {
                contentJson: json,
                contentHtml: html,
                content: text
            });
        }
    };

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
