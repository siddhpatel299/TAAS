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
          <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-full shadow-2xl border border-gray-700">
            <span className="text-sm font-medium px-2">
              {selectedIds.length} selected
            </span>
            
            <div className="w-px h-6 bg-gray-700" />

            {isTrash ? (
              // Trash actions
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-800"
                  onClick={handleBulkRestore}
                  disabled={loading !== null}
                >
                  {loading === 'restore' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-gray-800 hover:text-red-300"
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
                  className="text-white hover:bg-gray-800"
                  onClick={() => handleBulkStar(true)}
                  disabled={loading !== null}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Star
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-800"
                  onClick={() => handleBulkStar(false)}
                  disabled={loading !== null}
                >
                  <StarOff className="h-4 w-4 mr-2" />
                  Unstar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-800"
                  onClick={handleBulkDownload}
                  disabled={loading !== null}
                >
                  {loading === 'download' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-gray-800 hover:text-red-300"
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

            <div className="w-px h-6 bg-gray-700" />

            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
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
