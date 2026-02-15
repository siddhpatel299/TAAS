import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Hash,
    Star,
    Clock,
    Trash2,
    Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NoteFolder } from '@/lib/notes-api';
import { useNotesStore } from '@/stores/notes.store';

interface FolderTreeItemProps {
    folder: NoteFolder;
    level: number;
    selectedFolderId?: string | null;
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
                    'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors group relative',
                    selectedFolderId === folder.id
                        ? 'bg-purple-100/50 text-purple-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
                )}
                style={{ paddingLeft: `${12 + level * 12}px` }}
            >
                {hasChildren ? (
                    <div
                        role="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        className="p-0.5 hover:bg-slate-200/50 rounded transition-colors"
                    >
                        {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                    </div>
                ) : (
                    <span className="w-4.5" />
                )}

                <FolderOpen
                    className={cn(
                        "w-4 h-4 transition-colors",
                        isSelected ? "text-purple-600" : "text-slate-400 group-hover:text-slate-500"
                    )}
                />

                <span className="flex-1 truncate text-left">{folder.name}</span>

                {folder._count?.notes !== undefined && folder._count.notes > 0 && (
                    <span className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
                        {folder._count.notes}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
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

export function NoteSidebar() {
    const {
        folderTree,
        tags,
        filters,
        setFilters,
        createFolder,
    } = useNotesStore();

    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            await createFolder({ name: newFolderName });
            setNewFolderName('');
            setIsCreatingFolder(false);
        } catch (error) {
            console.error('Failed to create folder:', error);
        }
    };

    const navItems = [
        { id: 'all', label: 'All Notes', icon: FolderOpen, view: 'all' },
        { id: 'recent', label: 'Recent', icon: Clock, view: 'recent' }, // Requires update to store view types if not present
        { id: 'favorites', label: 'Favorites', icon: Star, view: 'favorites' },
        { id: 'trash', label: 'Trash', icon: Trash2, view: 'trash' },
    ];

    return (
        <div className="w-64 h-full flex flex-col bg-slate-50/50 backdrop-blur-xl border-r border-slate-200/60">
            {/* Header */}
            <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 tracking-tight">Library</span>
                <button
                    onClick={() => setIsCreatingFolder(true)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-2 space-y-6">
                {/* Quick Links */}
                <div className="space-y-0.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setFilters({ view: item.view as any, folderId: null, tagIds: [] })}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                                filters.view === item.view
                                    ? "bg-white shadow-sm text-purple-700 ring-1 ring-slate-200"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn(
                                "w-4 h-4",
                                filters.view === item.view ? "text-purple-600" : "text-slate-400"
                            )} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Folders */}
                <div>
                    <div className="px-3 mb-2 flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Folders
                    </div>

                    {isCreatingFolder && (
                        <form onSubmit={handleCreateFolder} className="px-2 mb-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Folder name..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                                className="w-full px-3 py-1.5 text-sm bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        </form>
                    )}

                    <div className="space-y-0.5">
                        {folderTree.map((folder) => (
                            <FolderTreeItem
                                key={folder.id}
                                folder={folder}
                                level={0}
                                selectedFolderId={filters.folderId}
                                onSelect={(id) => setFilters({ folderId: id, view: 'all' })}
                            />
                        ))}
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <div className="px-3 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tags
                    </div>
                    <div className="space-y-0.5">
                        {tags.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => {
                                    const currentTags = filters.tagIds || [];
                                    const isSelected = currentTags.includes(tag.id);
                                    setFilters({
                                        tagIds: isSelected
                                            ? currentTags.filter(id => id !== tag.id)
                                            : [...currentTags, tag.id]
                                    });
                                }}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors group",
                                    filters.tagIds?.includes(tag.id)
                                        ? "bg-slate-100 text-slate-900 font-medium"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <Hash className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-500" />
                                <span className="flex-1 text-left truncate">{tag.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
