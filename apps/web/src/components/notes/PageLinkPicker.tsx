import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Clock, X, Link2 } from 'lucide-react';
import { useNotesStore } from '@/stores/notes.store';
import { Note } from '@/lib/notes-api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface PageLinkPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (note: Note) => void;
    excludeNoteId?: string; // Exclude current note from results
}

export function PageLinkPicker({ isOpen, onClose, onSelect, excludeNoteId }: PageLinkPickerProps) {
    const { notes, fetchNotes } = useNotesStore();
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter notes based on search and exclude current note
    const filteredNotes = notes.filter(note => {
        if (note.id === excludeNoteId) return false;
        if (note.isTrashed) return false;
        if (!search) return true;
        return note.title.toLowerCase().includes(search.toLowerCase());
    }).slice(0, 10); // Limit to 10 results

    // Load notes when picker opens
    useEffect(() => {
        if (isOpen) {
            fetchNotes();
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, fetchNotes]);

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredNotes.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && filteredNotes[selectedIndex]) {
                e.preventDefault();
                onSelect(filteredNotes[selectedIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredNotes, selectedIndex, onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <Link2 className="w-5 h-5 text-sky-500" />
                        <span className="text-sm font-medium text-gray-700">Link to page</span>
                        <button
                            onClick={onClose}
                            className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search notes..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-72 overflow-y-auto">
                        {filteredNotes.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">
                                    {search ? 'No notes found' : 'No notes available'}
                                </p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {filteredNotes.map((note, index) => (
                                    <button
                                        key={note.id}
                                        onClick={() => onSelect(note)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                                            index === selectedIndex ? 'bg-sky-50 text-sky-700' : 'hover:bg-gray-50'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
                                            index === selectedIndex ? 'bg-sky-100' : 'bg-gray-100'
                                        )}>
                                            {note.icon || <FileText className="w-4 h-4 text-gray-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {note.title || 'Untitled'}
                                            </p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(note.lastEditedAt || note.updatedAt), { addSuffix: true })}
                                                {note.folder && (
                                                    <span className="ml-2 text-gray-300">
                                                        in {note.folder.name}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-xs text-gray-400 text-center">
                            Press ↵ to select • ↑↓ to navigate • Esc to cancel
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
