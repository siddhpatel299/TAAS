import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Cloud, Crown } from 'lucide-react';
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

  const rootProps = getRootProps();

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.005 }}
      whileTap={{ scale: disabled ? 1 : 0.995 }}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer overflow-hidden',
        isDragActive
          ? 'border-foreground/50 bg-foreground/10 shadow-lg shadow-foreground/10'
          : 'border-border hover:border-foreground/30 glass-subtle',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={rootProps.onClick}
      onKeyDown={rootProps.onKeyDown}
      onFocus={rootProps.onFocus}
      onBlur={rootProps.onBlur}
      onDragEnter={rootProps.onDragEnter}
      onDragOver={rootProps.onDragOver}
      onDragLeave={rootProps.onDragLeave}
      onDrop={rootProps.onDrop}
      tabIndex={rootProps.tabIndex}
      role={rootProps.role}
    >
      <input {...getInputProps()} />
      
      {/* Animated background gradient when dragging */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-foreground/10 via-foreground/5 to-foreground/10"
        />
      )}
      
      <div className="flex flex-col items-center gap-4 text-center relative z-10">
        <motion.div
          animate={isDragActive ? { scale: 1.05, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={cn(
            'rounded-xl p-5 transition-all',
            isDragActive 
              ? 'bg-foreground shadow-lg shadow-foreground/20' 
              : 'bg-foreground/10'
          )}
        >
          {isDragActive ? (
            <Cloud className="h-10 w-10 text-background" />
          ) : (
            <Upload className="h-10 w-10 text-foreground/70" />
          )}
        </motion.div>
        <div>
          <p className="text-lg font-semibold">
            {isDragActive ? (
              <span className="text-foreground">Drop files here</span>
            ) : (
              'Drag & drop files here'
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse from your computer
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Crown className="w-3 h-3 text-foreground/70" />
          <span>Supports all file types up to 2GB per file</span>
        </div>
      </div>
    </motion.div>
  );
}
