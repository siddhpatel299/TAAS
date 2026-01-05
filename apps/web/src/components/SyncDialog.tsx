import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Check,
  AlertCircle,
  Cloud,
  Loader2,
  FileIcon,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { syncApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  lastResult: {
    synced: number;
    skipped: number;
    errors: number;
    files: Array<{ name: string; size: number; messageId: number }>;
  } | null;
  progress: number;
}

interface StorageChannel {
  id: string;
  channelId: string;
  channelName: string;
  usedBytes: number;
  fileCount: number;
}

export function SyncDialog() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [channels, setChannels] = useState<StorageChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listenerActive, setListenerActive] = useState(false);

  // Fetch sync status and channels when dialog opens
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  // Poll for status while syncing
  useEffect(() => {
    if (status?.isRunning) {
      const interval = setInterval(fetchStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [status?.isRunning]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, channelsRes] = await Promise.all([
        syncApi.getStatus(),
        syncApi.getChannels(),
      ]);
      setStatus(statusRes.data.data);
      setChannels(channelsRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sync data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await syncApi.getStatus();
      setStatus(res.data.data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const handleStartSync = async (channelId?: string) => {
    setError(null);
    try {
      await syncApi.startSync(channelId);
      // Start polling for status
      fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start sync');
    }
  };

  const handleSetupListener = async () => {
    try {
      await syncApi.setupListener();
      setListenerActive(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to setup listener');
    }
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border"
          >
            <RefreshCw className={cn("w-4 h-4", status?.isRunning && "animate-spin")} />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Sync from Telegram
          </DialogTitle>
          <DialogDescription>
            Sync files uploaded directly to your Telegram storage channel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
            </div>
          )}

          {/* Sync status */}
          {!loading && status && (
            <>
              {/* Current status */}
              <div className="p-4 rounded-xl bg-foreground/5 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Status</span>
                  <div className="flex items-center gap-2">
                    {status.isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span className="text-sm font-medium text-blue-500">Syncing...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium text-emerald-500">Ready</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Last sync</span>
                  <span className="text-sm font-medium">
                    {formatLastSync(status.lastSync)}
                  </span>
                </div>

                {status.isRunning && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/70">Progress</span>
                      <span className="font-medium">{status.progress}%</span>
                    </div>
                    <Progress value={status.progress} className="h-2" />
                  </div>
                )}
              </div>

              {/* Last sync result */}
              {status.lastResult && !status.isRunning && (
                <div className="p-4 rounded-xl bg-foreground/5 border border-border space-y-3">
                  <h4 className="text-sm font-medium">Last sync result</h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                      <div className="text-2xl font-bold text-emerald-500">
                        {status.lastResult.synced}
                      </div>
                      <div className="text-xs text-foreground/60">Synced</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-foreground/5">
                      <div className="text-2xl font-bold text-foreground/70">
                        {status.lastResult.skipped}
                      </div>
                      <div className="text-xs text-foreground/60">Skipped</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                      <div className="text-2xl font-bold text-red-500">
                        {status.lastResult.errors}
                      </div>
                      <div className="text-xs text-foreground/60">Errors</div>
                    </div>
                  </div>

                  {/* Recently synced files */}
                  {status.lastResult.files.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-foreground/60">Recently synced</h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {status.lastResult.files.slice(0, 5).map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                          >
                            <FileIcon className="w-4 h-4 text-foreground/50" />
                            <span className="text-sm truncate flex-1">{file.name}</span>
                            <span className="text-xs text-foreground/50">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Storage channels */}
              {channels.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Storage Channels</h4>
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Radio className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{channel.channelName}</p>
                          <p className="text-xs text-foreground/50">
                            {channel.fileCount} files • {formatFileSize(channel.usedBytes)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartSync(channel.channelId)}
                        disabled={status.isRunning}
                        className="h-8"
                      >
                        Sync
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleStartSync()}
                  disabled={status.isRunning}
                  className="flex-1 h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90"
                >
                  {status.isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync All Channels
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSetupListener}
                  disabled={listenerActive}
                  variant="outline"
                  className="h-11 rounded-xl"
                >
                  {listenerActive ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-500" />
                      Live
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4 mr-2" />
                      Enable Live Sync
                    </>
                  )}
                </Button>
              </div>

              {/* Info */}
              <p className="text-xs text-foreground/50 text-center">
                Live sync automatically imports files when you upload directly to Telegram
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
