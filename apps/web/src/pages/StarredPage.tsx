import { useState, useEffect, useCallback } from 'react';
import { Star, RefreshCw } from 'lucide-react';
import { FileCard } from '@/components/FileCard';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { UploadQueue } from '@/components/UploadQueue';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export function StarredPage() {
  const {
    files,
    viewMode,
    searchQuery,
    sortBy,
    sortOrder,
    selectedFiles,
    isLoading,
    setFiles,
    toggleFileSelection,
    setLoading,
  } = useFilesStore();

  const [storageUsed, setStorageUsed] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        filesApi.getFiles({ starred: true, sortBy, sortOrder, search: searchQuery || undefined }),
        filesApi.getStats(),
      ]);

      setFiles(filesRes.data.data);
      setStorageUsed(statsRes.data.data.totalUsed);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

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

  return (
    <div className="h-screen flex bg-background">
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 transform transition-transform md:relative md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar
          storageUsed={storageUsed}
          onNewFolder={() => {}}
          onUpload={() => {}}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h1 className="text-2xl font-bold">Starred Files</h1>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Star className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No starred files</h3>
              <p className="text-muted-foreground">
                Star important files to find them quickly here
              </p>
            </div>
          )}

          {!isLoading && files.length > 0 && (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                  : 'space-y-2'
              )}
            >
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  viewMode={viewMode}
                  isSelected={selectedFiles.has(file.id)}
                  onSelect={() => toggleFileSelection(file.id)}
                  onDownload={() => handleDownload(file)}
                  onStar={() => handleStar(file)}
                  onDelete={() => handleDelete(file)}
                  onRename={() => {}}
                  onMove={() => {}}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <UploadQueue />
    </div>
  );
}
