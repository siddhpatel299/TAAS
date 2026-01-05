import { useState } from 'react';
import {
  MoreVertical,
  Download,
  Star,
  StarOff,
  Trash2,
  FolderInput,
  Pencil,
  RotateCcw,
  FileIcon,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Link2,
  Eye,
  History,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatFileSize, formatDate, getFileType } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StoredFile } from '@/stores/files.store';

interface FileCardProps {
  file: StoredFile;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  selectionMode?: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onStar: () => void;
  onDelete: () => void;
  onRename: () => void;
  onMove: () => void;
  onRestore?: () => void;
  onShare?: () => void;
  onPreview?: () => void;
  onVersions?: () => void;
}

const fileTypeIcons = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  archive: Archive,
  other: FileIcon,
};

const fileTypeColors = {
  image: 'from-pink-500 to-rose-500',
  video: 'from-amber-500 to-orange-500',
  audio: 'from-green-500 to-emerald-500',
  document: 'from-blue-500 to-cyan-500',
  archive: 'from-amber-500 to-orange-500',
  other: 'from-gray-400 to-gray-500',
};

export function FileCard({
  file,
  viewMode,
  isSelected,
  selectionMode = false,
  onSelect,
  onDownload,
  onStar,
  onDelete,
  onRename,
  onMove,
  onRestore,
  onShare,
  onPreview,
  onVersions,
}: FileCardProps) {
  const [imageError, setImageError] = useState(false);
  const fileType = getFileType(file.mimeType);
  const Icon = fileTypeIcons[fileType];
  const colorClass = fileTypeColors[fileType];
  const isImage = fileType === 'image' && !imageError;
  const canPreview = ['image', 'video', 'audio', 'document'].includes(fileType);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className={cn(
          'flex items-center gap-4 p-4 glass-subtle rounded-xl transition-all cursor-pointer group',
          isSelected && 'ring-2 ring-amber-500 bg-amber-500/10'
        )}
        onClick={selectionMode ? onSelect : onPreview}
        onDoubleClick={onPreview}
      >
        {/* Selection checkbox */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer",
            isSelected 
              ? "bg-gold-gradient border-transparent" 
              : "border-foreground/20 hover:border-amber-500 bg-white/50 dark:bg-white/10"
          )}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          {isSelected && <Check className="w-4 h-4 text-[#0a0d14]" />}
        </motion.div>

        <div className="flex-shrink-0">
          {isImage ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/20">
              <img
                src={`/api/files/${file.id}/thumbnail`}
                alt={file.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className={cn(
              'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
              colorClass
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-foreground/90">{file.name}</p>
          <p className="text-sm text-foreground/50">
            {formatFileSize(file.size)} • {formatDate(file.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {file.isStarred && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </motion.div>
          )}
          <FileActions
            file={file}
            onDownload={onDownload}
            onStar={onStar}
            onDelete={onDelete}
            onRename={onRename}
            onMove={onMove}
            onRestore={onRestore}
            onShare={onShare}
            onPreview={onPreview}
            onVersions={onVersions}
            canPreview={canPreview}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative flex flex-col glass-subtle rounded-xl overflow-hidden transition-all cursor-pointer',
        'hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20',
        isSelected && 'ring-2 ring-amber-500'
      )}
      onClick={selectionMode ? onSelect : undefined}
      onDoubleClick={onPreview}
    >
      {/* Selection checkbox */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "absolute top-3 left-3 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer",
          isSelected 
            ? "bg-gold-gradient border-transparent" 
            : "border-white/50 bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        {isSelected && <Check className="w-4 h-4 text-[#0a0d14]" />}
      </motion.div>

      {/* Preview */}
      <div className="relative aspect-square bg-gradient-to-br from-foreground/5 to-foreground/10 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={`/api/files/${file.id}/thumbnail`}
            alt={file.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={cn(
            'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg',
            colorClass
          )}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 gap-2">
          {canPreview && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Button
                size="sm"
                className="h-10 px-4 rounded-xl bg-white/90 text-foreground hover:bg-white shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview?.();
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </motion.div>
          )}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              size="sm"
              className="h-10 w-10 rounded-xl bg-white/90 text-foreground hover:bg-white shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Star indicator */}
        {file.isStarred && (
          <div className="absolute top-3 right-12">
            <div className="w-8 h-8 rounded-lg bg-amber-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <FileActions
            file={file}
            onDownload={onDownload}
            onStar={onStar}
            onDelete={onDelete}
            onRename={onRename}
            onMove={onMove}
            onRestore={onRestore}
            onShare={onShare}
            onPreview={onPreview}
            onVersions={onVersions}
            canPreview={canPreview}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold truncate text-sm text-foreground/90">{file.name}</p>
        <p className="text-xs text-foreground/50 mt-1">
          {formatFileSize(file.size)}
        </p>
      </div>
    </motion.div>
  );
}

function FileActions({
  file,
  onDownload,
  onStar,
  onDelete,
  onRename,
  onMove,
  onRestore,
  onShare,
  onPreview,
  onVersions,
  canPreview,
}: {
  file: StoredFile;
  onDownload: () => void;
  onStar: () => void;
  onDelete: () => void;
  onRename: () => void;
  onMove: () => void;
  onRestore?: () => void;
  onShare?: () => void;
  onPreview?: () => void;
  onVersions?: () => void;
  canPreview?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-lg bg-white/80 dark:bg-white/10 backdrop-blur-sm hover:bg-white dark:hover:bg-white/20 shadow-sm"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        onClick={(e) => e.stopPropagation()}
        className="w-56 p-2 glass-strong rounded-xl border-border"
      >
        {canPreview && onPreview && (
          <DropdownMenuItem 
            onClick={onPreview}
            className="h-10 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
            Preview
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={onDownload}
          className="h-10 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
        >
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Download className="w-4 h-4 text-green-500" />
          </div>
          Download
        </DropdownMenuItem>
        {!file.isTrashed && (
          <>
            {onShare && (
              <DropdownMenuItem 
                onClick={onShare}
                className="h-10 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-amber-500" />
                </div>
                Share
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={onStar}
              className="h-10 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
            >
              {file.isStarred ? (
                <>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <StarOff className="w-4 h-4 text-amber-500" />
                  </div>
                  Remove star
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-500" />
                  </div>
                  Add star
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onRename}
              className="h-10 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
            >
              <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Pencil className="w-4 h-4" />
              </div>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onMove}
              className="h-10 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
            >
              <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
                <FolderInput className="w-4 h-4" />
              </div>
              Move
            </DropdownMenuItem>
            {onVersions && (
              <DropdownMenuItem 
                onClick={onVersions}
                className="h-10 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                Version history
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator className="bg-border my-1" />
        {file.isTrashed && onRestore && (
          <DropdownMenuItem 
            onClick={onRestore}
            className="h-10 rounded-lg cursor-pointer hover:bg-foreground/5 gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-green-500" />
            </div>
            Restore
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={onDelete} 
          className="h-10 rounded-lg cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-500 gap-3"
        >
          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          {file.isTrashed ? 'Delete permanently' : 'Move to trash'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
