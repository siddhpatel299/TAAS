import { X, CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFilesStore, UploadProgress } from '@/stores/files.store';

export function UploadQueue() {
  const { uploads, removeUpload } = useFilesStore();

  if (uploads.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-4 right-4 w-80 glass-strong rounded-xl shadow-2xl overflow-hidden z-50 border border-border"
    >
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
          <Upload className="w-4 h-4 text-background" />
        </div>
        <h3 className="font-semibold text-sm">Uploads</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-foreground/5 px-2 py-1 rounded-full">
          {uploads.length}
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence>
          {uploads.map((upload) => (
            <UploadItem
              key={upload.id}
              upload={upload}
              onRemove={() => removeUpload(upload.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function UploadItem({
  upload,
  onRemove,
}: {
  upload: UploadProgress;
  onRemove: () => void;
}) {
  const statusConfig = {
    pending: { 
      icon: <Loader2 className="w-4 h-4 animate-spin text-foreground/50" />,
      bg: 'bg-foreground/5'
    },
    uploading: { 
      icon: <Loader2 className="w-4 h-4 animate-spin text-foreground" />,
      bg: 'bg-foreground/10'
    },
    completed: { 
      icon: <CheckCircle className="w-4 h-4 text-foreground" />,
      bg: 'bg-foreground/10'
    },
    error: { 
      icon: <AlertCircle className="w-4 h-4 text-foreground/70" />,
      bg: 'bg-foreground/5'
    },
  };

  const status = statusConfig[upload.status];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 border-b border-border/50 last:border-b-0"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-7 h-7 rounded-lg ${status.bg} flex items-center justify-center`}>
          {status.icon}
        </div>
        <span className="flex-1 text-sm truncate font-medium">{upload.fileName}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-foreground/5"
          onClick={onRemove}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      {upload.status === 'uploading' && (
        <div className="ml-10">
          <Progress value={upload.progress} className="h-1.5 rounded-full" />
        </div>
      )}
      {upload.status === 'error' && (
        <p className="ml-10 text-xs text-foreground/60">{upload.error}</p>
      )}
    </motion.div>
  );
}
