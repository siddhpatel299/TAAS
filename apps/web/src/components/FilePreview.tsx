import { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { filesApi } from '../lib/api';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
  } | null;
  files?: Array<{ id: string; name: string; mimeType: string; size: number }>;
  onClose: () => void;
  onNavigate?: (file: any) => void;
}

export function FilePreview({ file, files = [], onClose, onNavigate }: FilePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const currentIndex = files.findIndex((f) => f.id === file?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev && onNavigate) {
        onNavigate(files[currentIndex - 1]);
      }
      if (e.key === 'ArrowRight' && hasNext && onNavigate) {
        onNavigate(files[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasPrev, hasNext, files, onNavigate, onClose]);

  // Load file as blob when file changes
  useEffect(() => {
    if (!file) return;
    
    setZoom(1);
    setRotation(0);
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    const loadFile = async () => {
      try {
        const response = await filesApi.downloadFile(file.id);
        const blob = new Blob([response.data], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load file:', err);
        setError('Failed to load file');
        setLoading(false);
      }
    };

    loadFile();

    // Cleanup blob URL on unmount or file change
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file?.id]);

  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isPDF = file.mimeType === 'application/pdf';
  const isText = file.mimeType.startsWith('text/') || 
    ['application/json', 'application/javascript', 'application/xml'].includes(file.mimeType);

  const handleDownload = async () => {
    try {
      if (blobUrl) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        a.click();
      } else {
        const response = await filesApi.downloadFile(file.id);
        const blob = new Blob([response.data], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 rounded-xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-amber-500/15"
          >
            <Download className="w-6 h-6 text-[#0a0d14]" />
          </motion.div>
        </div>
      );
    }

    if (error || !blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="glass-strong rounded-3xl p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-foreground/70 mb-4">Unable to preview this file</p>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Instead
            </Button>
          </div>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="relative flex items-center justify-center h-full overflow-hidden">
          <img
            src={blobUrl}
            alt={file.name}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center h-full">
          <video
            src={blobUrl}
            controls
            autoPlay
            className="max-h-full max-w-full"
            onLoadedData={() => setLoading(false)}
            onError={() => setError('Failed to load video')}
          >
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-32 h-32 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-xl shadow-amber-500/15"
          >
            <div className="text-5xl">🎵</div>
          </motion.div>
          <audio
            src={blobUrl}
            controls
            autoPlay
            className="w-full max-w-md"
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <iframe
          src={blobUrl}
          className="w-full h-full border-0"
        />
      );
    }

    if (isText) {
      return (
        <TextPreview blobUrl={blobUrl} />
      );
    }

    // Unsupported type
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="glass-strong rounded-2xl p-8 flex flex-col items-center luxury-border">
          <div className="w-20 h-20 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
            <span className="text-4xl">📄</span>
          </div>
          <p className="text-lg font-semibold mb-1">{file.name}</p>
          <p className="text-sm text-muted-foreground mb-4">Preview not available for this file type</p>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
        onClick={onClose}
      >
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-subtle border-b border-white/10 flex items-center justify-between p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-foreground font-semibold truncate max-w-[300px]">{file.name}</h2>
            <span className="text-muted-foreground text-sm bg-white/10 px-3 py-1 rounded-full">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-white/10"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <span className="text-muted-foreground text-sm w-14 text-center bg-white/10 px-2 py-1 rounded-lg">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-white/10"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-white/10"
                  onClick={() => setRotation((r) => r + 90)}
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
                <div className="w-px h-6 bg-white/10 mx-2" />
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-white/10"
              onClick={handleDownload}
            >
              <Download className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <div 
          className="flex-1 relative overflow-hidden p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {renderPreview()}

          {/* Navigation arrows */}
          {files.length > 1 && (
            <>
              {hasPrev && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl glass-strong text-foreground hover:bg-white/20 transition-colors"
                  onClick={() => onNavigate?.(files[currentIndex - 1])}
                >
                  <ChevronLeft className="h-6 w-6" />
                </motion.button>
              )}
              {hasNext && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl glass-strong text-foreground hover:bg-white/20 transition-colors"
                  onClick={() => onNavigate?.(files[currentIndex + 1])}
                >
                  <ChevronRight className="h-6 w-6" />
                </motion.button>
              )}
            </>
          )}
        </div>

        {/* Footer with file count */}
        {files.length > 1 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-3 text-center"
          >
            <span className="glass-subtle px-4 py-2 rounded-full text-sm text-muted-foreground">
              {currentIndex + 1} / {files.length}
            </span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Text file preview component
function TextPreview({ blobUrl }: { blobUrl: string }) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(blobUrl);
        const text = await response.text();
        setContent(text);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setContent('Failed to load file content');
      }
    };
    fetchContent();
  }, [blobUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <pre className="glass-subtle rounded-2xl text-foreground/80 text-sm p-6 font-mono whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
