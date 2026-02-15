import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  FileText,
  Image,
  Video,
  File as FileIcon,
  Folder,
  FolderOpen,
  ChevronRight,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { filesApi, foldersApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TaasFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface TaasFolder {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { files: number; children: number };
}

interface FilePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: TaasFile) => void;
  title?: string;
  filterMimeType?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return FileIcon;
}

export function FilePickerDialog({ 
  isOpen, 
  onClose, 
  onSelect,
  title = 'Select a File',
  filterMimeType,
}: FilePickerDialogProps) {
  const [files, setFiles] = useState<TaasFile[]>([]);
  const [folders, setFolders] = useState<TaasFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<TaasFile | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentFolderId(null);
    setBreadcrumb([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    const folderId = currentFolderId;
    Promise.all([
      filesApi.getFiles({
        ...(folderId ? { folderId } : { rootOnly: true }),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 100,
      }),
      foldersApi.getFolders(folderId ?? undefined),
    ])
      .then(([filesRes, foldersRes]) => {
        if (cancelled) return;
        setFiles(filesRes.data.data || []);
        setFolders(foldersRes.data.data || []);
      })
      .catch((error) => {
        if (!cancelled) console.error('Failed to load files/folders:', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, currentFolderId]);

  const handleFolderClick = (folder: TaasFolder) => {
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setBreadcrumb([]);
    } else {
      setBreadcrumb((prev) => prev.slice(0, index + 1));
      setCurrentFolderId(breadcrumb[index].id);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchQuery || 
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMimeType = !filterMimeType || 
      file.mimeType.includes(filterMimeType);
    return matchesSearch && matchesMimeType;
  });

  const filteredFolders = folders.filter(folder =>
    !searchQuery || folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      setSelectedFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="px-6 py-2 border-b border-gray-100">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleBreadcrumbClick(-1)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <FolderOpen className="w-4 h-4" />
                Root
              </button>
              {breadcrumb.map((item, i) => (
                <div key={item.id} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => handleBreadcrumbClick(i)}
                    className="px-2 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 truncate max-w-[120px]"
                    title={item.name}
                  >
                    {item.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Folders & File List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              </div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No files or folders found</p>
                <p className="text-sm">Upload files to TAAS or create folders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleFolderClick(folder)}
                    className="flex items-center gap-4 p-4 rounded-xl text-left transition-all bg-amber-50 border-2 border-transparent hover:bg-amber-100 hover:border-amber-200"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100">
                      <Folder className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                      <p className="text-sm text-gray-500">
                        {folder._count?.files ?? 0} files
                        {(folder._count?.children ?? 0) > 0 && ` • ${folder._count?.children ?? 0} folders`}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
                {filteredFiles.map((file) => {
                  const IconComponent = getFileIcon(file.mimeType);
                  const isSelected = selectedFile?.id === file.id;

                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setSelectedFile(file)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl text-left transition-all",
                        isSelected
                          ? "bg-sky-50 border-2 border-sky-500 ring-2 ring-sky-100"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isSelected ? "bg-sky-100" : "bg-gray-200"
                      )}>
                        <IconComponent className={cn(
                          "w-5 h-5",
                          isSelected ? "text-sky-600" : "text-gray-500"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          isSelected ? "text-sky-900" : "text-gray-900"
                        )}>
                          {file.originalName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-sky-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedFile}
              className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select File
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
