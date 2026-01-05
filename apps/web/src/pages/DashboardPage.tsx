import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Home,
  FolderPlus,
  RefreshCw,
  FileX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileUploader } from '@/components/FileUploader';
import { FileCard } from '@/components/FileCard';
import { FolderCard } from '@/components/FolderCard';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { UploadQueue } from '@/components/UploadQueue';
import { FilePreview } from '@/components/FilePreview';
import { ShareDialog } from '@/components/ShareDialog';
import { VersionHistoryDialog } from '@/components/VersionHistoryDialog';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { useFilesStore, StoredFile, Folder } from '@/stores/files.store';
import { filesApi, foldersApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folder') || undefined;
  
  const {
    files,
    folders,
    breadcrumb,
    viewMode,
    searchQuery,
    sortBy,
    sortOrder,
    selectedFiles,
    isLoading,
    setFiles,
    setFolders,
    setCurrentFolder,
    toggleFileSelection,
    clearSelection,
    addUpload,
    updateUpload,
    setLoading,
  } = useFilesStore();

  const [storageUsed, setStorageUsed] = useState(0);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameDialog, setRenameDialog] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [shareFile, setShareFile] = useState<StoredFile | null>(null);
  const [versionFile, setVersionFile] = useState<StoredFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

      // Load breadcrumb if in folder
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
  const handleUpload = async (files: File[]) => {
    for (const file of files) {
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

  // Handle file operations
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

  const handleRename = async () => {
    if (!renameDialog) return;
    
    try {
      if (renameDialog.type === 'file') {
        await filesApi.renameFile(renameDialog.id, renameDialog.name);
      } else {
        await foldersApi.renameFolder(renameDialog.id, renameDialog.name);
      }
      setRenameDialog(null);
      loadContent();
    } catch (error) {
      console.error('Rename failed:', error);
    }
  };

  // Create folder
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

  // Navigate to folder
  const navigateToFolder = (id?: string) => {
    if (id) {
      setSearchParams({ folder: id });
    } else {
      setSearchParams({});
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Delete folder "${folder.name}" and all its contents?`)) return;
    
    try {
      await foldersApi.deleteFolder(folder.id);
      loadContent();
    } catch (error) {
      console.error('Delete folder failed:', error);
    }
  };

  const isEmpty = files.length === 0 && folders.length === 0;

  // Global drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the window
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleUpload(droppedFiles);
    }
  }, [handleUpload]);

  return (
    <div 
      className="h-screen flex bg-background"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 transform transition-transform md:relative md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar
          storageUsed={storageUsed}
          onNewFolder={() => setShowNewFolder(true)}
          onUpload={() => setShowUploader(true)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => navigateToFolder()}
            >
              <Home className="w-4 h-4" />
            </Button>
            {breadcrumb.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 shrink-0">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToFolder(item.id)}
                  className={cn(
                    index === breadcrumb.length - 1 && 'font-medium'
                  )}
                >
                  {item.name}
                </Button>
              </div>
            ))}
          </div>

          {/* Upload area (when showing) */}
          <AnimatePresence>
            {showUploader && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <FileUploader onUpload={handleUpload} className="min-h-[200px]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && isEmpty && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileX className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No files yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload files or create a folder to get started
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setShowUploader(true)}>
                  Upload Files
                </Button>
                <Button variant="outline" onClick={() => setShowNewFolder(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </div>
            </div>
          )}

          {/* Files and folders grid/list */}
          {!isLoading && !isEmpty && (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                  : 'space-y-2'
              )}
            >
              {/* Folders first */}
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  viewMode={viewMode}
                  onOpen={() => navigateToFolder(folder.id)}
                  onRename={() => setRenameDialog({ type: 'folder', id: folder.id, name: folder.name })}
                  onMove={() => {}}
                  onDelete={() => handleDeleteFolder(folder)}
                />
              ))}

              {/* Files */}
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  viewMode={viewMode}
                  isSelected={selectedFiles.has(file.id)}
                  selectionMode={selectedFiles.size > 0}
                  onSelect={() => toggleFileSelection(file.id)}
                  onDownload={() => handleDownload(file)}
                  onStar={() => handleStar(file)}
                  onDelete={() => handleDelete(file)}
                  onRename={() => setRenameDialog({ type: 'file', id: file.id, name: file.name })}
                  onMove={() => {}}
                  onShare={() => setShareFile(file)}
                  onPreview={() => setPreviewFile(file)}
                  onVersions={() => setVersionFile(file)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Upload queue */}
      <UploadQueue />

      {/* New folder dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameDialog?.type}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="New name"
              value={renameDialog?.name || ''}
              onChange={(e) =>
                setRenameDialog((prev) => prev ? { ...prev, name: e.target.value } : null)
              }
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File preview modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          files={files}
          onClose={() => setPreviewFile(null)}
          onNavigate={(file) => setPreviewFile(file)}
        />
      )}

      {/* Share dialog */}
      <ShareDialog
        open={!!shareFile}
        onClose={() => setShareFile(null)}
        file={shareFile}
      />

      {/* Version history dialog */}
      <VersionHistoryDialog
        open={!!versionFile}
        onClose={() => setVersionFile(null)}
        file={versionFile}
        onRestore={loadContent}
      />

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedIds={Array.from(selectedFiles)}
        onClearSelection={clearSelection}
        onSuccess={loadContent}
      />

      {/* Global drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-500/10 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white rounded-xl shadow-xl p-8 text-center">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-lg font-medium">Drop files to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
