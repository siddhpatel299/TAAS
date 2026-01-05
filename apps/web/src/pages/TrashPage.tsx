import { useState, useEffect, useCallback } from 'react';
import { Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileCard } from '@/components/FileCard';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { UploadQueue } from '@/components/UploadQueue';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export function TrashPage() {
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
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        filesApi.getFiles({ trash: true, sortBy, sortOrder, search: searchQuery || undefined }),
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

  const handleRestore = async (file: StoredFile) => {
    try {
      await filesApi.restoreFile(file.id);
      loadContent();
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  const handleDelete = async (file: StoredFile) => {
    if (!confirm('This will permanently delete the file. Continue?')) return;
    
    try {
      await filesApi.deleteFile(file.id, true);
      loadContent();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await filesApi.emptyTrash();
      setShowEmptyConfirm(false);
      loadContent();
    } catch (error) {
      console.error('Empty trash failed:', error);
    }
  };

  return (
    <div className="h-screen flex bg-background relative overflow-hidden">
      {/* Floating background orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
      
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Trash</h1>
            </div>
            {files.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowEmptyConfirm(true)}
                className="shadow-lg shadow-red-500/30"
              >
                Empty Trash
              </Button>
            )}
          </motion.div>

          {files.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-subtle rounded-2xl p-4 mb-6 flex items-center gap-3 border border-amber-500/30"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-foreground/80">
                Items in trash will be permanently deleted after 30 days
              </p>
            </motion.div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          )}

          {!isLoading && files.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="glass-strong rounded-3xl p-12 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-400/20 to-rose-500/20 flex items-center justify-center mb-6">
                  <Trash2 className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Trash is empty</h3>
                <p className="text-muted-foreground max-w-sm">
                  Files you delete will appear here
                </p>
              </div>
            </motion.div>
          )}

          {!isLoading && files.length > 0 && (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                  : 'space-y-2'
              )}
            >
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FileCard
                    file={file}
                    viewMode={viewMode}
                    isSelected={selectedFiles.has(file.id)}
                    onSelect={() => toggleFileSelection(file.id)}
                    onDownload={() => handleDownload(file)}
                    onStar={() => {}}
                    onDelete={() => handleDelete(file)}
                    onRename={() => {}}
                    onMove={() => {}}
                    onRestore={() => handleRestore(file)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      <UploadQueue />

      {/* Empty trash confirmation */}
      <Dialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Empty Trash?</DialogTitle>
            <DialogDescription>
              This will permanently delete all {files.length} items in trash.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmptyConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEmptyTrash}>
              Empty Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
