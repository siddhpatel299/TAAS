import { api } from './api';

// ==================== TYPES ====================

export interface Note {
  id: string;
  userId: string;
  title: string;
  content?: string;
  contentHtml?: string;
  folderId?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  trashedAt?: string;
  color?: string;
  icon?: string;
  coverImage?: string;
  tags: string[];
  wordCount: number;
  readingTime: number;
  lastEditedAt?: string;
  createdAt: string;
  updatedAt: string;
  folder?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  _count?: {
    versions: number;
    shares: number;
  };
}

export interface NoteFolder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
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
  contentHtml?: string;
  version: number;
  createdAt: string;
}

export interface NoteTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  content?: string;
  contentHtml?: string;
  category?: string;
  icon?: string;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteShare {
  id: string;
  noteId: string;
  userId: string;
  token: string;
  isPublic: boolean;
  allowEdit: boolean;
  password?: string;
  expiresAt?: string;
  viewCount: number;
  createdAt: string;
}

export interface NotesDashboard {
  totalNotes: number;
  pinnedCount: number;
  favoriteCount: number;
  archivedCount: number;
  trashedCount: number;
  folderCount: number;
  recentNotes: Note[];
  topTags: { tag: string; count: number }[];
}

// ==================== API ====================

export const notesApi = {
  // Dashboard
  getDashboard: () =>
    api.get<{ success: boolean; data: NotesDashboard }>('/notes/dashboard'),

  // Notes
  getNotes: (params?: {
    folderId?: string;
    search?: string;
    tags?: string;
    isPinned?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    isTrashed?: boolean;
    sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'lastEditedAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) =>
    api.get<{ success: boolean; data: Note[]; meta: any }>('/notes/notes', { params }),

  getNote: (id: string) =>
    api.get<{ success: boolean; data: Note }>(`/notes/notes/${id}`),

  createNote: (data: {
    title: string;
    content?: string;
    contentHtml?: string;
    folderId?: string;
    tags?: string[];
    color?: string;
    icon?: string;
    coverImage?: string;
  }) =>
    api.post<{ success: boolean; data: Note }>('/notes/notes', data),

  updateNote: (id: string, data: {
    title?: string;
    content?: string;
    contentHtml?: string;
    folderId?: string;
    isPinned?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    tags?: string[];
    color?: string;
    icon?: string;
    coverImage?: string;
    createVersion?: boolean;
  }) =>
    api.patch<{ success: boolean; data: Note }>(`/notes/notes/${id}`, data),

  deleteNote: (id: string, permanent = false) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/notes/notes/${id}`, {
      params: { permanent }
    }),

  restoreNote: (id: string) =>
    api.post<{ success: boolean; data: { restored: boolean } }>(`/notes/notes/${id}/restore`),

  duplicateNote: (id: string) =>
    api.post<{ success: boolean; data: Note }>(`/notes/notes/${id}/duplicate`),

  // Search
  searchNotes: (query: string, params?: {
    folderId?: string;
    tags?: string;
    limit?: number;
  }) =>
    api.get<{ success: boolean; data: Note[] }>('/notes/search', {
      params: { q: query, ...params }
    }),

  // Versions
  getNoteVersions: (noteId: string) =>
    api.get<{ success: boolean; data: NoteVersion[] }>(`/notes/notes/${noteId}/versions`),

  restoreVersion: (noteId: string, versionId: string) =>
    api.post<{ success: boolean; data: Note }>(`/notes/notes/${noteId}/versions/${versionId}/restore`),

  // Folders
  getFolders: (parentId?: string) =>
    api.get<{ success: boolean; data: NoteFolder[] }>('/notes/folders', {
      params: { parentId }
    }),

  getFolderTree: () =>
    api.get<{ success: boolean; data: NoteFolder[] }>('/notes/folders/tree'),

  createFolder: (data: {
    name: string;
    parentId?: string;
    color?: string;
    icon?: string;
  }) =>
    api.post<{ success: boolean; data: NoteFolder }>('/notes/folders', data),

  updateFolder: (id: string, data: Partial<{
    name: string;
    parentId?: string;
    color?: string;
    icon?: string;
  }>) =>
    api.patch<{ success: boolean; data: NoteFolder }>(`/notes/folders/${id}`, data),

  deleteFolder: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/notes/folders/${id}`),

  // Templates
  getTemplates: (category?: string) =>
    api.get<{ success: boolean; data: NoteTemplate[] }>('/notes/templates', {
      params: { category }
    }),

  getTemplate: (id: string) =>
    api.get<{ success: boolean; data: NoteTemplate }>(`/notes/templates/${id}`),

  createTemplate: (data: {
    name: string;
    description?: string;
    content?: string;
    contentHtml?: string;
    category?: string;
    icon?: string;
  }) =>
    api.post<{ success: boolean; data: NoteTemplate }>('/notes/templates', data),

  updateTemplate: (id: string, data: Partial<{
    name: string;
    description?: string;
    content?: string;
    contentHtml?: string;
    category?: string;
    icon?: string;
  }>) =>
    api.patch<{ success: boolean; data: NoteTemplate }>(`/notes/templates/${id}`, data),

  deleteTemplate: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/notes/templates/${id}`),

  useTemplate: (templateId: string, folderId?: string) =>
    api.post<{ success: boolean; data: Note }>(`/notes/templates/${templateId}/use`, { folderId }),

  // Sharing
  createShare: (noteId: string, options?: {
    isPublic?: boolean;
    allowEdit?: boolean;
    password?: string;
    expiresAt?: string;
  }) =>
    api.post<{ success: boolean; data: NoteShare }>(`/notes/notes/${noteId}/share`, options),

  deleteShare: (shareId: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/notes/shares/${shareId}`),

  getSharedNote: (token: string, password?: string) =>
    api.get<{ success: boolean; data: { note: Note; allowEdit: boolean } }>(`/notes/shared/${token}`, {
      params: { password }
    }),

  // Bulk Operations
  emptyTrash: () =>
    api.post<{ success: boolean; data: { success: boolean } }>('/notes/trash/empty'),

  moveNotesToFolder: (noteIds: string[], folderId: string | null) =>
    api.post<{ success: boolean; data: { success: boolean } }>('/notes/notes/move', {
      noteIds,
      folderId
    }),

  bulkDelete: (noteIds: string[], permanent = false) =>
    api.post<{ success: boolean; data: { success: boolean } }>('/notes/notes/bulk-delete', {
      noteIds,
      permanent
    }),
};

// ==================== CONSTANTS ====================

export const NOTE_COLORS = [
  { value: 'default', label: 'Default', color: '#ffffff' },
  { value: 'red', label: 'Red', color: '#FEE2E2' },
  { value: 'orange', label: 'Orange', color: '#FFEDD5' },
  { value: 'yellow', label: 'Yellow', color: '#FEF3C7' },
  { value: 'green', label: 'Green', color: '#D1FAE5' },
  { value: 'teal', label: 'Teal', color: '#CCFBF1' },
  { value: 'blue', label: 'Blue', color: '#DBEAFE' },
  { value: 'purple', label: 'Purple', color: '#EDE9FE' },
  { value: 'pink', label: 'Pink', color: '#FCE7F3' },
  { value: 'gray', label: 'Gray', color: '#F3F4F6' },
];

export const TEMPLATE_CATEGORIES = [
  { value: 'work', label: 'Work', icon: 'briefcase' },
  { value: 'personal', label: 'Personal', icon: 'user' },
  { value: 'education', label: 'Education', icon: 'graduation-cap' },
  { value: 'project', label: 'Project', icon: 'folder' },
  { value: 'meeting', label: 'Meeting', icon: 'users' },
  { value: 'general', label: 'General', icon: 'file-text' },
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
];
