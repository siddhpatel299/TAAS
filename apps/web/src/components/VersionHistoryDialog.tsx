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
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <History className="h-5 w-5 text-white" />
            </div>
            <span>Version History</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current version */}
          {file && (
            <div className="p-4 glass-subtle rounded-2xl border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Current Version</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
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
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
                  Active
                </span>
              </div>
            </div>
          )}

          {/* Previous versions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Previous Versions ({versions.length})
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500" />
              </div>
            ) : versions.length === 0 ? (
              <div className="glass-subtle rounded-2xl text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <History className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium">No previous versions available</p>
                <p className="text-sm mt-1">Versions are created when you upload a new file with the same name</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {versions.map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 glass-subtle rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Version {version.version}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
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
                        className="rounded-xl"
                        onClick={() => handleRestore(version.version)}
                        disabled={restoring !== null}
                      >
                        {restoring === version.version ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
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
