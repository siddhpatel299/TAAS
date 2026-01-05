import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  Filter, 
  FileText, 
  Image, 
  Video, 
  Archive,
  MoreHorizontal,
  Download,
  Share2,
  Star,
  Trash2,
  Eye,
} from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { StoredFile } from '@/stores/files.store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface RecentFilesProps {
  files: StoredFile[];
  onDownload?: (file: StoredFile) => void;
  onShare?: (file: StoredFile) => void;
  onStar?: (file: StoredFile) => void;
  onDelete?: (file: StoredFile) => void;
  onPreview?: (file: StoredFile) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return { icon: Image, color: 'text-blue-500', bg: 'bg-blue-100' };
  if (mimeType.startsWith('video/')) return { icon: Video, color: 'text-cyan-500', bg: 'bg-cyan-100' };
  if (mimeType.includes('pdf') || mimeType.includes('document')) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-100' };
  if (mimeType.includes('zip') || mimeType.includes('archive')) return { icon: Archive, color: 'text-orange-500', bg: 'bg-orange-100' };
  return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' };
};

export function RecentFiles({
  files,
  onDownload,
  onShare,
  onStar,
  onDelete,
  onPreview,
  onSelectionChange,
}: RecentFilesProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [sortField] = useState<'name' | 'size' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(files.map(f => f.id));
      setSelectedFiles(allIds);
      onSelectionChange?.(Array.from(allIds));
    }
  };

  // Sort files
  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="bg-white rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Recent files</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowUpDown className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Filter className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-500">
        <div className="col-span-1 flex items-center">
          <Checkbox 
            checked={selectedFiles.size === files.length && files.length > 0}
            onCheckedChange={toggleSelectAll}
          />
        </div>
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Shared</div>
        <div className="col-span-2">Latest changes</div>
      </div>

      {/* File Rows */}
      <div className="divide-y divide-gray-50">
        <AnimatePresence>
          {sortedFiles.map((file, index) => {
            const fileType = getFileIcon(file.mimeType);
            const Icon = fileType.icon;
            const isSelected = selectedFiles.has(file.id);

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
                className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group ${
                  isSelected ? 'bg-cyan-50' : ''
                }`}
              >
                {/* Checkbox */}
                <div className="col-span-1 flex items-center">
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(file.id)}
                  />
                </div>

                {/* Name */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`w-10 h-10 ${fileType.bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${fileType.color}`} />
                  </div>
                  <span className="font-medium text-gray-900 truncate">
                    {file.originalName}
                  </span>
                  {file.isStarred && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>

                {/* Size */}
                <div className="col-span-2 flex items-center text-gray-600">
                  {formatFileSize(file.size)}
                </div>

                {/* Shared */}
                <div className="col-span-2 flex items-center text-gray-600">
                  Me
                </div>

                {/* Date */}
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-gray-600">
                    {formatDate(file.createdAt)}
                  </span>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onPreview?.(file)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload?.(file)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onShare?.(file)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStar?.(file)}>
                        <Star className="w-4 h-4 mr-2" />
                        {file.isStarred ? 'Unstar' : 'Star'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(file)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {files.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No files yet</p>
            <p className="text-sm mt-1">Upload your first file to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
