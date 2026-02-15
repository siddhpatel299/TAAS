import { useState, useEffect, useRef } from 'react';
import { FileText, FileStack, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { filesApi } from '@/lib/api';

const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface PdfThumbnailsProps {
  source: { type: 'taas'; file: { id: string; originalName: string; size?: number } } | { type: 'local'; file: File } | null;
  maxPages?: number;
  className?: string;
  /** Compact mode: single small thumbnail, no header. For merge list cards. */
  compact?: boolean;
}

export function PdfThumbnails({ source, maxPages, className, compact = false }: PdfThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 144; // w-32 + gap-3
    el.scrollBy({ left: dir === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  };

  const fileName = source?.type === 'taas' ? source.file.originalName : source?.type === 'local' ? source.file.name : '';
  const fileSize = source?.type === 'taas' ? source.file.size : source?.type === 'local' ? source.file.size : undefined;

  useEffect(() => {
    if (!source) {
      setThumbnails([]);
      setTotalPages(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;

        let data: ArrayBuffer;
        if (source.type === 'taas') {
          const res = await filesApi.downloadFile(source.file.id);
          data = await (res.data as Blob).arrayBuffer();
        } else {
          data = await source.file.arrayBuffer();
        }

        const doc = await pdfjsLib.getDocument({ data }).promise;
        const numPages = doc.numPages;
        const pagesToRender = maxPages == null ? numPages : Math.min(numPages, maxPages);
        const urls: string[] = [];

        if (!cancelled) setTotalPages(numPages);

        for (let i = 1; i <= pagesToRender; i++) {
          if (cancelled) break;
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 0.8 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          urls.push(canvas.toDataURL('image/jpeg', 0.7));
        }

        if (!cancelled) setThumbnails(urls);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load preview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [source, maxPages]);

  if (!source) return null;
  if (loading) {
    if (compact) {
      return <div className={cn('w-20 h-24 sm:w-24 sm:h-32 bg-slate-200 animate-pulse rounded-lg flex-shrink-0', className)} />;
    }
    return (
      <div className={cn('rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden', className)}>
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-slate-500 text-sm">
          <FileText className="w-4 h-4 animate-pulse" />
          <span>Loading preview...</span>
        </div>
        <div className="p-4 flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-28 h-36 sm:w-32 sm:h-40 bg-slate-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (error || thumbnails.length === 0) {
    if (compact) {
      return (
        <div className={cn('w-20 h-24 sm:w-24 sm:h-32 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center flex-shrink-0', className)}>
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
      );
    }
    return (
      <div className={cn('flex items-center gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-500 text-sm', className)}>
        <FileText className="w-4 h-4 flex-shrink-0" />
        <span>{error || 'No preview'}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 w-20 h-24 sm:w-24 sm:h-32', className)}>
        <img src={thumbnails[0]} alt="Page 1" className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm w-full min-w-0 overflow-visible', className)}>
      {/* PDF info header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-cyan-600 flex-shrink-0" />
            <span className="font-medium text-slate-800 truncate" title={fileName}>
              {fileName}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            {totalPages != null && (
              <span className="inline-flex items-center gap-1">
                <FileStack className="w-3.5 h-3.5" />
                {totalPages} {totalPages === 1 ? 'page' : 'pages'}
              </span>
            )}
            {fileSize != null && (
              <span>{formatBytes(fileSize)}</span>
            )}
            {thumbnails.length < (totalPages ?? 0) && (
              <span className="text-slate-500 text-xs">
                Showing first {thumbnails.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnails - horizontal scroll */}
      <div className="p-4">
        <div
          ref={scrollRef}
          data-pdf-thumbnails-scroll
          className="flex flex-nowrap gap-3 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory pb-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(148 163 184) rgb(241 245 249)',
            overscrollBehavior: 'contain',
            touchAction: 'pan-x',
          }}
        >
          {thumbnails.map((url, i) => (
            <div
              key={i}
              className="relative group flex-shrink-0 snap-start"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={cn(
                  'relative rounded-lg overflow-hidden border shadow-sm bg-white transition-all duration-200',
                  'w-28 h-36 sm:w-32 sm:h-40',
                  hoveredIndex === i
                    ? 'border-cyan-400 shadow-md shadow-cyan-500/20 scale-[1.03] z-10 ring-2 ring-cyan-400/30'
                    : 'border-slate-200'
                )}
              >
                <img src={url} alt={`Page ${i + 1}`} className="w-full h-full object-contain" />
                {/* Page number badge */}
                <div className="absolute bottom-1 left-1 right-1 flex justify-center">
                  <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white text-xs font-medium">
                    {i + 1} / {totalPages ?? '?'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Arrows below thumbnails - always visible */}
        {totalPages != null && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 border border-cyan-200 transition-colors"
              aria-label="Previous pages"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-600">Use arrows or scrollbar</span>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 border border-cyan-200 transition-colors"
              aria-label="Next pages"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
