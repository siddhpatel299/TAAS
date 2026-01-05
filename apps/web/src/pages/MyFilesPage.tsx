import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  ChevronDown,
  Upload,
  FolderPlus,
  ChevronRight,
  Home,
  Grid3X3,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  Share2,
  Star,
  Eye,
  Folder,
  File,
  FileVideo,
  FileImage,
  FileText,
  FileArchive,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { FileUploader } from '@/components/FileUploader';
import { FilePreview } from '@/components/FilePreview';
import { ShareDialog } from '@/components/ShareDialog';
import { UploadQueue } from '@/components/UploadQueue';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { useAuthStore } from '@/stores/auth.store';
import { filesApi, foldersApi } from '@/lib/api';

interface FolderType {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  fileCount?: number;
  createdAt: string;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('video/')) return <FileVideo className="w-8 h-8 text-purple-500" />;
  if (mimeType.startsWith('image/')) return <FileImage className="w-8 h-8 text-green-500" />;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text'))
    return <FileText className="w-8 h-8 text-blue-500" />;
  if (mimeType.includes('zip') || mimeType.includes('archive'))
    return <FileArchive className="w-8 h-8 text-yellow-500" />;
  return <File className="w-8 h-8 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function MyFilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();

  const {
    files,
    setFiles,
    addUpload,
    updateUpload,
    setLoading,
  } = useFilesStore();

  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: 'My Files' }]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string | null>(searchParams.get('filter'));

  const [showUploader, setShowUploader] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [shareFile, setShareFile] = useState<StoredFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load folders and files
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        foldersApi.getFolders(currentFolderId || undefined),
        filesApi.getFiles({
          folderId: currentFolderId || undefined,
          search: debouncedSearch || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ]);

      setFolders(foldersRes.data.data);
      
      let filteredFiles = filesRes.data.data as StoredFile[];
      
      // Apply type filter
      if (filterType) {
        filteredFiles = filteredFiles.filter(file => {
          switch (filterType) {
            case 'video':
              return file.mimeType.startsWith('video/');
            case 'photo':
              return file.mimeType.startsWith('image/');
            case 'document':
              return file.mimeType.includes('pdf') || 
                     file.mimeType.includes('document') || 
                     file.mimeType.includes('text');
            case 'other':
              return !file.mimeType.startsWith('video/') &&
                     !file.mimeType.startsWith('image/') &&
                     !file.mimeType.includes('pdf') &&
                     !file.mimeType.includes('document');
            default:
              return true;
          }
        });
      }
      
      setFiles(filteredFiles);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, debouncedSearch, filterType, setFiles, setLoading]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Navigate to folder
  const navigateToFolder = async (folderId: string | null, folderName?: string) => {
    if (folderId === null) {
      setBreadcrumb([{ id: null, name: 'My Files' }]);
    } else {
      const existingIndex = breadcrumb.findIndex(b => b.id === folderId);
      if (existingIndex >= 0) {
        setBreadcrumb(breadcrumb.slice(0, existingIndex + 1));
      } else {
        setBreadcrumb([...breadcrumb, { id: folderId, name: folderName || 'Folder' }]);
      }
    }
    setCurrentFolderId(folderId);
    setFilterType(null);
    setSearchParams({});
  };

  // Folder operations
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await foldersApi.createFolder(newFolderName.trim(), currentFolderId || undefined);
      setNewFolderName('');
      setShowNewFolder(false);
      loadContent();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) return;
    try {
      await foldersApi.renameFolder(editingFolder.id, editFolderName.trim());
      setEditingFolder(null);
      setEditFolderName('');
      loadContent();
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleDeleteFolder = async (folder: FolderType) => {
    try {
      await foldersApi.deleteFolder(folder.id);
      loadContent();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  // File operations
  const handleUpload = async (uploadFiles: File[]) => {
    for (const file of uploadFiles) {
      const uploadId = Math.random().toString(36).substring(2);
      addUpload({
        id: uploadId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });
      try {
        await filesApi.uploadFile(file, currentFolderId || undefined, (progress) => {
          updateUpload(uploadId, { progress });
        });
        updateUpload(uploadId, { status: 'completed', progress: 100 });
        loadContent();
      } catch (error: any) {
        updateUpload(uploadId, {
          status: 'error',
          error: error.response?.data?.error || 'Upload failed',
        });
      }
    }
    setShowUploader(false);
  };

  const handleDownload = async (file: StoredFile) => {
    try {
      const response = await filesApi.downloadFile(file.id);
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleStar = async (file: StoredFile) => {
    try {
      await filesApi.toggleStar(file.id);
      loadContent();
    } catch (error) {
      console.error('Star failed:', error);
    }
  };

  const handleDelete = async (file: StoredFile) => {
    try {
      await filesApi.deleteFile(file.id);
      loadContent();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      handleUpload(Array.from(e.dataTransfer.files));
    }
  }, []);

  const userName = user?.firstName || user?.username || 'User';

  return (
    <div
      className="min-h-screen bg-[#f0f5fa] flex"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <ModernSidebar />

      <main className="flex-1 ml-20 p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-900"
            >
              My Files
            </motion.h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 w-80 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumb.map((item, index) => (
                <div key={item.id || 'root'} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <button
                    onClick={() => navigateToFolder(item.id, item.name)}
                    className={`px-2 py-1 rounded-lg hover:bg-white transition-colors flex items-center gap-1 ${
                      index === breadcrumb.length - 1
                        ? 'font-medium text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {index === 0 && <Home className="w-4 h-4" />}
                    {item.name}
                  </button>
                </div>
              ))}
            </nav>

            {filterType && (
              <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium flex items-center gap-2">
                Filter: {filterType}
                <button
                  onClick={() => {
                    setFilterType(null);
                    setSearchParams({});
                  }}
                  className="hover:text-cyan-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-white rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-cyan-100 text-cyan-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-cyan-100 text-cyan-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <Button
              onClick={() => setShowNewFolder(true)}
              variant="outline"
              className="rounded-xl"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <Button
              onClick={() => setShowUploader(true)}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Folders Section */}
        {folders.length > 0 && !filterType && !debouncedSearch && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigateToFolder(folder.id, folder.name)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: folder.color + '20' }}
                    >
                      <Folder
                        className="w-6 h-6"
                        style={{ color: folder.color }}
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                            setEditFolderName(folder.name);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                  <p className="text-sm text-gray-500">
                    {folder.fileCount || 0} files
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Files Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {debouncedSearch ? 'Search Results' : filterType ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Files` : 'Files'}
          </h2>

          {files.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <File className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-500 mb-4">
                {debouncedSearch
                  ? 'Try adjusting your search terms'
                  : 'Upload your first file to get started'}
              </p>
              <Button
                onClick={() => setShowUploader(true)}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShareFile(file)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStar(file)}>
                          <Star className="w-4 h-4 mr-2" />
                          {file.isStarred ? 'Unstar' : 'Star'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(file)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate text-sm">{file.originalName}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                  </p>
                  {file.isStarred && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current mt-2" />
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Size</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mimeType)}
                          <div>
                            <p className="font-medium text-gray-900">{file.originalName}</p>
                            {file.isStarred && (
                              <Star className="w-3 h-3 text-yellow-500 fill-current inline-block" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {formatDate(file.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => setShareFile(file)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Share2 className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleStar(file)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Star className={`w-4 h-4 ${file.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(file)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameFolder}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="sm:max-w-xl bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Files</DialogTitle>
          </DialogHeader>
          <FileUploader onUpload={handleUpload} />
        </DialogContent>
      </Dialog>

      {/* File Preview */}
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Share Dialog */}
      {shareFile && (
        <ShareDialog open={!!shareFile} file={shareFile} onClose={() => setShareFile(null)} />
      )}

      {/* Upload Queue */}
      <UploadQueue />

      {/* Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-cyan-500/20 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-12 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Upload className="w-10 h-10 text-white" />
                </motion.div>
              </div>
              <p className="text-xl font-semibold text-gray-900">Drop files to upload</p>
              <p className="text-gray-500 mt-2">Release to start uploading</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
