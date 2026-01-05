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
  const isImage = fileType === 'image' && !imageError;
  const canPreview = ['image', 'video', 'audio', 'document'].includes(fileType);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg border transition-all hover:bg-muted/50',
          isSelected && 'bg-primary/10 border-primary'
        )}
        onClick={selectionMode ? onSelect : onPreview}
        onDoubleClick={onPreview}
      >
        {/* Selection checkbox */}
        <div 
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
            isSelected ? "bg-primary border-primary" : "border-gray-300 hover:border-gray-400"
          )}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        <div className="flex-shrink-0">
          {isImage ? (
            <div className="w-10 h-10 rounded overflow-hidden bg-muted">
              <img
                src={`/api/files/${file.id}/thumbnail`}
                alt={file.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} • {formatDate(file.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {file.isStarred && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
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
      className={cn(
        'group relative flex flex-col rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:border-primary/50',
        isSelected && 'ring-2 ring-primary border-primary'
      )}
      onClick={selectionMode ? onSelect : undefined}
      onDoubleClick={onPreview}
    >
      {/* Selection checkbox */}
      <div 
        className={cn(
          "absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
          isSelected ? "bg-primary border-primary" : "border-white/70 bg-black/20 opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Preview */}
      <div className="relative aspect-square bg-muted flex items-center justify-center">
        {isImage ? (
          <img
            src={`/api/files/${file.id}/thumbnail`}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Icon className="w-12 h-12 text-muted-foreground" />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {canPreview && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onPreview?.();
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Star indicator */}
        {file.isStarred && (
          <div className="absolute top-2 right-10">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 drop-shadow" />
          </div>
        )}

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div className="p-3">
        <p className="font-medium truncate text-sm">{file.name}</p>
        <p className="text-xs text-muted-foreground mt-1">
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {canPreview && onPreview && (
          <DropdownMenuItem onClick={onPreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </DropdownMenuItem>
        {!file.isTrashed && (
          <>
            {onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Link2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onStar}>
              {file.isStarred ? (
                <>
                  <StarOff className="w-4 h-4 mr-2" />
                  Remove star
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Add star
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}>
              <FolderInput className="w-4 h-4 mr-2" />
              Move
            </DropdownMenuItem>
            {onVersions && (
              <DropdownMenuItem onClick={onVersions}>
                <History className="w-4 h-4 mr-2" />
                Version history
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        {file.isTrashed && onRestore && (
          <DropdownMenuItem onClick={onRestore}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          {file.isTrashed ? 'Delete permanently' : 'Move to trash'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
