import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFilesStore, UploadProgress } from '@/stores/files.store';

export function UploadQueue() {
  const { uploads, removeUpload } = useFilesStore();

  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card border rounded-lg shadow-lg overflow-hidden z-50">
      <div className="p-3 border-b bg-muted/50">
        <h3 className="font-medium text-sm">Uploads</h3>
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
    </div>
  );
}

function UploadItem({
  upload,
  onRemove,
}: {
  upload: UploadProgress;
  onRemove: () => void;
}) {
  const statusIcon = {
    pending: <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />,
    uploading: <Loader2 className="w-4 h-4 animate-spin text-primary" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    error: <AlertCircle className="w-4 h-4 text-destructive" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 border-b last:border-b-0"
    >
      <div className="flex items-center gap-2 mb-2">
        {statusIcon[upload.status]}
        <span className="flex-1 text-sm truncate">{upload.fileName}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRemove}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      {upload.status === 'uploading' && (
        <Progress value={upload.progress} className="h-1" />
      )}
      {upload.status === 'error' && (
        <p className="text-xs text-destructive">{upload.error}</p>
      )}
    </motion.div>
  );
}
