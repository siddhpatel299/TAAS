import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  ChevronDown,
  Upload,
  FolderPlus,
  Menu,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { FolderCategories, defaultCategories } from '@/components/dashboard/FolderCategories';
import { RecentFiles } from '@/components/dashboard/RecentFiles';
import { StorageWidget } from '@/components/dashboard/StorageWidget';
import { QuickStatsWidget } from '@/components/dashboard/QuickStatsWidget';
import { ActivityWidget, ActivityItem } from '@/components/dashboard/ActivityWidget';
import { StarredFilesWidget } from '@/components/dashboard/StarredFilesWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { FileUploader } from '@/components/FileUploader';
import { FilePreview } from '@/components/FilePreview';
import { ShareDialog } from '@/components/ShareDialog';
import { UploadQueue } from '@/components/UploadQueue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFilesStore, StoredFile } from '@/stores/files.store';
import { useAuthStore } from '@/stores/auth.store';
import { filesApi, foldersApi } from '@/lib/api';

export function ModernDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    files,
    setFiles,
    addUpload,
    updateUpload,
    setLoading,
  } = useFilesStore();

  const [storageUsed, setStorageUsed] = useState(0);
  const [showUploader, setShowUploader] = useState(false);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [shareFile, setShareFile] = useState<StoredFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [localSearch, setLocalSearch] = useState('');
  const [starredFiles, setStarredFiles] = useState<StoredFile[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [quickStats, setQuickStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    starredFiles: 0,
    recentUploads: 0,
    images: 0,
    videos: 0,
    documents: 0,
    audio: 0,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load recent files and stats
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, statsRes, starredRes, foldersRes] = await Promise.all([
        filesApi.getFiles({ sortBy: 'createdAt', sortOrder: 'desc', limit: 10 }),
        filesApi.getStats(),
        filesApi.getFiles({ starred: true, limit: 10 }),
        foldersApi.getFolders(),
      ]);

      const allFiles = filesRes.data.data as StoredFile[];
      const folderCount = foldersRes.data.data.length;
      setFiles(allFiles);
      setStorageUsed(statsRes.data.data.totalUsed);
      setStarredFiles(starredRes.data.data as StoredFile[]);

      // Use server-side calculated categories
      const stats = statsRes.data.data;
      const categories = stats.categories || {
        video: { count: 0, size: 0 },
        photo: { count: 0, size: 0 },
        document: { count: 0, size: 0 },
        other: { count: 0, size: 0 },
      };

      setCategories([
        { type: 'video', itemCount: categories.video.count, size: categories.video.size },
        { type: 'document', itemCount: categories.document.count, size: categories.document.size },
        { type: 'photo', itemCount: categories.photo.count, size: categories.photo.size },
        { type: 'other', itemCount: categories.other.count, size: categories.other.size },
      ]);

      // Set quick stats
      const starredCount = (starredRes.data.data as StoredFile[]).length;
      const recentCount = allFiles.filter(f => {
        const uploadedAt = new Date(f.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return uploadedAt > dayAgo;
      }).length;

      setQuickStats({
        totalFiles: stats.totalFiles || 0,
        totalFolders: folderCount,
        starredFiles: starredCount,
        recentUploads: recentCount,
        images: categories.photo.count,
        videos: categories.video.count,
        documents: categories.document.count,
        audio: 0, // Audio is currently grouped in 'other' on the backend
      });

      // Generate activities from recent files
      const recentActivities: ActivityItem[] = allFiles.slice(0, 5).map(file => ({
        id: file.id,
        type: 'upload' as const,
        fileName: file.originalName,
        timestamp: new Date(file.createdAt),
      }));
      setActivities(recentActivities);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }, [setFiles, setLoading]);

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
        await filesApi.uploadFile(file, undefined, (progress) => {
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
  }, []);

  // Navigate to category
  const handleCategoryClick = (type: string) => {
    navigate(`/files?filter=${type}`);
  };

  const userName = user?.firstName || user?.username || 'User';

  return (
    <div
      className="min-h-screen bg-[#f0f5fa] flex"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Sidebar - Hidden on mobile, shown on md+ */}
      <div className="hidden md:block">
        <ModernSidebar />
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -100 }}
              animate={{ x: 0 }}
              exit={{ x: -100 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-20 z-50 md:hidden"
            >
              <ModernSidebar />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-[-48px] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-20 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-gray-900"
            >
              Welcome to TAAS
            </motion.h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Hello {userName}! Manage your files stored on Telegram.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search - redirects to My Files */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search files..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && localSearch.trim()) {
                    navigate(`/files?search=${encodeURIComponent(localSearch)}`);
                  }
                }}
                className="pl-12 pr-4 py-3 w-48 lg:w-80 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Notifications */}
            <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 shadow-sm">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-sm">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">Premium</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-medium text-sm sm:text-base">Upload Files</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/files')}
            className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 transition-all"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center">
              <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <span className="font-medium text-gray-700 text-sm sm:text-base">Manage Files</span>
          </motion.button>
        </div>

        {/* Categories (Insights) */}
        <FolderCategories
          categories={categories}
          onCategoryClick={handleCategoryClick}
        />

        {/* Recent Files */}
        <RecentFiles
          files={files}
          onDownload={handleDownload}
          onShare={(file) => setShareFile(file)}
          onStar={handleStar}
          onDelete={handleDelete}
          onPreview={(file) => setPreviewFile(file)}
        />

        {/* Dashboard Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Quick Stats Widget */}
          <QuickStatsWidget stats={quickStats} />

          {/* Quick Actions Widget */}
          <QuickActionsWidget onUpload={() => setShowUploader(true)} />
        </div>
      </main>

      {/* Right Sidebar - Widgets (visible on lg+) */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-6 w-72 xl:w-80 p-4 xl:p-6 overflow-y-auto max-h-screen flex-shrink-0">
        <StorageWidget
          totalUsed={storageUsed}
          byType={{
            video: categories[0]?.size || 0,
            document: categories[1]?.size || 0,
            photo: categories[2]?.size || 0,
            other: categories[3]?.size || 0,
          }}
        />

        <ActivityWidget
          activities={activities}
          onViewAll={() => navigate('/files')}
        />

        <StarredFilesWidget
          files={starredFiles.map(f => ({
            id: f.id,
            name: f.originalName,
            mimeType: f.mimeType,
            size: f.size,
          }))}
          onFileClick={(fileId) => {
            const file = starredFiles.find(f => f.id === fileId);
            if (file) setPreviewFile(file);
          }}
          onViewAll={() => navigate('/starred')}
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
