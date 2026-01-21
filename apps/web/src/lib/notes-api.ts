import { api } from './api';

// ====================
// TYPES
// ====================

export interface NoteTag {
    id: string;
    userId: string;
    name: string;
    color?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        notes: number;
    };
}

export interface NoteFolder {
    id: string;
    userId: string;
    parentId?: string;
    name: string;
    icon?: string;
    color?: string;
    position: number;
    createdAt: string;
    updatedAt: string;
    children?: NoteFolder[];
    _count?: {
        notes: number;
        children: number;
    };
}

export interface NoteVersion {
    id: string;
    noteId: string;
    title: string;
    content?: string;
    contentJson?: any;
    contentHtml?: string;
    version: number;
    createdAt: string;
}

export interface NoteShare {
    id: string;
    userId: string;
    noteId: string;
    token: string;
    password?: string;
    expiresAt?: string;
    canEdit: boolean;
    allowEdit: boolean;
    isPublic: boolean;
    viewCount: number;
    isActive: boolean;
    createdAt: string;
}

export interface Note {
    id: string;
    userId: string;
    folderId?: string;
    parentNoteId?: string; // For nested pages
    title: string;
    content?: string;
    contentJson?: any;
    contentHtml?: string;
    icon?: string;
    coverImage?: string;
    color?: string;
    metadata?: {
        status?: string;
        priority?: string;
        dueDate?: string;
        [key: string]: any;
    };
    isPinned: boolean;
    isFavorite: boolean;
    isArchived: boolean;
    isTrashed: boolean;
    trashedAt?: string;
    wordCount: number;
    readingTime: number;
    lastEditedAt?: string;
    createdAt: string;
    updatedAt: string;
    folder?: {
        id: string;
        name: string;
        icon?: string;
        color?: string;
    };
    parentNote?: {
        id: string;
        title: string;
        icon?: string;
    };
    tags?: NoteTag[];
    versions?: NoteVersion[];
    shares?: NoteShare[];
    _count?: {
        versions: number;
        shares: number;
        childNotes: number;
    };
}

export interface NotesDashboard {
    totalNotes: number;
    pinnedCount: number;
    favoriteCount: number;
    archivedCount: number;
    trashedCount: number;
    folderCount: number;
    tagCount: number;
    recentNotes: Pick<Note, 'id' | 'title' | 'icon' | 'color' | 'lastEditedAt' | 'updatedAt' | 'folder'>[];
}

export interface GetNotesParams {
    folderId?: string | null;
    parentNoteId?: string | null; // For nested pages
    search?: string;
    tagIds?: string[];
    isPinned?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    isTrashed?: boolean;
    sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'lastEditedAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface CreateNoteInput {
    title: string;
    content?: string;
    contentJson?: any;
    contentHtml?: string;
    folderId?: string;
    parentNoteId?: string; // For nested pages
    icon?: string;
    coverImage?: string;
    color?: string;
    metadata?: any;
    tagIds?: string[];
}

export interface UpdateNoteInput {
    title?: string;
    content?: string;
    contentJson?: any;
    contentHtml?: string;
    folderId?: string | null;
    icon?: string | null;
    coverImage?: string | null;
    color?: string | null;
    metadata?: any;
    isPinned?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    tagIds?: string[];
    createVersion?: boolean;
}

export interface CreateFolderInput {
    name: string;
    parentId?: string;
    icon?: string;
    color?: string;
}

export interface CreateTagInput {
    name: string;
    color?: string;
}

// ====================
// API
// ====================

export const notesApi = {
    // Dashboard
    getDashboard: () =>
        api.get<{ success: boolean; data: NotesDashboard }>('/notes/dashboard'),

    // Notes
    getNotes: (params?: GetNotesParams) =>
        api.get<{ success: boolean; data: Note[]; meta: { total: number; page: number; limit: number; totalPages: number; hasMore: boolean } }>('/notes/notes', {
            params: {
                ...params,
                tagIds: params?.tagIds?.join(','),
                folderId: params?.folderId === null ? 'null' : params?.folderId,
            },
        }),

    getNote: (id: string) =>
        api.get<{ success: boolean; data: Note }>(`/notes/notes/${id}`),

    createNote: (data: CreateNoteInput) =>
        api.post<{ success: boolean; data: Note }>('/notes/notes', data),

    updateNote: (id: string, data: UpdateNoteInput) =>
        api.patch<{ success: boolean; data: Note }>(`/notes/notes/${id}`, data),

    deleteNote: (id: string, permanent = false) =>
        api.delete<{ success: boolean; data: { deleted: boolean } }>(`/notes/notes/${id}`, {
            params: { permanent },
        }),

    restoreNote: (id: string) =>
        api.post<{ success: boolean; data: { restored: boolean } }>(`/notes/notes/${id}/restore`),

    duplicateNote: (id: string) =>
        api.post<{ success: boolean; data: Note }>(`/notes/notes/${id}/duplicate`),

    // Versions
    getVersions: (noteId: string) =>
        api.get<{ success: boolean; data: NoteVersion[] }>(`/notes/notes/${noteId}/versions`),

    restoreVersion: (noteId: string, versionId: string) =>
        api.post<{ success: boolean; data: Note }>(`/notes/notes/${noteId}/versions/${versionId}/restore`),

    // Folders
    getFolders: (parentId?: string | null) =>
        api.get<{ success: boolean; data: NoteFolder[] }>('/notes/folders', {
            params: { parentId: parentId === null ? 'null' : parentId },
        }),

    getFolderTree: () =>
        api.get<{ success: boolean; data: NoteFolder[] }>('/notes/folders/tree'),

    createFolder: (data: CreateFolderInput) =>
        api.post<{ success: boolean; data: NoteFolder }>('/notes/folders', data),

    updateFolder: (id: string, data: Partial<CreateFolderInput & { position?: number }>) =>
        api.patch<{ success: boolean; data: NoteFolder }>(`/notes/folders/${id}`, data),

    deleteFolder: (id: string) =>
        api.delete<{ success: boolean; data: { deleted: boolean } }>(`/notes/folders/${id}`),

    // Tags
    getTags: () =>
        api.get<{ success: boolean; data: NoteTag[] }>('/notes/tags'),

    createTag: (data: CreateTagInput) =>
        api.post<{ success: boolean; data: NoteTag }>('/notes/tags', data),

    updateTag: (id: string, data: Partial<CreateTagInput>) =>
        api.patch<{ success: boolean; data: NoteTag }>(`/notes/tags/${id}`, data),

    deleteTag: (id: string) =>
        api.delete<{ success: boolean; data: { deleted: boolean } }>(`/notes/tags/${id}`),

    // Bulk Operations
    emptyTrash: () =>
        api.post<{ success: boolean; data: { success: boolean } }>('/notes/trash/empty'),

    moveNotesToFolder: (noteIds: string[], folderId: string | null) =>
        api.post<{ success: boolean; data: { success: boolean } }>('/notes/notes/move', {
            noteIds,
            folderId,
        }),

    bulkDelete: (noteIds: string[], permanent = false) =>
        api.post<{ success: boolean; data: { success: boolean } }>('/notes/notes/bulk-delete', {
            noteIds,
            permanent,
        }),
};

// ====================
// CONSTANTS
// ====================

export const NOTE_COLORS = [
    { value: 'default', label: 'Default', hex: '#ffffff' },
    { value: 'red', label: 'Red', hex: '#FEE2E2' },
    { value: 'orange', label: 'Orange', hex: '#FFEDD5' },
    { value: 'yellow', label: 'Yellow', hex: '#FEF3C7' },
    { value: 'green', label: 'Green', hex: '#D1FAE5' },
    { value: 'teal', label: 'Teal', hex: '#CCFBF1' },
    { value: 'blue', label: 'Blue', hex: '#DBEAFE' },
    { value: 'purple', label: 'Purple', hex: '#EDE9FE' },
    { value: 'pink', label: 'Pink', hex: '#FCE7F3' },
    { value: 'gray', label: 'Gray', hex: '#F3F4F6' },
];

export const TAG_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
];

export const FOLDER_ICONS = [
    { value: 'folder', label: 'Folder' },
    { value: 'briefcase', label: 'Work' },
    { value: 'home', label: 'Home' },
    { value: 'heart', label: 'Personal' },
    { value: 'star', label: 'Starred' },
    { value: 'book', label: 'Learning' },
    { value: 'code', label: 'Code' },
    { value: 'file-text', label: 'Documents' },
    { value: 'archive', label: 'Archive' },
    { value: 'zap', label: 'Quick Notes' },
];
