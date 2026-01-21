import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { useNotesStore } from '@/stores/notes.store';
import { NoteFolder } from '@/lib/notes-api';
import { cn } from '@/lib/utils';

interface MoveToFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    noteIds: string[];
}

export function MoveToFolderDialog({ isOpen, onClose, noteIds }: MoveToFolderDialogProps) {
    const { folderTree, moveNotesToFolder, isLoading } = useNotesStore();
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const handleMove = async () => {
        if (!selectedFolderId && selectedFolderId !== null) return;
        try {
            await moveNotesToFolder(noteIds, selectedFolderId);
            onClose();
        } catch (error) {
            console.error('Failed to move notes', error);
        }
    };

    const renderFolder = (folder: NoteFolder, level = 0) => {
        const hasChildren = folder.children && folder.children.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolderId === folder.id;

        return (
            <div key={folder.id}>
                <div
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-sm rounded-lg mx-2",
                        isSelected ? "bg-sky-100 text-sky-700" : "hover:bg-gray-50 text-gray-700"
                    )}
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                    onClick={() => setSelectedFolderId(folder.id)}
                >
                    <button
                        className={cn("p-0.5 rounded hover:bg-black/5", !hasChildren && "invisible")}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(folder.id);
                        }}
                    >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {folder.icon ? <span>{folder.icon}</span> : <FolderOpen className={cn("w-4 h-4", isSelected ? "text-sky-500" : "text-gray-400")} />}
                    <span className="flex-1 truncate">{folder.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                </div>
                {hasChildren && isExpanded && (
                    <div className="border-l border-gray-100 ml-5 my-0.5">
                        {folder.children!.map((child) => renderFolder(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[9999]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm"
                    >
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">Move to Folder</h3>
                                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                                {/* Root Option */}
                                <div
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-sm rounded-lg mx-2 mb-1",
                                        selectedFolderId === null ? "bg-sky-50 text-sky-700" : "hover:bg-gray-50 text-gray-700"
                                    )}
                                    onClick={() => setSelectedFolderId(null)}
                                >
                                    <span className="w-4" />
                                    <FolderOpen className="w-4 h-4 text-gray-400" />
                                    <span>All Notes (No Folder)</span>
                                    {selectedFolderId === null && <Check className="w-4 h-4 text-sky-600 ml-auto" />}
                                </div>
                                <div className="h-px bg-gray-100 mx-4 my-2" />
                                {folderTree.map((folder) => renderFolder(folder))}
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={handleMove}
                                    disabled={isLoading}
                                    className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Moving...' : 'Move Here'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
