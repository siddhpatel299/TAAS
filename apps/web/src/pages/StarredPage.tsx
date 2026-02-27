import { useState, useEffect, useCallback } from 'react';
import { Star, Search, Download, Share2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { RecentFiles } from '@/components/dashboard/RecentFiles';
import { FilePreview } from '@/components/FilePreview';
import { ShareDialog } from '@/components/ShareDialog';
import { UploadQueue } from '@/components/UploadQueue';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { filesApi } from '@/lib/api';
import { useOSStore } from '@/stores/os.store';
import { HUDAppLayout, HUDCard, HUDDataTable } from '@/components/hud';
import { formatFileSize, formatDate } from '@/lib/utils';

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

  const osStyle = useOSStore((s) => s.osStyle);
  const isHUD = osStyle === 'hud';

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

  // HUD mode layout
  if (isHUD) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <HUDAppLayout
          title="STARRED FILES"
          searchPlaceholder="Search starred files..."
          searchValue={localSearch}
          onSearchChange={setLocalSearch}
        >
          <div className="space-y-4">
            <HUDCard accent>
              <div className="p-4">
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(0,255,255,0.9)' }}>
                  FILES
                </h2>
                {isLoading ? (
                  <div className="py-12 text-center text-xs tracking-widest" style={{ color: 'rgba(0,255,255,0.5)' }}>
                    LOADING...
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-12 text-center border border-dashed" style={{ borderColor: 'rgba(0,255,255,0.2)' }}>
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: '#22d3ee' }} />
                    <p className="text-xs tracking-widest mb-4" style={{ color: 'rgba(0,255,255,0.5)' }}>
                      NO STARRED FILES
                    </p>
                  </div>
                ) : (
                  <HUDDataTable
                    columns={[
                      {
                        key: 'name',
                        header: 'NAME',
                        render: (f) => (
                          <button
                            type="button"
                            onClick={() => setPreviewFile(f)}
                            className="hover:underline text-left truncate max-w-[200px] block"
                          >
                            {f.originalName}
                          </button>
                        ),
                      },
                      { key: 'size', header: 'SIZE', render: (f) => formatFileSize(f.size) },
                      { key: 'date', header: 'DATE', render: (f) => formatDate(f.createdAt) },
                      {
                        key: 'actions',
                        header: '',
                        render: (f) => (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownload(f)}
                              className="p-1 hover:bg-cyan-500/20"
                              title="Download"
                            >
                              <Download className="w-3 h-3" style={{ color: '#22d3ee' }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShareFile(f)}
                              className="p-1 hover:bg-cyan-500/20"
                              title="Share"
                            >
                              <Share2 className="w-3 h-3" style={{ color: '#22d3ee' }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStar(f)}
                              className="p-1 hover:bg-cyan-500/20"
                              title="Unstar"
                            >
                              <Star className="w-3 h-3 fill-current" style={{ color: '#fbbf24' }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(f)}
                              className="p-1 hover:bg-red-500/20"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" style={{ color: '#ef4444' }} />
                            </button>
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
        {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
        {shareFile && <ShareDialog open={!!shareFile} file={shareFile} onClose={() => setShareFile(null)} />}
        <UploadQueue />
      </div>
    );
  }

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
