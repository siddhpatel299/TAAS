import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Tag,
    FolderOpen,
    Hash,
    Settings,
    Plus,
} from 'lucide-react';
import { useNotesStore } from '@/stores/notes.store';
import { Note, NoteTag } from '@/lib/notes-api';
import { formatDistanceToNow, format } from 'date-fns';

// Color options for tags
const TAG_COLORS = [
    { name: 'Gray', color: '#6b7280' },
    { name: 'Red', color: '#ef4444' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Lime', color: '#84cc16' },
    { name: 'Green', color: '#22c55e' },
    { name: 'Teal', color: '#14b8a6' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Sky', color: '#0ea5e9' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Violet', color: '#8b5cf6' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Fuchsia', color: '#d946ef' },
    { name: 'Pink', color: '#ec4899' },
];

interface DocumentPropertiesPanelProps {
    note: Note;
    isOpen: boolean;
    onClose: () => void;
}

export function DocumentPropertiesPanel({ note, isOpen, onClose }: DocumentPropertiesPanelProps) {
    const { tags, updateNote, createTag } = useNotesStore();
    const [showAddTag, setShowAddTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6b7280');

    const noteTags = note.tags || [];
    const availableTags = tags.filter(t => !noteTags.find(nt => nt.id === t.id));

    const handleAddExistingTag = async (tag: NoteTag) => {
        const currentTagIds = noteTags.map(t => t.id);
        await updateNote(note.id, {
            tagIds: [...currentTagIds, tag.id],
        });
    };

    const handleRemoveTag = async (tagId: string) => {
        const currentTagIds = noteTags.map(t => t.id);
        await updateNote(note.id, {
            tagIds: currentTagIds.filter(id => id !== tagId),
        });
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        try {
            const newTag = await createTag({
                name: newTagName.trim(),
                color: newTagColor,
            });
            // Add the new tag to the note
            const currentTagIds = noteTags.map(t => t.id);
            await updateNote(note.id, {
                tagIds: [...currentTagIds, newTag.id],
            });
            setNewTagName('');
            setShowAddTag(false);
        } catch (error) {
            console.error('Failed to create tag:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-80 h-full border-l border-gray-200 bg-white flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Properties</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* Tags Section */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Tag className="w-4 h-4" />
                            Tags
                        </label>
                        <button
                            onClick={() => setShowAddTag(!showAddTag)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Current Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {noteTags.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No tags added</p>
                        ) : (
                            noteTags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                                        color: tag.color || '#6b7280',
                                    }}
                                >
                                    {tag.name}
                                    <button
                                        onClick={() => handleRemoveTag(tag.id)}
                                        className="ml-0.5 hover:text-red-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))
                        )}
                    </div>

                    {/* Add Tag Form */}
                    {showAddTag && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                            {/* Available Tags */}
                            {availableTags.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Add existing tag:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {availableTags.slice(0, 8).map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleAddExistingTag(tag)}
                                                className="px-2 py-0.5 text-xs rounded-full hover:ring-2"
                                                style={{
                                                    backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                                                    color: tag.color || '#6b7280',
                                                }}
                                            >
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Create New Tag */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Or create new:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        placeholder="Tag name..."
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                    <select
                                        value={newTagColor}
                                        onChange={(e) => setNewTagColor(e.target.value)}
                                        className="w-10 h-8 p-0 border border-gray-200 rounded-lg cursor-pointer"
                                        style={{ backgroundColor: newTagColor }}
                                    >
                                        {TAG_COLORS.map((c) => (
                                            <option key={c.name} value={c.color}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleCreateTag}
                                    disabled={!newTagName.trim()}
                                    className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                >
                                    Create Tag
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Folder Section */}
                <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                        <FolderOpen className="w-4 h-4" />
                        Folder
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                        {note.folder ? (
                            <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" style={{ color: note.folder.color || undefined }} />
                                <span>{note.folder.name}</span>
                            </div>
                        ) : (
                            <span className="text-gray-400 italic">No folder</span>
                        )}
                    </div>
                </div>

                {/* Metadata Section */}
                <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                        <Hash className="w-4 h-4" />
                        Details
                    </label>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-gray-100">
                            <span className="text-gray-500">Word Count</span>
                            <span className="font-medium">{note.wordCount || 0}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-gray-100">
                            <span className="text-gray-500">Reading Time</span>
                            <span className="font-medium">{note.readingTime || 0} min</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-gray-100">
                            <span className="text-gray-500">Created</span>
                            <span className="font-medium text-xs">
                                {format(new Date(note.createdAt), 'MMM d, yyyy')}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                            <span className="text-gray-500">Last Edited</span>
                            <span className="font-medium text-xs">
                                {formatDistanceToNow(new Date(note.lastEditedAt || note.updatedAt), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Badges */}
                <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                        Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {note.isPinned && (
                            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg">
                                📌 Pinned
                            </span>
                        )}
                        {note.isFavorite && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-lg">
                                ⭐ Favorite
                            </span>
                        )}
                        {note.isArchived && (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
                                📦 Archived
                            </span>
                        )}
                        {note.isTrashed && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-lg">
                                🗑️ Trashed
                            </span>
                        )}
                        {!note.isPinned && !note.isFavorite && !note.isArchived && !note.isTrashed && (
                            <span className="text-xs text-gray-400 italic">Active</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
