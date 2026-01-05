import { useState } from 'react';
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

const folderColors: Record<string, string> = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
  purple: 'text-purple-500',
  pink: 'text-pink-500',
  orange: 'text-orange-500',
  default: 'text-muted-foreground',
};

export function FolderCard({
  folder,
  viewMode,
  onOpen,
  onRename,
  onMove,
  onDelete,
}: FolderCardProps) {
  const colorClass = folderColors[folder.color || 'default'] || folderColors.default;
  const itemCount = (folder._count?.files || 0) + (folder._count?.children || 0);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-3 rounded-lg border transition-all hover:bg-muted/50 cursor-pointer"
        onClick={onOpen}
      >
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <Folder className={cn('w-5 h-5', colorClass)} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{folder.name}</p>
          <p className="text-xs text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative flex flex-col rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer"
      onClick={onOpen}
    >
      {/* Preview */}
      <div className="relative aspect-square bg-muted flex items-center justify-center">
        <Folder className={cn('w-16 h-16', colorClass)} />

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <FolderActions
            onRename={onRename}
            onMove={onMove}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-medium truncate text-sm">{folder.name}</p>
        <p className="text-xs text-muted-foreground mt-1">
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="w-4 h-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <FolderInput className="w-4 h-4 mr-2" />
          Move
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
