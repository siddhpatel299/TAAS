import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Cloud, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUploader({ onUpload, disabled, className }: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!disabled && acceptedFiles.length > 0) {
        onUpload(acceptedFiles);
      }
    },
    [onUpload, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
  });

  return (
    <motion.div
      {...getRootProps()}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer overflow-hidden',
        isDragActive
          ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20'
          : 'border-white/20 hover:border-violet-400/50 glass-subtle',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      
      {/* Animated background gradient when dragging */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-pink-500/20"
        />
      )}
      
      <div className="flex flex-col items-center gap-4 text-center relative z-10">
        <motion.div
          animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={cn(
            'rounded-2xl p-5 transition-all',
            isDragActive 
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/40' 
              : 'bg-gradient-to-br from-violet-500/20 to-purple-600/20'
          )}
        >
          {isDragActive ? (
            <Cloud className="h-10 w-10 text-white" />
          ) : (
            <Upload className="h-10 w-10 text-violet-400" />
          )}
        </motion.div>
        <div>
          <p className="text-lg font-semibold">
            {isDragActive ? (
              <span className="text-violet-400">Drop files here</span>
            ) : (
              'Drag & drop files here'
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse from your computer
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span>Supports all file types up to 2GB per file</span>
        </div>
      </div>
    </motion.div>
  );
}
