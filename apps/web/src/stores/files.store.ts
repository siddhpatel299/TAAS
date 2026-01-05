import { create } from 'zustand';

export interface StoredFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId?: string;
  isStarred: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  _count?: {
    files: number;
    children: number;
  };
}

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'size' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

interface FilesState {
  files: StoredFile[];
  folders: Folder[];
  currentFolderId: string | null;
  breadcrumb: { id: string; name: string }[];
  selectedFiles: Set<string>;
  uploads: UploadProgress[];
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  searchQuery: string;
  isLoading: boolean;

  // Actions
  setFiles: (files: StoredFile[]) => void;
  setFolders: (folders: Folder[]) => void;
  setCurrentFolder: (folderId: string | null, breadcrumb?: { id: string; name: string }[]) => void;
  selectFile: (fileId: string) => void;
  deselectFile: (fileId: string) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  addUpload: (upload: UploadProgress) => void;
  updateUpload: (id: string, updates: Partial<UploadProgress>) => void;
  removeUpload: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useFilesStore = create<FilesState>((set) => ({
  files: [],
  folders: [],
  currentFolderId: null,
  breadcrumb: [],
  selectedFiles: new Set(),
  uploads: [],
  viewMode: 'grid',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  searchQuery: '',
  isLoading: false,

  setFiles: (files) => set({ files }),
  setFolders: (folders) => set({ folders }),
  setCurrentFolder: (folderId, breadcrumb = []) =>
    set({ currentFolderId: folderId, breadcrumb, selectedFiles: new Set() }),
  
  selectFile: (fileId) =>
    set((state) => {
      const newSet = new Set(state.selectedFiles);
      newSet.add(fileId);
      return { selectedFiles: newSet };
    }),
  
  deselectFile: (fileId) =>
    set((state) => {
      const newSet = new Set(state.selectedFiles);
      newSet.delete(fileId);
      return { selectedFiles: newSet };
    }),
  
  toggleFileSelection: (fileId) =>
    set((state) => {
      const newSet = new Set(state.selectedFiles);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return { selectedFiles: newSet };
    }),
  
  selectAll: () =>
    set((state) => ({
      selectedFiles: new Set(state.files.map((f) => f.id)),
    })),
  
  clearSelection: () => set({ selectedFiles: new Set() }),

  addUpload: (upload) =>
    set((state) => ({ uploads: [...state.uploads, upload] })),
  
  updateUpload: (id, updates) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      ),
    })),
  
  removeUpload: (id) =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.id !== id),
    })),

  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLoading: (isLoading) => set({ isLoading }),
}));
