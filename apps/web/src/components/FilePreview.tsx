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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      );
    }

    if (error || !blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <p>Unable to preview this file</p>
          <Button variant="outline" onClick={handleDownload} className="mt-4">
            <Download className="mr-2 h-4 w-4" />
            Download Instead
          </Button>
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
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-4xl">🎵</div>
          </div>
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
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-lg mb-2">{file.name}</p>
        <p className="text-sm mb-4">Preview not available for this file type</p>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
        onClick={onClose}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-white font-medium truncate max-w-[300px]">{file.name}</h2>
            <span className="text-gray-500 text-sm">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <span className="text-gray-400 text-sm w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setRotation((r) => r + 90)}
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
                <div className="w-px h-6 bg-gray-700 mx-2" />
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={handleDownload}
            >
              <Download className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

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
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  onClick={() => onNavigate?.(files[currentIndex - 1])}
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}
              {hasNext && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  onClick={() => onNavigate?.(files[currentIndex + 1])}
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer with file count */}
        {files.length > 1 && (
          <div className="p-2 text-center text-gray-500 text-sm">
            {currentIndex + 1} / {files.length}
          </div>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <pre className="text-gray-300 text-sm p-4 font-mono whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
