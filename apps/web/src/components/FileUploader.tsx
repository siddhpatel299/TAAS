import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Cloud } from 'lucide-react';
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
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={cn(
            'rounded-full p-4 transition-colors',
            isDragActive ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          {isDragActive ? (
            <Cloud className="h-8 w-8 text-primary animate-pulse" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse from your computer
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Supports all file types up to 2GB per file
        </p>
      </div>
    </div>
  );
}
