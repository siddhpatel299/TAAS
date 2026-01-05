// User types
export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// File types
export interface StoredFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  telegramFileId: string;
  telegramMessageId: number;
  channelId: string;
  folderId?: string;
  userId: string;
  isStarred: boolean;
  isTrashed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Folder types
export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  userId: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Storage channel types
export interface StorageChannel {
  id: string;
  channelId: string;
  channelName: string;
  userId: string;
  usedBytes: number;
  fileCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Upload types
export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface DownloadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

// Auth types
export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// File operation types
export type SortBy = 'name' | 'size' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface FileFilters {
  folderId?: string;
  mimeType?: string;
  isStarred?: boolean;
  isTrashed?: boolean;
  search?: string;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

// Utility types
export type FileType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

export function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  ) return 'document';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    mimeType.includes('7z')
  ) return 'archive';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
