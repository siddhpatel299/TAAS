import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Star, StarOff, Download, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { bulkApi, filesApi } from '../lib/api';
import { useState } from 'react';

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
  isTrash?: boolean;
}

export function BulkActionsBar({ 
  selectedIds, 
  onClearSelection, 
  onSuccess,
  isTrash = false
}: BulkActionsBarProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleBulkDelete = async (permanent = false) => {
    setLoading('delete');
    try {
      await bulkApi.deleteFiles(selectedIds, permanent);
      onClearSelection();
      onSuccess();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleBulkStar = async (starred: boolean) => {
    setLoading('star');
    try {
      await bulkApi.starFiles(selectedIds, starred);
      onClearSelection();
      onSuccess();
    } catch (error) {
      console.error('Bulk star failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleBulkRestore = async () => {
    setLoading('restore');
    try {
      await bulkApi.restoreFiles(selectedIds);
      onClearSelection();
      onSuccess();
    } catch (error) {
      console.error('Bulk restore failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleBulkDownload = async () => {
    setLoading('download');
    try {
      // Download files one by one
      for (const id of selectedIds) {
        const response = await filesApi.downloadFile(id);
        const file = await filesApi.getFile(id);
        const blob = new Blob([response.data], { type: file.data.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.data.data.name;
        a.click();
        URL.revokeObjectURL(url);
      }
      onClearSelection();
    } catch (error) {
      console.error('Bulk download failed:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 glass-strong px-5 py-3.5 rounded-2xl shadow-2xl border border-white/20">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {selectedIds.length}
              </div>
              <span className="text-sm font-medium">
                selected
              </span>
            </div>
            
            <div className="w-px h-6 bg-white/10" />

            {isTrash ? (
              // Trash actions
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl hover:bg-white/10"
                  onClick={handleBulkRestore}
                  disabled={loading !== null}
                >
                  {loading === 'restore' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl"
                  onClick={() => handleBulkDelete(true)}
                  disabled={loading !== null}
                >
                  {loading === 'delete' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Forever
                </Button>
              </>
            ) : (
              // Normal actions
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl hover:bg-white/10"
                  onClick={() => handleBulkStar(true)}
                  disabled={loading !== null}
                >
                  <Star className="h-4 w-4 mr-2 text-amber-400" />
                  Star
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl hover:bg-white/10"
                  onClick={() => handleBulkStar(false)}
                  disabled={loading !== null}
                >
                  <StarOff className="h-4 w-4 mr-2" />
                  Unstar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl hover:bg-white/10"
                  onClick={handleBulkDownload}
                  disabled={loading !== null}
                >
                  {loading === 'download' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <Download className="h-4 w-4 mr-2 text-blue-400" />
                  )}
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl"
                  onClick={() => handleBulkDelete(false)}
                  disabled={loading !== null}
                >
                  {loading === 'delete' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </>
            )}

            <div className="w-px h-6 bg-white/10" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-white/10"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
