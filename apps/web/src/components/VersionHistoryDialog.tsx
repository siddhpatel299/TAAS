import { useState, useEffect } from 'react';
import { History, RotateCcw, Calendar, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { versionsApi } from '../lib/api';
import { formatFileSize, formatDate } from '../lib/utils';

interface Version {
  id: string;
  version: number;
  size: number;
  createdAt: string;
}

interface VersionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    size: number;
    createdAt: string;
  } | null;
  onRestore?: () => void;
}

export function VersionHistoryDialog({ 
  open, 
  onClose, 
  file,
  onRestore 
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    if (open && file) {
      fetchVersions();
    }
  }, [open, file]);

  const fetchVersions = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const response = await versionsApi.getVersions(file.id);
      setVersions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    if (!file) return;
    setRestoring(version);
    try {
      await versionsApi.restoreVersion(file.id, version);
      onRestore?.();
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current version */}
          {file && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Current Version</p>
                  <p className="text-sm text-blue-700 flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(file.size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(file.createdAt)}
                    </span>
                  </p>
                </div>
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                  Active
                </span>
              </div>
            </div>
          )}

          {/* Previous versions */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">
              Previous Versions ({versions.length})
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No previous versions available</p>
                <p className="text-sm">Versions are created when you upload a new file with the same name</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {versions.map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Version {version.version}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(version.size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(version.createdAt)}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(version.version)}
                        disabled={restoring !== null}
                      >
                        {restoring === version.version ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
