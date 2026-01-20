import { create } from 'zustand';
import {
    notesApi,
    Note,
    NoteFolder,
    NoteTag,
    NoteVersion,
    NotesDashboard,
    GetNotesParams,
    CreateNoteInput,
    UpdateNoteInput,
    CreateFolderInput,
    CreateTagInput,
} from '@/lib/notes-api';

// ====================
// TYPES
// ====================

export type NotesView = 'all' | 'pinned' | 'favorites' | 'archived' | 'trash';
export type NotesSortBy = 'title' | 'createdAt' | 'updatedAt' | 'lastEditedAt';
export type NotesSortOrder = 'asc' | 'desc';
export type NotesViewMode = 'list' | 'grid' | 'table';

interface NotesFilters {
    folderId?: string | null;
    search?: string;
    tagIds?: string[];
    view: NotesView;
}

interface NotesState {
    // Data
    notes: Note[];
    notesMap: Map<string, Note>;
    selectedNote: Note | null;
    folders: NoteFolder[];
    folderTree: NoteFolder[];
    tags: NoteTag[];
    versions: NoteVersion[];
    dashboard: NotesDashboard | null;

    // Pagination
    totalNotes: number;
    currentPage: number;
    hasMore: boolean;

    // Filters & View
    filters: NotesFilters;
    sortBy: NotesSortBy;
    sortOrder: NotesSortOrder;
    viewMode: NotesViewMode;

    // UI State
    isLoading: boolean;
    isLoadingNote: boolean;
    isSaving: boolean;
    error: string | null;
    sidebarCollapsed: boolean;
    editorPanelOpen: boolean;

    // Actions - Dashboard
    fetchDashboard: () => Promise<void>;

    // Actions - Notes
    fetchNotes: (page?: number) => Promise<void>;
    fetchNote: (id: string) => Promise<Note | null>;
    createNote: (data: CreateNoteInput) => Promise<Note>;
    updateNote: (id: string, data: UpdateNoteInput) => Promise<Note | null>;
    deleteNote: (id: string, permanent?: boolean) => Promise<void>;
    restoreNote: (id: string) => Promise<void>;
    duplicateNote: (id: string) => Promise<Note | null>;
    togglePin: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    archiveNote: (id: string) => Promise<void>;
    unarchiveNote: (id: string) => Promise<void>;

    // Actions - Folders
    fetchFolderTree: () => Promise<void>;
    createFolder: (data: CreateFolderInput) => Promise<NoteFolder>;
    updateFolder: (id: string, data: Partial<CreateFolderInput>) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;

    // Actions - Tags
    fetchTags: () => Promise<void>;
    createTag: (data: CreateTagInput) => Promise<NoteTag>;
    updateTag: (id: string, data: Partial<CreateTagInput>) => Promise<void>;
    deleteTag: (id: string) => Promise<void>;

    // Actions - Versions
    fetchVersions: (noteId: string) => Promise<void>;
    restoreVersion: (noteId: string, versionId: string) => Promise<void>;

    // Actions - Bulk
    emptyTrash: () => Promise<void>;
    moveNotesToFolder: (noteIds: string[], folderId: string | null) => Promise<void>;
    bulkDelete: (noteIds: string[], permanent?: boolean) => Promise<void>;

    // Actions - UI
    setFilters: (filters: Partial<NotesFilters>) => void;
    setView: (view: NotesView) => void;
    setSorting: (sortBy: NotesSortBy, sortOrder: NotesSortOrder) => void;
    setViewMode: (mode: NotesViewMode) => void;
    setSelectedNote: (note: Note | null) => void;
    toggleSidebar: () => void;
    setEditorPanelOpen: (open: boolean) => void;
    clearError: () => void;
}

// ====================
// STORE
// ====================

export const useNotesStore = create<NotesState>((set, get) => ({
    // Initial State
    notes: [],
    notesMap: new Map(),
    selectedNote: null,
    folders: [],
    folderTree: [],
    tags: [],
    versions: [],
    dashboard: null,

    totalNotes: 0,
    currentPage: 1,
    hasMore: false,

    filters: {
        view: 'all',
    },
    sortBy: 'lastEditedAt',
    sortOrder: 'desc',
    viewMode: 'list',

    isLoading: false,
    isLoadingNote: false,
    isSaving: false,
    error: null,
    sidebarCollapsed: false,
    editorPanelOpen: false,

    // Dashboard
    fetchDashboard: async () => {
        try {
            const response = await notesApi.getDashboard();
            set({ dashboard: response.data.data });
        } catch (error: any) {
            console.error('Failed to fetch dashboard:', error);
        }
    },

    // Notes
    fetchNotes: async (page = 1) => {
        try {
            set({ isLoading: true, error: null });
            const { filters, sortBy, sortOrder } = get();

            const params: GetNotesParams = {
                folderId: filters.folderId,
                search: filters.search,
                tagIds: filters.tagIds,
                sortBy,
                sortOrder,
                page,
                limit: 50,
            };

            // Apply view filters
            switch (filters.view) {
                case 'pinned':
                    params.isPinned = true;
                    break;
                case 'favorites':
                    params.isFavorite = true;
                    break;
                case 'archived':
                    params.isArchived = true;
                    break;
                case 'trash':
                    params.isTrashed = true;
                    break;
            }

            const response = await notesApi.getNotes(params);
            const newNotes = response.data.data;

            // Update map
            const notesMap = page === 1 ? new Map() : new Map(get().notesMap);
            newNotes.forEach((note) => notesMap.set(note.id, note));

            set({
                notes: page === 1 ? newNotes : [...get().notes, ...newNotes],
                notesMap,
                totalNotes: response.data.meta.total,
                currentPage: page,
                hasMore: response.data.meta.hasMore,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to fetch notes',
                isLoading: false,
            });
        }
    },

    fetchNote: async (id: string) => {
        try {
            set({ isLoadingNote: true, error: null });
            const response = await notesApi.getNote(id);
            const note = response.data.data;

            // Update in map
            const notesMap = new Map(get().notesMap);
            notesMap.set(id, note);

            set({
                selectedNote: note,
                notesMap,
                isLoadingNote: false,
            });

            return note;
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to fetch note',
                isLoadingNote: false,
            });
            return null;
        }
    },

    createNote: async (data: CreateNoteInput) => {
        try {
            set({ isSaving: true, error: null });
            const response = await notesApi.createNote(data);
            const note = response.data.data;

            // Update state
            const notesMap = new Map(get().notesMap);
            notesMap.set(note.id, note);

            set((state) => ({
                notes: [note, ...state.notes],
                notesMap,
                totalNotes: state.totalNotes + 1,
                selectedNote: note,
                editorPanelOpen: true,
                isSaving: false,
            }));

            return note;
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to create note',
                isSaving: false,
            });
            throw error;
        }
    },

    updateNote: async (id: string, data: UpdateNoteInput) => {
        try {
            set({ isSaving: true, error: null });
            const response = await notesApi.updateNote(id, data);
            const note = response.data.data;

            // Update in list and map
            const notesMap = new Map(get().notesMap);
            notesMap.set(id, note);

            set((state) => ({
                notes: state.notes.map((n) => (n.id === id ? note : n)),
                notesMap,
                selectedNote: state.selectedNote?.id === id ? note : state.selectedNote,
                isSaving: false,
            }));

            return note;
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to update note',
                isSaving: false,
            });
            return null;
        }
    },

    deleteNote: async (id: string, permanent = false) => {
        try {
            await notesApi.deleteNote(id, permanent);

            const notesMap = new Map(get().notesMap);
            notesMap.delete(id);

            set((state) => ({
                notes: state.notes.filter((n) => n.id !== id),
                notesMap,
                selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
                editorPanelOpen: state.selectedNote?.id === id ? false : state.editorPanelOpen,
                totalNotes: state.totalNotes - 1,
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to delete note' });
        }
    },

    restoreNote: async (id: string) => {
        try {
            await notesApi.restoreNote(id);
            // Refresh the list
            get().fetchNotes(1);
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to restore note' });
        }
    },

    duplicateNote: async (id: string) => {
        try {
            set({ isSaving: true });
            const response = await notesApi.duplicateNote(id);
            const note = response.data.data;

            const notesMap = new Map(get().notesMap);
            notesMap.set(note.id, note);

            set((state) => ({
                notes: [note, ...state.notes],
                notesMap,
                totalNotes: state.totalNotes + 1,
                isSaving: false,
            }));

            return note;
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to duplicate note',
                isSaving: false,
            });
            return null;
        }
    },

    togglePin: async (id: string) => {
        const note = get().notesMap.get(id);
        if (!note) return;
        await get().updateNote(id, { isPinned: !note.isPinned });
    },

    toggleFavorite: async (id: string) => {
        const note = get().notesMap.get(id);
        if (!note) return;
        await get().updateNote(id, { isFavorite: !note.isFavorite });
    },

    archiveNote: async (id: string) => {
        await get().updateNote(id, { isArchived: true });
    },

    unarchiveNote: async (id: string) => {
        await get().updateNote(id, { isArchived: false });
    },

    // Folders
    fetchFolderTree: async () => {
        try {
            const response = await notesApi.getFolderTree();
            set({ folderTree: response.data.data });
        } catch (error: any) {
            console.error('Failed to fetch folder tree:', error);
        }
    },

    createFolder: async (data: CreateFolderInput) => {
        try {
            const response = await notesApi.createFolder(data);
            const folder = response.data.data;
            // Refresh tree
            get().fetchFolderTree();
            return folder;
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to create folder' });
            throw error;
        }
    },

    updateFolder: async (id: string, data: Partial<CreateFolderInput>) => {
        try {
            await notesApi.updateFolder(id, data);
            get().fetchFolderTree();
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to update folder' });
        }
    },

    deleteFolder: async (id: string) => {
        try {
            await notesApi.deleteFolder(id);
            get().fetchFolderTree();
            // If we were viewing this folder, reset to all
            if (get().filters.folderId === id) {
                get().setFilters({ folderId: undefined });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to delete folder' });
        }
    },

    // Tags
    fetchTags: async () => {
        try {
            const response = await notesApi.getTags();
            set({ tags: response.data.data });
        } catch (error: any) {
            console.error('Failed to fetch tags:', error);
        }
    },

    createTag: async (data: CreateTagInput) => {
        try {
            const response = await notesApi.createTag(data);
            const tag = response.data.data;
            set((state) => ({ tags: [...state.tags, tag] }));
            return tag;
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to create tag' });
            throw error;
        }
    },

    updateTag: async (id: string, data: Partial<CreateTagInput>) => {
        try {
            const response = await notesApi.updateTag(id, data);
            set((state) => ({
                tags: state.tags.map((t) => (t.id === id ? response.data.data : t)),
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to update tag' });
        }
    },

    deleteTag: async (id: string) => {
        try {
            await notesApi.deleteTag(id);
            set((state) => ({
                tags: state.tags.filter((t) => t.id !== id),
                filters: {
                    ...state.filters,
                    tagIds: state.filters.tagIds?.filter((tid) => tid !== id),
                },
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to delete tag' });
        }
    },

    // Versions
    fetchVersions: async (noteId: string) => {
        try {
            const response = await notesApi.getVersions(noteId);
            set({ versions: response.data.data });
        } catch (error: any) {
            console.error('Failed to fetch versions:', error);
        }
    },

    restoreVersion: async (noteId: string, versionId: string) => {
        try {
            set({ isSaving: true });
            const response = await notesApi.restoreVersion(noteId, versionId);
            const note = response.data.data;

            const notesMap = new Map(get().notesMap);
            notesMap.set(noteId, note);

            set((state) => ({
                notes: state.notes.map((n) => (n.id === noteId ? note : n)),
                notesMap,
                selectedNote: state.selectedNote?.id === noteId ? note : state.selectedNote,
                isSaving: false,
            }));

            // Refresh versions list
            get().fetchVersions(noteId);
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to restore version',
                isSaving: false,
            });
        }
    },

    // Bulk Operations
    emptyTrash: async () => {
        try {
            await notesApi.emptyTrash();
            // Refresh if viewing trash
            if (get().filters.view === 'trash') {
                get().fetchNotes(1);
            }
            get().fetchDashboard();
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to empty trash' });
        }
    },

    moveNotesToFolder: async (noteIds: string[], folderId: string | null) => {
        try {
            await notesApi.moveNotesToFolder(noteIds, folderId);
            get().fetchNotes(1);
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to move notes' });
        }
    },

    bulkDelete: async (noteIds: string[], permanent = false) => {
        try {
            await notesApi.bulkDelete(noteIds, permanent);

            const notesMap = new Map(get().notesMap);
            noteIds.forEach((id) => notesMap.delete(id));

            set((state) => ({
                notes: state.notes.filter((n) => !noteIds.includes(n.id)),
                notesMap,
                totalNotes: state.totalNotes - noteIds.length,
                selectedNote: noteIds.includes(state.selectedNote?.id || '') ? null : state.selectedNote,
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.error || 'Failed to delete notes' });
        }
    },

    // UI Actions
    setFilters: (filters: Partial<NotesFilters>) => {
        set((state) => ({
            filters: { ...state.filters, ...filters },
            currentPage: 1,
        }));
        get().fetchNotes(1);
    },

    setView: (view: NotesView) => {
        set((state) => ({
            filters: { ...state.filters, view, folderId: undefined },
            currentPage: 1,
        }));
        get().fetchNotes(1);
    },

    setSorting: (sortBy: NotesSortBy, sortOrder: NotesSortOrder) => {
        set({ sortBy, sortOrder });
        get().fetchNotes(1);
    },

    setViewMode: (mode: NotesViewMode) => {
        set({ viewMode: mode });
    },

    setSelectedNote: (note: Note | null) => {
        set({
            selectedNote: note,
            editorPanelOpen: !!note,
        });
    },

    toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },

    setEditorPanelOpen: (open: boolean) => {
        set({
            editorPanelOpen: open,
            selectedNote: open ? get().selectedNote : null,
        });
    },

    clearError: () => set({ error: null }),
}));
