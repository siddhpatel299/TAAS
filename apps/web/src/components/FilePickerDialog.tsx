import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  FileText,
  Image,
  Video,
  File as FileIcon,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { filesApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TaasFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<TaasFile | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await filesApi.getFiles({ 
        sortBy: 'createdAt', 
        sortOrder: 'desc',
        limit: 100,
      });
      setFiles(response.data.data || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchQuery || 
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMimeType = !filterMimeType || 
      file.mimeType.includes(filterMimeType);
    return matchesSearch && matchesMimeType;
  });

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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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

          {/* File List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No files found</p>
                <p className="text-sm">Upload files to TAAS to attach them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredFiles.map((file) => {
                  const IconComponent = getFileIcon(file.mimeType);
                  const isSelected = selectedFile?.id === file.id;

                  return (
                    <button
                      key={file.id}
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
