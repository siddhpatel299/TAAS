import { useState, useEffect, useCallback } from 'react';
import { Star, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { RecentFiles } from '@/components/dashboard/RecentFiles';
import { FilePreview } from '@/components/FilePreview';
import { ShareDialog } from '@/components/ShareDialog';
import { UploadQueue } from '@/components/UploadQueue';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi } from '@/lib/api';

export function StarredPage() {
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
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [shareFile, setShareFile] = useState<StoredFile | null>(null);

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
        starred: true, 
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
    <div className="min-h-screen bg-[#f0f5fa] flex">
      {/* Sidebar */}
      <ModernSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-20 p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-gray-900"
              >
                Starred Files
              </motion.h1>
              <p className="text-gray-500 mt-1">
                Your favorite files for quick access
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search starred files..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-12 pr-4 py-3 w-80 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"
            >
              <Star className="w-6 h-6 text-white" />
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-6">
                <Star className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">No starred files</h3>
              <p className="text-gray-500 max-w-sm">
                Star important files to find them quickly here
              </p>
            </div>
          </motion.div>
        )}

        {/* Files List */}
        {!isLoading && files.length > 0 && (
          <RecentFiles
            files={files}
            onDownload={handleDownload}
            onShare={(file) => setShareFile(file)}
            onStar={handleStar}
            onDelete={handleDelete}
            onPreview={(file) => setPreviewFile(file)}
          />
        )}
      </main>

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
    </div>
  );
}
