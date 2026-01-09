import { create } from 'zustand';
import {
  notesApi,
  Note,
  NoteFolder,
  NoteVersion,
  NoteTemplate,
  NoteShare,
  NotesDashboard,
} from '@/lib/notes-api';

interface NotesState {
  // Data
  notes: Note[];
  selectedNote: Note | null;
  folders: NoteFolder[];
  folderTree: NoteFolder[];
  templates: NoteTemplate[];
  versions: NoteVersion[];
  dashboardStats: NotesDashboard | null;

  // Pagination
  totalNotes: number;
  currentPage: number;
  hasMore: boolean;

  // Filters
  filters: {
    folderId?: string;
    search?: string;
    tags?: string[];
    isPinned?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    isTrashed?: boolean;
  };
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'lastEditedAt';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';

  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  sidebarOpen: boolean;

  // Actions - Dashboard
  fetchDashboard: () => Promise<void>;

  // Actions - Notes
  fetchNotes: (page?: number) => Promise<void>;
  fetchNote: (id: string) => Promise<void>;
  createNote: (data: {
    title: string;
    content?: string;
    contentHtml?: string;
    folderId?: string;
    tags?: string[];
    color?: string;
  }) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>, createVersion?: boolean) => Promise<void>;
  deleteNote: (id: string, permanent?: boolean) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<Note>;
  togglePin: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  unarchiveNote: (id: string) => Promise<void>;

  // Actions - Search
  searchNotes: (query: string) => Promise<Note[]>;

  // Actions - Versions
  fetchVersions: (noteId: string) => Promise<void>;
  restoreVersion: (noteId: string, versionId: string) => Promise<void>;

  // Actions - Folders
  fetchFolders: (parentId?: string) => Promise<void>;
  fetchFolderTree: () => Promise<void>;
  createFolder: (data: { name: string; parentId?: string; color?: string; icon?: string }) => Promise<NoteFolder>;
  updateFolder: (id: string, data: Partial<NoteFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Actions - Templates
  fetchTemplates: (category?: string) => Promise<void>;
  createTemplate: (data: { name: string; description?: string; content?: string; category?: string }) => Promise<NoteTemplate>;
  useTemplate: (templateId: string, folderId?: string) => Promise<Note>;
  deleteTemplate: (id: string) => Promise<void>;

  // Actions - Sharing
  createShare: (noteId: string, options?: { isPublic?: boolean; allowEdit?: boolean; password?: string; expiresAt?: string }) => Promise<NoteShare>;
  deleteShare: (shareId: string) => Promise<void>;

  // Actions - Bulk Operations
  emptyTrash: () => Promise<void>;
  moveNotesToFolder: (noteIds: string[], folderId: string | null) => Promise<void>;
  bulkDelete: (noteIds: string[], permanent?: boolean) => Promise<void>;

  // Actions - Filters & Sorting
  setFilters: (filters: Partial<NotesState['filters']>) => void;
  setSorting: (sortBy: NotesState['sortBy'], sortOrder: NotesState['sortOrder']) => void;
  setViewMode: (mode: NotesState['viewMode']) => void;
  setSelectedNote: (note: Note | null) => void;
  toggleSidebar: () => void;

  // Actions - UI State
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  // Initial State
  notes: [],
  selectedNote: null,
  folders: [],
  folderTree: [],
  templates: [],
  versions: [],
  dashboardStats: null,

  totalNotes: 0,
  currentPage: 1,
  hasMore: false,

  filters: {},
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  viewMode: 'grid',

  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  sidebarOpen: true,

  // Actions - Dashboard
  fetchDashboard: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await notesApi.getDashboard();
      set({
        dashboardStats: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch dashboard data',
        isLoading: false,
      });
    }
  },

  // Actions - Notes
  fetchNotes: async (page = 1) => {
    try {
      set({ isLoading: true, error: null });
      const { filters, sortBy, sortOrder } = get();

      const response = await notesApi.getNotes({
        ...filters,
        tags: filters.tags?.join(','),
        sortBy,
        sortOrder,
        page,
        limit: 50,
      });

      set({
        notes: page === 1 ? response.data.data : [...get().notes, ...response.data.data],
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
      set({ isLoading: true, error: null });
      const response = await notesApi.getNote(id);
      set({
        selectedNote: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch note',
        isLoading: false,
      });
    }
  },

  createNote: async (data) => {
    try {
      set({ isCreating: true, error: null });
      const response = await notesApi.createNote(data);
      const newNote = response.data.data;

      set((state) => ({
        notes: [newNote, ...state.notes],
        totalNotes: state.totalNotes + 1,
        isCreating: false,
      }));

      return newNote;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create note',
        isCreating: false,
      });
      throw error;
    }
  },

  updateNote: async (id: string, data, createVersion = true) => {
    try {
      set({ isUpdating: true, error: null });
      const response = await notesApi.updateNote(id, { ...data, createVersion });
      const updatedNote = response.data.data;

      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
        selectedNote: state.selectedNote?.id === id ? updatedNote : state.selectedNote,
        isUpdating: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to update note',
        isUpdating: false,
      });
    }
  },

  deleteNote: async (id: string, permanent = false) => {
    try {
      set({ isDeleting: true, error: null });
      await notesApi.deleteNote(id, permanent);

      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        totalNotes: state.totalNotes - 1,
        isDeleting: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete note',
        isDeleting: false,
      });
    }
  },

  restoreNote: async (id: string) => {
    try {
      set({ isUpdating: true, error: null });
      await notesApi.restoreNote(id);

      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        isUpdating: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to restore note',
        isUpdating: false,
      });
    }
  },

  duplicateNote: async (id: string) => {
    try {
      set({ isCreating: true, error: null });
      const response = await notesApi.duplicateNote(id);
      const duplicatedNote = response.data.data;

      set((state) => ({
        notes: [duplicatedNote, ...state.notes],
        totalNotes: state.totalNotes + 1,
        isCreating: false,
      }));

      return duplicatedNote;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to duplicate note',
        isCreating: false,
      });
      throw error;
    }
  },

  togglePin: async (id: string) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    await get().updateNote(id, { isPinned: !note.isPinned }, false);
  },

  toggleFavorite: async (id: string) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    await get().updateNote(id, { isFavorite: !note.isFavorite }, false);
  },

  archiveNote: async (id: string) => {
    await get().updateNote(id, { isArchived: true }, false);
  },

  unarchiveNote: async (id: string) => {
    await get().updateNote(id, { isArchived: false }, false);
  },

  // Actions - Search
  searchNotes: async (query: string) => {
    try {
      const response = await notesApi.searchNotes(query);
      return response.data.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to search notes',
      });
      return [];
    }
  },

  // Actions - Versions
  fetchVersions: async (noteId: string) => {
    try {
      const response = await notesApi.getNoteVersions(noteId);
      set({ versions: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch versions:', error);
    }
  },

  restoreVersion: async (noteId: string, versionId: string) => {
    try {
      set({ isUpdating: true, error: null });
      const response = await notesApi.restoreVersion(noteId, versionId);
      const restoredNote = response.data.data;

      set((state) => ({
        notes: state.notes.map((n) => (n.id === noteId ? restoredNote : n)),
        selectedNote: state.selectedNote?.id === noteId ? restoredNote : state.selectedNote,
        isUpdating: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to restore version',
        isUpdating: false,
      });
    }
  },

  // Actions - Folders
  fetchFolders: async (parentId?: string) => {
    try {
      const response = await notesApi.getFolders(parentId);
      set({ folders: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch folders:', error);
    }
  },

  fetchFolderTree: async () => {
    try {
      const response = await notesApi.getFolderTree();
      set({ folderTree: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch folder tree:', error);
    }
  },

  createFolder: async (data) => {
    try {
      const response = await notesApi.createFolder(data);
      const newFolder = response.data.data;

      set((state) => ({
        folders: [...state.folders, newFolder],
      }));

      // Refresh folder tree
      get().fetchFolderTree();

      return newFolder;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create folder',
      });
      throw error;
    }
  },

  updateFolder: async (id: string, data) => {
    try {
      const response = await notesApi.updateFolder(id, data);
      const updatedFolder = response.data.data;

      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updatedFolder : f)),
      }));

      // Refresh folder tree
      get().fetchFolderTree();
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to update folder',
      });
    }
  },

  deleteFolder: async (id: string) => {
    try {
      await notesApi.deleteFolder(id);

      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
      }));

      // Refresh folder tree
      get().fetchFolderTree();
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete folder',
      });
    }
  },

  // Actions - Templates
  fetchTemplates: async (category?: string) => {
    try {
      const response = await notesApi.getTemplates(category);
      set({ templates: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
    }
  },

  createTemplate: async (data) => {
    try {
      const response = await notesApi.createTemplate(data);
      const newTemplate = response.data.data;

      set((state) => ({
        templates: [...state.templates, newTemplate],
      }));

      return newTemplate;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create template',
      });
      throw error;
    }
  },

  useTemplate: async (templateId: string, folderId?: string) => {
    try {
      set({ isCreating: true, error: null });
      const response = await notesApi.useTemplate(templateId, folderId);
      const newNote = response.data.data;

      set((state) => ({
        notes: [newNote, ...state.notes],
        totalNotes: state.totalNotes + 1,
        isCreating: false,
      }));

      return newNote;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to use template',
        isCreating: false,
      });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    try {
      await notesApi.deleteTemplate(id);

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete template',
      });
    }
  },

  // Actions - Sharing
  createShare: async (noteId: string, options) => {
    try {
      const response = await notesApi.createShare(noteId, options);
      return response.data.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create share link',
      });
      throw error;
    }
  },

  deleteShare: async (shareId: string) => {
    try {
      await notesApi.deleteShare(shareId);
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete share link',
      });
    }
  },

  // Actions - Bulk Operations
  emptyTrash: async () => {
    try {
      set({ isDeleting: true, error: null });
      await notesApi.emptyTrash();

      set((state) => ({
        notes: state.notes.filter((n) => !n.isTrashed),
        isDeleting: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to empty trash',
        isDeleting: false,
      });
    }
  },

  moveNotesToFolder: async (noteIds: string[], folderId: string | null) => {
    try {
      set({ isUpdating: true, error: null });
      await notesApi.moveNotesToFolder(noteIds, folderId);

      // Refresh notes
      get().fetchNotes(1);
      set({ isUpdating: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to move notes',
        isUpdating: false,
      });
    }
  },

  bulkDelete: async (noteIds: string[], permanent = false) => {
    try {
      set({ isDeleting: true, error: null });
      await notesApi.bulkDelete(noteIds, permanent);

      set((state) => ({
        notes: state.notes.filter((n) => !noteIds.includes(n.id)),
        totalNotes: state.totalNotes - noteIds.length,
        isDeleting: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete notes',
        isDeleting: false,
      });
    }
  },

  // Actions - Filters & Sorting
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      currentPage: 1,
    }));
    get().fetchNotes(1);
  },

  setSorting: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().fetchNotes(1);
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  setSelectedNote: (note) => {
    set({ selectedNote: note });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  // Actions - UI State
  clearError: () => set({ error: null }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
