import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { ActionBar } from '@/components/dashboard/ActionBar';
import { FolderCategories, defaultCategories } from '@/components/dashboard/FolderCategories';
import { RecentFiles } from '@/components/dashboard/RecentFiles';
import { StorageWidget } from '@/components/dashboard/StorageWidget';
import { FileUploader } from '@/components/FileUploader';
import { FilePreview } from '@/components/FilePreview';
import { ShareDialog } from '@/components/ShareDialog';
import { UploadQueue } from '@/components/UploadQueue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { useAuthStore } from '@/stores/auth.store';
import { filesApi, foldersApi } from '@/lib/api';

export function ModernDashboardPage() {
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folder') || undefined;
  const { user } = useAuthStore();

  const {
    files,
    searchQuery,
    sortBy,
    sortOrder,
    setFiles,
    setFolders,
    setCurrentFolder,
    addUpload,
    updateUpload,
    setLoading,
    setSearchQuery,
  } = useFilesStore();

  const [storageUsed, setStorageUsed] = useState(0);
  const [showUploader, setShowUploader] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [shareFile, setShareFile] = useState<StoredFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);

  // Load files and folders
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes, statsRes] = await Promise.all([
        filesApi.getFiles({ folderId, sortBy, sortOrder, search: searchQuery || undefined }),
        foldersApi.getFolders(folderId),
        filesApi.getStats(),
      ]);

      setFiles(filesRes.data.data);
      setFolders(foldersRes.data.data);
      setStorageUsed(statsRes.data.data.totalUsed);

      // Calculate categories from files
      const allFiles = filesRes.data.data as StoredFile[];
      const videoFiles = allFiles.filter(f => f.mimeType.startsWith('video/'));
      const photoFiles = allFiles.filter(f => f.mimeType.startsWith('image/'));
      const docFiles = allFiles.filter(f => 
        f.mimeType.includes('pdf') || 
        f.mimeType.includes('document') || 
        f.mimeType.includes('text')
      );
      const otherFiles = allFiles.filter(f => 
        !f.mimeType.startsWith('video/') && 
        !f.mimeType.startsWith('image/') &&
        !f.mimeType.includes('pdf') &&
        !f.mimeType.includes('document')
      );

      setCategories([
        { type: 'video', itemCount: videoFiles.length, size: videoFiles.reduce((sum, f) => sum + f.size, 0) },
        { type: 'document', itemCount: docFiles.length, size: docFiles.reduce((sum, f) => sum + f.size, 0) },
        { type: 'photo', itemCount: photoFiles.length, size: photoFiles.reduce((sum, f) => sum + f.size, 0) },
        { type: 'other', itemCount: otherFiles.length, size: otherFiles.reduce((sum, f) => sum + f.size, 0) },
      ]);

      if (folderId) {
        const folderRes = await foldersApi.getFolder(folderId);
        setCurrentFolder(folderId, folderRes.data.data.breadcrumb);
      } else {
        setCurrentFolder(null, []);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }, [folderId, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Handle file upload
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
        await filesApi.uploadFile(file, folderId, (progress) => {
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

  // File operations
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await foldersApi.createFolder(newFolderName, folderId);
      setShowNewFolder(false);
      setNewFolderName('');
      loadContent();
    } catch (error) {
      console.error('Create folder failed:', error);
    }
  };

  // Drag and drop handlers
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
  }, [handleUpload]);

  const userName = user?.firstName || user?.username || 'User';

  return (
    <div
      className="min-h-screen bg-[#f0f5fa] flex"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Sidebar */}
      <ModernSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-20 p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900"
            >
              Welcome to TAAS
            </motion.h1>
            <p className="text-gray-500 mt-1">
              Hello {userName}! Manage your files stored on Telegram.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
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

            {/* Notifications */}
            <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">Premium</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Action Bar */}
        <ActionBar
          onUpload={() => setShowUploader(true)}
          onCreateFolder={() => setShowNewFolder(true)}
        />

        {/* Folder Categories */}
        <FolderCategories categories={categories} />

        {/* Recent Files */}
        <RecentFiles
          files={files}
          onDownload={handleDownload}
          onShare={(file) => setShareFile(file)}
          onStar={handleStar}
          onDelete={handleDelete}
          onPreview={(file) => setPreviewFile(file)}
        />
      </main>

      {/* Right Sidebar - Storage Widget */}
      <aside className="hidden xl:block w-80 p-6">
        <StorageWidget
          totalUsed={storageUsed}
          byType={{
            video: categories[0]?.size || 0,
            document: categories[1]?.size || 0,
            photo: categories[2]?.size || 0,
            other: categories[3]?.size || 0,
          }}
        />
      </aside>

      {/* Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="sm:max-w-xl bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Files</DialogTitle>
          </DialogHeader>
          <FileUploader onUpload={handleUpload} />
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName">Folder name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-2 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFolder}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl"
            >
              Create
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
                  📁
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
