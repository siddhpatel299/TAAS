
import { Folder, MoreVertical, Pencil, Trash2, FolderInput } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Folder as FolderType } from '@/stores/files.store';

interface FolderCardProps {
  folder: FolderType;
  viewMode: 'grid' | 'list';
  onOpen: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}

const folderGradients: Record<string, string> = {
  blue: 'from-blue-400 to-blue-600',
  green: 'from-emerald-400 to-emerald-600',
  yellow: 'from-amber-400 to-amber-600',
  red: 'from-rose-400 to-rose-600',
  purple: 'from-amber-400 to-gold',
  pink: 'from-pink-400 to-pink-600',
  orange: 'from-orange-400 to-orange-600',
  default: 'from-gold-dark to-gold-light',
};

export function FolderCard({
  folder,
  viewMode,
  onOpen,
  onRename,
  onMove,
  onDelete,
}: FolderCardProps) {
  const gradientClass = folderGradients[folder.color || 'default'] || folderGradients.default;
  const itemCount = (folder._count?.files || 0) + (folder._count?.children || 0);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005 }}
        className="flex items-center gap-4 p-4 glass-subtle rounded-xl transition-all cursor-pointer group"
        onClick={onOpen}
      >
        <div className="flex-shrink-0">
          <div className={cn(
            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
            gradientClass
          )}>
            <Folder className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-foreground/90">{folder.name}</p>
          <p className="text-sm text-foreground/50">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <FolderActions
            onRename={onRename}
            onMove={onMove}
            onDelete={onDelete}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col glass-subtle rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20"
      onClick={onOpen}
    >
      {/* Preview */}
      <div className="relative aspect-square bg-gradient-to-br from-foreground/5 to-foreground/10 flex items-center justify-center">
        <motion.div
          whileHover={{ scale: 1.1, rotate: -5 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className={cn(
            'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl',
            gradientClass
          )}
        >
          <Folder className="w-10 h-10 text-white" />
        </motion.div>

        {/* Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <FolderActions
            onRename={onRename}
            onMove={onMove}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold truncate text-sm text-foreground/90">{folder.name}</p>
        <p className="text-xs text-foreground/50 mt-1">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>
    </motion.div>
  );
}

function FolderActions({
  onRename,
  onMove,
  onDelete,
}: {
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
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
        className="w-48 p-2 glass-strong rounded-xl border-border"
      >
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
        <DropdownMenuSeparator className="bg-border my-1" />
        <DropdownMenuItem 
          onClick={onDelete} 
          className="h-10 rounded-lg cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-500 gap-3"
        >
          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
