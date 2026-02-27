import { useState, useEffect, useCallback, useRef } from 'react';
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
  X,
  Check,
  FolderInput,
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
import { DirectUploadQueue } from '@/components/DirectUploadQueue';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOSStore } from '@/stores/os.store';
import { useDirectUpload } from '@/contexts/DirectUploadContext';
import { filesApi, foldersApi, bulkApi } from '@/lib/api';
import { HUDAppLayout, HUDCard, HUDDataTable } from '@/components/hud';

interface FolderType {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  _count?: {
    files: number;
    children: number;
  };
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
  const osStyle = useOSStore((s) => s.osStyle);
  const isHUD = osStyle === 'hud';

  const {
    files,
    setFiles,
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

  // Bulk selection state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [folderTree, setFolderTree] = useState<FolderType[]>([]);

  // Download progress state
  const [downloadProgress, setDownloadProgress] = useState<{
    fileId: string;
    fileName: string;
    progress: number;
    totalSize: number;
    downloaded: number;
  } | null>(null);
  const downloadAbortRef = useRef<AbortController | null>(null);

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // Select all files
  const selectAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  // Clear selection
  const clearSelection = () => setSelectedFiles(new Set());

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    try {
      await bulkApi.deleteFiles(Array.from(selectedFiles));
      clearSelection();
      loadContent();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleBulkStar = async (starred: boolean) => {
    if (selectedFiles.size === 0) return;
    try {
      await bulkApi.starFiles(Array.from(selectedFiles), starred);
      clearSelection();
      loadContent();
    } catch (error) {
      console.error('Bulk star failed:', error);
    }
  };

  const handleBulkMove = async (targetFolderId: string | null) => {
    if (selectedFiles.size === 0) return;
    try {
      await bulkApi.moveFiles(Array.from(selectedFiles), targetFolderId);
      clearSelection();
      setShowMoveDialog(false);
      loadContent();
    } catch (error) {
      console.error('Bulk move failed:', error);
    }
  };

  const handleBulkDownload = async () => {
    // Download files one by one
    for (const fileId of selectedFiles) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        await handleDownload(file);
      }
    }
  };

  // Load folder tree for move dialog
  const loadFolderTree = async () => {
    try {
      const res = await foldersApi.getFolderTree();
      setFolderTree(res.data.data);
    } catch (error) {
      console.error('Failed to load folder tree:', error);
    }
  };

  useEffect(() => {
    loadFolderTree();
  }, []);

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
      // When searching, search both folders and files globally
      // When not searching, load folders and files for current directory
      const [foldersRes, filesRes] = await Promise.all([
        foldersApi.getFolders(
          debouncedSearch ? undefined : (currentFolderId || undefined),
          debouncedSearch || undefined  // Pass search query to folders API
        ),
        filesApi.getFiles({
          folderId: debouncedSearch ? undefined : (currentFolderId || undefined),
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

  // Direct upload hook for browser-to-Telegram uploads
  const { uploadFiles: directUploadFiles, uploads: _directUploads, isClientReady: _isClientReady } = useDirectUpload();

  // File operations - Using direct browser-to-Telegram upload
  const handleUpload = async (uploadFiles: File[]) => {
    // Use direct upload (browser → Telegram, bypasses server)
    // This is memory-efficient and works with large files
    directUploadFiles(uploadFiles, currentFolderId);
    setShowUploader(false);

    // Reload content after a short delay to show new files
    setTimeout(() => loadContent(), 2000);
  };

  const handleDownload = async (file: StoredFile) => {
    // Abort any previous download
    downloadAbortRef.current?.abort();
    downloadAbortRef.current = new AbortController();
    const signal = downloadAbortRef.current.signal;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const downloadUrl = `${baseUrl}/files/${file.id}/download?token=${token}`;

      // Initialize progress
      setDownloadProgress({
        fileId: file.id,
        fileName: file.originalName,
        progress: 0,
        totalSize: Number(file.size),
        downloaded: 0,
      });

      // Check if File System Access API is supported
      if ('showSaveFilePicker' in window) {
        try {
          const ext = file.originalName.split('.').pop() || '';

          const handle = await (window as any).showSaveFilePicker({
            suggestedName: file.originalName,
            types: [{
              description: 'File',
              accept: { [file.mimeType || 'application/octet-stream']: [`.${ext}`] }
            }]
          });

          const writable = await handle.createWritable();

          console.log(`[Download] Streaming ${file.originalName} directly to disk...`);
          const response = await fetch(downloadUrl, { signal });

          if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const totalSize = Number(file.size);
          let downloaded = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            await writable.write(value);
            downloaded += value.length;

            // Update progress state
            const percent = Math.round((downloaded / totalSize) * 100);
            setDownloadProgress({
              fileId: file.id,
              fileName: file.originalName,
              progress: percent,
              totalSize,
              downloaded,
            });
          }

          await writable.close();
          console.log(`[Download] ✅ Complete: ${file.originalName}`);
          setDownloadProgress(null);
          downloadAbortRef.current = null;
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('[Download] Cancelled');
            setDownloadProgress(null);
            downloadAbortRef.current = null;
            return;
          }
          console.warn('[Download] File System Access failed, falling back:', err.message);
        }
      }

      // Fallback for unsupported browsers
      const response = await filesApi.downloadFile(file.id, { signal });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadProgress(null);
      downloadAbortRef.current = null;
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        console.log('[Download] Cancelled');
      } else {
        console.error('Download failed:', error);
      }
      setDownloadProgress(null);
    } finally {
      downloadAbortRef.current = null;
    }
  };

  const handleStopDownload = () => {
    downloadAbortRef.current?.abort();
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

  // HUD mode layout
  if (isHUD) {
    return (
      <div
        className="h-full min-h-0 flex flex-col"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <HUDAppLayout
          title="FILE MANAGER"
          searchPlaceholder="Search files..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          actions={
            <>
              <button
                type="button"
                onClick={() => setShowNewFolder(true)}
                className="hud-btn px-3 py-1.5 text-xs"
              >
                NEW FOLDER
              </button>
              <button
                type="button"
                onClick={() => setShowUploader(true)}
                className="hud-btn hud-btn-primary px-3 py-1.5 text-xs"
              >
                UPLOAD
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'rgba(0,255,255,0.8)' }}>
              {breadcrumb.map((item, index) => (
                <span key={item.id || 'root'} className="flex items-center gap-1.5">
                  {index > 0 && <span style={{ color: 'rgba(0,255,255,0.4)' }}>&gt;</span>}
                  <button
                    type="button"
                    onClick={() => navigateToFolder(item.id, item.name)}
                    className="hover:underline"
                  >
                    {index === 0 ? 'ROOT' : item.name.toUpperCase()}
                  </button>
                </span>
              ))}
            </nav>

            {/* Filter */}
            {filterType && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider" style={{ color: 'rgba(0,255,255,0.6)' }}>
                  FILTER:
                </span>
                <span className="hud-badge flex items-center gap-1">
                  {filterType.toUpperCase()}
                  <button
                    type="button"
                    onClick={() => { setFilterType(null); setSearchParams({}); }}
                    className="hover:opacity-80"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}

            {/* Folders */}
            {folders.length > 0 && !filterType && !debouncedSearch && (
              <div>
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,255,255,0.9)' }}>
                  FOLDERS
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {folders.map((folder) => (
                    <HUDCard key={folder.id} onClick={() => navigateToFolder(folder.id, folder.name)}>
                      <div className="p-3 flex items-center gap-2">
                        <Folder className="w-5 h-5 shrink-0" style={{ color: '#22d3ee' }} />
                        <span className="text-xs truncate" style={{ color: '#67e8f9' }}>{folder.name}</span>
                      </div>
                    </HUDCard>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            <HUDCard accent>
              <div className="p-4">
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(0,255,255,0.9)' }}>
                  {debouncedSearch ? 'SEARCH RESULTS' : filterType ? `${filterType.toUpperCase()} FILES` : 'FILES'}
                </h2>
                {files.length === 0 ? (
                  <div className="py-12 text-center border border-dashed" style={{ borderColor: 'rgba(0,255,255,0.2)' }}>
                    <File className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: '#22d3ee' }} />
                    <p className="text-xs tracking-widest mb-4" style={{ color: 'rgba(0,255,255,0.5)' }}>
                      NO FILES
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowUploader(true)}
                      className="hud-btn hud-btn-primary px-4 py-2 text-xs"
                    >
                      UPLOAD FILES
                    </button>
                  </div>
                ) : (
                  <HUDDataTable
                    columns={[
                      { key: 'name', header: 'NAME', render: (f) => <button type="button" onClick={() => setPreviewFile(f)} className="hover:underline text-left truncate max-w-[200px] block">{f.originalName}</button> },
                      { key: 'size', header: 'SIZE', render: (f) => formatFileSize(f.size) },
                      { key: 'date', header: 'DATE', render: (f) => formatDate(f.createdAt) },
                      {
                        key: 'actions',
                        header: '',
                        render: (f) => (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleDownload(f)} className="p-1 hover:bg-cyan-500/20" title="Download"><Download className="w-3 h-3" style={{ color: '#22d3ee' }} /></button>
                            <button type="button" onClick={() => setShareFile(f)} className="p-1 hover:bg-cyan-500/20" title="Share"><Share2 className="w-3 h-3" style={{ color: '#22d3ee' }} /></button>
                            <button type="button" onClick={() => handleStar(f)} className="p-1 hover:bg-cyan-500/20" title="Star"><Star className={`w-3 h-3 ${f.isStarred ? 'fill-current' : ''}`} style={{ color: f.isStarred ? '#fbbf24' : '#22d3ee' }} /></button>
                            <button type="button" onClick={() => handleDelete(f)} className="p-1 hover:bg-red-500/20" title="Delete"><Trash2 className="w-3 h-3" style={{ color: '#ef4444' }} /></button>
                          </div>
                        ),
                      },
                    ]}
                    data={files}
                    keyExtractor={(f) => f.id}
                    emptyMessage="NO FILES"
                  />
                )}
              </div>
            </HUDCard>
          </div>
        </HUDAppLayout>

        {/* Dialogs - reuse existing */}
        <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
          <DialogContent className="sm:max-w-md bg-[var(--hud-bg-secondary)] border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="rounded border-cyan-500/30 bg-cyan-500/5 text-cyan-200"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolder(false)} className="border-cyan-500/30 text-cyan-400">
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} className="bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent className="sm:max-w-xl bg-[var(--hud-bg-secondary)] border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Upload Files</DialogTitle>
            </DialogHeader>
            <FileUploader onUpload={(files) => { handleUpload(files); setShowUploader(false); }} />
          </DialogContent>
        </Dialog>
        {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
        {shareFile && <ShareDialog open={!!shareFile} file={shareFile} onClose={() => setShareFile(null)} />}
        <DirectUploadQueue />
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-cyan-500/20 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.p className="text-xl font-bold tracking-widest" style={{ color: '#22d3ee' }}>
                DROP TO UPLOAD
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

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
                    className={`px-2 py-1 rounded-lg hover:bg-white transition-colors flex items-center gap-1 ${index === breadcrumb.length - 1
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
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                  ? 'bg-cyan-100 text-cyan-600'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
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

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedFiles.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={clearSelection}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="font-medium">{selectedFiles.size} selected</span>
                <button
                  onClick={selectAllFiles}
                  className="text-sm underline hover:no-underline"
                >
                  {selectedFiles.size === files.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDownload}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkStar(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Star
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    loadFolderTree();
                    setShowMoveDialog(true);
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <FolderInput className="w-4 h-4 mr-2" />
                  Move
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-white hover:bg-red-500/50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    {(folder._count?.files || 0) + (folder._count?.children || 0)} items
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
                  onClick={() => toggleFileSelection(file.id)}
                  className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all group cursor-pointer relative ${selectedFiles.has(file.id) ? 'ring-2 ring-cyan-500 bg-cyan-50' : ''
                    }`}
                >
                  {/* Selection checkbox */}
                  <div
                    className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedFiles.has(file.id)
                      ? 'bg-cyan-500 border-cyan-500'
                      : 'border-gray-300 opacity-0 group-hover:opacity-100'
                      }`}
                  >
                    {selectedFiles.has(file.id) && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-lg"
                      >
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
                    <th className="w-12 py-4 px-4">
                      <button
                        onClick={selectAllFiles}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedFiles.size === files.length && files.length > 0
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-gray-300'
                          }`}
                      >
                        {selectedFiles.size === files.length && files.length > 0 && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </th>
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
                      onClick={() => toggleFileSelection(file.id)}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${selectedFiles.has(file.id) ? 'bg-cyan-50' : ''
                        }`}
                    >
                      <td className="py-4 px-4">
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedFiles.has(file.id)
                            ? 'bg-cyan-500 border-cyan-500'
                            : 'border-gray-300'
                            }`}
                        >
                          {selectedFiles.has(file.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </td>
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
                      <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
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

      {/* Move Files Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>Move {selectedFiles.size} file(s) to...</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-64 overflow-y-auto">
            <button
              onClick={() => handleBulkMove(null)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-xl flex items-center gap-3 transition-colors"
            >
              <Home className="w-5 h-5 text-gray-500" />
              <span className="font-medium">My Files (Root)</span>
            </button>
            {folderTree.map((folder: FolderType) => (
              <button
                key={folder.id}
                onClick={() => handleBulkMove(folder.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-xl flex items-center gap-3 transition-colors"
              >
                <Folder className="w-5 h-5" style={{ color: folder.color || '#6b7280' }} />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
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

      {/* Direct Upload Queue - Browser to Telegram */}
      <DirectUploadQueue />

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

      {/* Download Progress Indicator */}
      <AnimatePresence>
        {downloadProgress && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl p-4 min-w-[320px]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">
                  {downloadProgress.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {(downloadProgress.downloaded / 1024 / 1024).toFixed(1)} MB / {(downloadProgress.totalSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <span className="text-lg font-bold text-cyan-600">
                {downloadProgress.progress}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                onClick={handleStopDownload}
                title="Stop download"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${downloadProgress.progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
