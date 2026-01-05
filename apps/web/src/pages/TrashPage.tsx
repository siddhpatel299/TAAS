import { useState, useEffect, useCallback } from 'react';
import { Trash2, AlertTriangle, Search, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { UploadQueue } from '@/components/UploadQueue';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

export function TrashPage() {
  const {
    files,
    searchQuery,
    sortBy,
    sortOrder,
    setFiles,
    setLoading,
    setSearchQuery,
    isLoading,
  } = useFilesStore();

  const [localSearch, setLocalSearch] = useState('');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const filesRes = await filesApi.getFiles({ 
        trash: true, 
        sortBy, 
        sortOrder, 
        search: searchQuery || undefined 
      });
      setFiles(filesRes.data.data);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, searchQuery, setFiles, setLoading]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  };

  return (
    <div className="min-h-screen bg-[#f0f5fa] flex">
      {/* Sidebar */}
      <ModernSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-20 p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-gray-900"
              >
                Trash
              </motion.h1>
              <p className="text-gray-500 mt-1">
                {files.length} items • Items are permanently deleted after 30 days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search trash..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-12 pr-4 py-3 w-80 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Empty Trash Button */}
            {files.length > 0 && (
              <Button
                onClick={() => setShowEmptyConfirm(true)}
                className="bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600"
              >
                Empty Trash
              </Button>
            )}
          </div>
        </header>

        {/* Warning Banner */}
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-amber-800">
              Items in trash will be permanently deleted after 30 days. You can restore items before they are deleted.
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"
            >
              <Trash2 className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && files.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="bg-white rounded-3xl p-12 shadow-sm flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                <Trash2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Trash is empty</h3>
              <p className="text-gray-500 max-w-sm">
                Files you delete will appear here
              </p>
            </div>
          </motion.div>
        )}

        {/* Files List */}
        {!isLoading && files.length > 0 && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 text-sm font-medium text-gray-500">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Deleted</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Body */}
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                {/* File Name */}
                <div className="col-span-5 flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.originalName}</p>
                    <p className="text-xs text-gray-500">{file.mimeType.split('/')[1]?.toUpperCase()}</p>
                  </div>
                </div>

                {/* Size */}
                <div className="col-span-2 text-sm text-gray-600">
                  {formatFileSize(file.size)}
                </div>

                {/* Deleted Date */}
                <div className="col-span-3 text-sm text-gray-600">
                  {formatDate(file.updatedAt)}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(file)}
                    className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <UploadQueue />

      {/* Empty trash confirmation */}
      <Dialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
        <DialogContent className="bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Empty Trash?</DialogTitle>
            <DialogDescription className="text-gray-500">
              This will permanently delete all {files.length} items in trash.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmptyConfirm(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleEmptyTrash}
              className="bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl"
            >
              Empty Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
