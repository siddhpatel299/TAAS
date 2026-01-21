import { ChevronRight, Home, FolderOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NoteFolder, Note } from '@/lib/notes-api';

// ====================
// TYPES
// ====================

export interface BreadcrumbItem {
    type: 'home' | 'folder' | 'note';
    id?: string;
    label: string;
    icon?: string | React.ReactNode;
}

interface NoteBreadcrumbsProps {
    selectedNote?: Note | null;
    selectedFolderId?: string | null;
    folderTree: NoteFolder[];
    currentView?: string;
    onNavigateHome: () => void;
    onNavigateFolder: (folderId: string) => void;
    onNavigateNote?: (noteId: string) => void;
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Build folder path by walking up parent chain
 */
function buildFolderPath(folderId: string, folderTree: NoteFolder[]): NoteFolder[] {
    const path: NoteFolder[] = [];

    // Flatten folder tree for lookup
    const folderMap = new Map<string, NoteFolder>();
    const flattenFolders = (folders: NoteFolder[], parent?: NoteFolder) => {
        for (const folder of folders) {
            folderMap.set(folder.id, { ...folder, parentId: parent?.id });
            if (folder.children) {
                flattenFolders(folder.children, folder);
            }
        }
    };
    flattenFolders(folderTree);

    // Walk up the tree
    let currentId: string | undefined = folderId;
    while (currentId) {
        const folder = folderMap.get(currentId);
        if (folder) {
            path.unshift(folder);
            currentId = folder.parentId;
        } else {
            break;
        }
    }

    return path;
}

/**
 * Build note path by walking up parent note chain
 */
function buildNotePath(note: Note): { id: string; title: string; icon?: string }[] {
    const path: { id: string; title: string; icon?: string }[] = [];

    // Add parent note if exists
    if (note.parentNote) {
        path.push({
            id: note.parentNote.id,
            title: note.parentNote.title || 'Untitled',
            icon: note.parentNote.icon,
        });
    }

    // Add current note
    path.push({
        id: note.id,
        title: note.title || 'Untitled',
        icon: note.icon,
    });

    return path;
}

// ====================
// COMPONENT
// ====================

export function NoteBreadcrumbs({
    selectedNote,
    selectedFolderId,
    folderTree,
    // currentView - reserved for future enhancements
    onNavigateHome,
    onNavigateFolder,
    onNavigateNote,
}: NoteBreadcrumbsProps) {
    // Build full path
    const items: BreadcrumbItem[] = [];

    // 1. Home is always first
    items.push({
        type: 'home',
        label: 'All Notes',
        icon: <Home className="w-3 h-3" />,
    });

    // 2. Add folder path if a folder is selected or note is in a folder
    const activeFolderId = selectedNote?.folderId || selectedFolderId;
    if (activeFolderId) {
        const folderPath = buildFolderPath(activeFolderId, folderTree);
        for (const folder of folderPath) {
            items.push({
                type: 'folder',
                id: folder.id,
                label: folder.name,
                icon: folder.icon || <FolderOpen className="w-3 h-3" />,
            });
        }
    }

    // 3. Add note path if a note is selected
    if (selectedNote) {
        const notePath = buildNotePath(selectedNote);
        for (const note of notePath) {
            items.push({
                type: 'note',
                id: note.id,
                label: note.title,
                icon: note.icon || <FileText className="w-3 h-3" />,
            });
        }
    }

    // Handle click
    const handleClick = (item: BreadcrumbItem) => {
        if (item.type === 'home') {
            onNavigateHome();
        } else if (item.type === 'folder' && item.id) {
            onNavigateFolder(item.id);
        } else if (item.type === 'note' && item.id && onNavigateNote) {
            onNavigateNote(item.id);
        }
    };

    return (
        <nav className="flex items-center gap-0.5 text-xs overflow-x-auto scrollbar-hide">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isClickable = !isLast || items.length === 1;

                return (
                    <div key={`${item.type}-${item.id || index}`} className="flex items-center gap-0.5 flex-shrink-0">
                        {index > 0 && (
                            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        )}
                        <button
                            onClick={() => isClickable && handleClick(item)}
                            disabled={!isClickable}
                            className={cn(
                                'flex items-center gap-1 px-1.5 py-0.5 rounded transition-all',
                                'max-w-[100px]',
                                isLast
                                    ? 'bg-gray-100 text-gray-900 font-medium cursor-default'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer',
                            )}
                        >
                            {/* Icon */}
                            <span className="flex-shrink-0 text-gray-400">
                                {typeof item.icon === 'string' ? (
                                    <span className="text-xs">{item.icon}</span>
                                ) : (
                                    item.icon
                                )}
                            </span>

                            {/* Label */}
                            <span className="truncate">{item.label}</span>
                        </button>
                    </div>
                );
            })}
        </nav>
    );
}
