import { motion } from 'framer-motion';
import { Search, Pin, Star, FileText, Clock, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotesStore } from '@/stores/notes.store';
import { formatDistanceToNow } from 'date-fns';

export function NoteListPanel() {
    const {
        notes,
        selectedNote,
        setSelectedNote,
        createNote,
        deleteNote,
        togglePin,
        toggleFavorite,
        filters,
        setFilters,
        isLoading
    } = useNotesStore();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ search: e.target.value });
    };

    const handleCreateNote = async () => {
        try {
            await createNote({
                title: 'Untitled Note',
                content: '',
                folderId: filters.folderId || undefined
            });
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    };

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No notes found</h3>
            <p className="text-sm text-slate-500 max-w-[200px]">
                {filters.search
                    ? `No results for "${filters.search}"`
                    : "Create a new note to get started"}
            </p>
            {!filters.search && (
                <button
                    onClick={handleCreateNote}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Note
                </button>
            )}
        </div>
    );

    return (
        <div className="w-80 h-full flex flex-col bg-white border-r border-slate-200/60">
            {/* Search Header */}
            <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
                    <button
                        onClick={handleCreateNote}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        title="Create New Note"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={filters.search || ''}
                        onChange={handleSearch}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Note List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && notes.length === 0 ? (
                    <div className="p-4 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : notes.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="p-3 space-y-2">
                        {/* Mobile/Compact Create Button (optional, sticking to header button for now) */}

                        {notes.map((note) => (
                            <motion.button
                                key={note.id}
                                layoutId={`note-${note.id}`}
                                onClick={() => setSelectedNote(note)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl transition-all duration-200 border group",
                                    selectedNote?.id === note.id
                                        ? "bg-white border-purple-200 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/20 z-10"
                                        : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className={cn(
                                        "font-semibold text-sm line-clamp-1",
                                        selectedNote?.id === note.id ? "text-purple-700" : "text-slate-900"
                                    )}>
                                        {note.title || 'Untitled Note'}
                                    </h3>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePin(note.id);
                                            }}
                                            className={cn(
                                                "p-1 rounded hover:bg-slate-100 transition-colors",
                                                note.isPinned ? "text-amber-500" : "text-slate-400 hover:text-amber-500"
                                            )}
                                            title={note.isPinned ? "Unpin" : "Pin"}
                                        >
                                            <Pin className={cn("w-3.5 h-3.5", note.isPinned && "fill-current")} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(note.id);
                                            }}
                                            className={cn(
                                                "p-1 rounded hover:bg-slate-100 transition-colors",
                                                note.isFavorite ? "text-yellow-400" : "text-slate-400 hover:text-yellow-400"
                                            )}
                                            title={note.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                        >
                                            <Star className={cn("w-3.5 h-3.5", note.isFavorite && "fill-current")} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this note?')) {
                                                    deleteNote(note.id);
                                                }
                                            }}
                                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                                    {note.content || 'No additional text'}
                                </p>

                                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                                    </span>
                                    {note.tags && note.tags.length > 0 && (
                                        <div className="flex gap-1">
                                            {note.tags.slice(0, 2).map(tag => (
                                                <span
                                                    key={tag.id}
                                                    className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500"
                                                >
                                                    #{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
