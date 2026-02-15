import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Archive,
  Merge,
  Scissors,
  FileOutput,
  Droplets,
  FileArchive,
  ScanText,
  Monitor,
  Server,
  Trash2,
  Loader2,
  Download,
  Upload,
  Cloud,
  Copy,
  Check,
  RotateCw,
  Hash,
  Crop,
  ImagePlus,
  Image as ImageIcon,
  Lock,
  Unlock,
  Eraser,
  ArrowLeft,
  GripVertical,
  ArrowUpDown,
  Type,
  RotateCcw,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDocument, StandardFonts, degrees, rgb, toDegrees } from 'pdf-lib';
import { FilePickerDialog } from '@/components/FilePickerDialog';
import { PdfThumbnails } from '@/components/pdf/PdfThumbnails';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { filesApi, pdfToolsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TaasFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

type PdfSource =
  | { type: 'taas'; file: TaasFile }
  | { type: 'local'; file: File };

type MergeItem = { id: string; source: PdfSource };

type ToolId = 'merge' | 'split' | 'extract' | 'watermark' | 'compress' | 'ocr'
  | 'rotate' | 'pageNumbers' | 'crop' | 'removePages' | 'imagesToPdf' | 'pdfToImages'
  | 'protect' | 'redact' | 'unlock' | 'reorderPages' | 'headersFooters' | 'rotateSpecific'
  | 'officeToPdf' | 'pdfToPdfa';

type PickerFor = 'merge' | 'split' | 'extract' | 'watermark' | 'compress' | 'ocr'
  | 'rotate' | 'pageNumbers' | 'crop' | 'removePages' | 'imagesToPdf' | 'pdfToImages'
  | 'protect' | 'redact' | 'unlock' | 'reorderPages' | 'headersFooters' | 'rotateSpecific'
  | 'officeToPdf' | 'pdfToPdfa';

interface ToolDef {
  id: ToolId;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  side: 'client' | 'server';
  category?: string;
}

const TOOLS: ToolDef[] = [
  { id: 'merge', name: 'Merge PDFs', description: 'Combine multiple PDFs into one', icon: Merge, side: 'client', category: 'Organize' },
  { id: 'split', name: 'Split PDF', description: 'Split by page ranges', icon: Scissors, side: 'client', category: 'Organize' },
  { id: 'extract', name: 'Extract Pages', description: 'Extract specific pages', icon: FileOutput, side: 'client', category: 'Organize' },
  { id: 'removePages', name: 'Remove Pages', description: 'Remove selected pages', icon: Trash2, side: 'client', category: 'Organize' },
  { id: 'reorderPages', name: 'Reorder Pages', description: 'Drag to reorder page order', icon: ArrowUpDown, side: 'client', category: 'Organize' },
  { id: 'rotate', name: 'Rotate PDF', description: 'Rotate all pages 90° clockwise', icon: RotateCw, side: 'client', category: 'Edit' },
  { id: 'rotateSpecific', name: 'Rotate Specific Pages', description: 'Rotate selected pages by angle', icon: RotateCcw, side: 'client', category: 'Edit' },
  { id: 'headersFooters', name: 'Headers & Footers', description: 'Add header or footer text', icon: Type, side: 'client', category: 'Edit' },
  { id: 'pageNumbers', name: 'Add Page Numbers', description: 'Add page numbers to each page', icon: Hash, side: 'client', category: 'Edit' },
  { id: 'crop', name: 'Crop PDF', description: 'Crop margins from pages', icon: Crop, side: 'client', category: 'Edit' },
  { id: 'watermark', name: 'Add Watermark', description: 'Add text watermark', icon: Droplets, side: 'client', category: 'Edit' },
  { id: 'imagesToPdf', name: 'Images to PDF', description: 'Convert JPG/PNG to PDF', icon: ImagePlus, side: 'client', category: 'Convert' },
  { id: 'pdfToImages', name: 'PDF to Images', description: 'Export PDF pages as JPG', icon: ImageIcon, side: 'client', category: 'Convert' },
  { id: 'officeToPdf', name: 'Office to PDF', description: 'Word, PowerPoint, Excel → PDF', icon: FileText, side: 'server', category: 'Convert' },
  { id: 'pdfToPdfa', name: 'PDF to PDF/A', description: 'Convert to archival PDF format', icon: Archive, side: 'server', category: 'Convert' },
  { id: 'protect', name: 'Protect PDF', description: 'Add password protection', icon: Lock, side: 'client', category: 'Security' },
  { id: 'unlock', name: 'Unlock PDF', description: 'Remove password with key', icon: Unlock, side: 'client', category: 'Security' },
  { id: 'redact', name: 'Redact PDF', description: 'Black out selected pages', icon: Eraser, side: 'client', category: 'Security' },
  { id: 'compress', name: 'Compress PDF', description: 'Reduce file size', icon: FileArchive, side: 'server', category: 'Tools' },
  { id: 'ocr', name: 'Extract Text', description: 'OCR / extract text from PDF', icon: ScanText, side: 'server', category: 'Tools' },
];

function getSourceName(s: PdfSource): string {
  return s.type === 'taas' ? s.file.originalName : s.file.name;
}

async function getPdfBuffer(source: PdfSource): Promise<ArrayBuffer> {
  if (source.type === 'taas') {
    const res = await filesApi.downloadFile(source.file.id);
    return (res.data as Blob).arrayBuffer();
  }
  return source.file.arrayBuffer();
}

async function getPdfFile(source: PdfSource): Promise<File> {
  if (source.type === 'local') return source.file;
  const res = await filesApi.downloadFile(source.file.id);
  const blob = res.data as Blob;
  return new File([blob], source.file.originalName, { type: 'application/pdf' });
}

export function PdfToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [mergeItems, setMergeItems] = useState<MergeItem[]>([]);
  const [splitSource, setSplitSource] = useState<PdfSource | null>(null);
  const [extractSource, setExtractSource] = useState<PdfSource | null>(null);
  const [watermarkSource, setWatermarkSource] = useState<PdfSource | null>(null);
  const [compressSource, setCompressSource] = useState<PdfSource | null>(null);
  const [ocrSource, setOcrSource] = useState<PdfSource | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [splitRanges, setSplitRanges] = useState('1-3, 4-6, 7-10');
  const [extractPages, setExtractPages] = useState('1, 3, 5');
  const [storeToTaas, setStoreToTaas] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [pickerFor, setPickerFor] = useState<PickerFor | null>(null);
  const [rotateSource, setRotateSource] = useState<PdfSource | null>(null);
  const [pageNumbersSource, setPageNumbersSource] = useState<PdfSource | null>(null);
  const [cropSource, setCropSource] = useState<PdfSource | null>(null);
  const [cropMargin, setCropMargin] = useState('20');
  const [removePagesSource, setRemovePagesSource] = useState<PdfSource | null>(null);
  const [removePagesInput, setRemovePagesInput] = useState('1, 3, 5');
  const [imagesToPdfFiles, setImagesToPdfFiles] = useState<File[]>([]);
  const [pdfToImagesSource, setPdfToImagesSource] = useState<PdfSource | null>(null);
  const [protectSource, setProtectSource] = useState<PdfSource | null>(null);
  const [protectPassword, setProtectPassword] = useState('');
  const [unlockSource, setUnlockSource] = useState<PdfSource | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [redactSource, setRedactSource] = useState<PdfSource | null>(null);
  const [redactPages, setRedactPages] = useState('1, 2');
  const [reorderPagesSource, setReorderPagesSource] = useState<PdfSource | null>(null);
  const [reorderPageIndices, setReorderPageIndices] = useState<number[]>([]);
  const [headersFootersSource, setHeadersFootersSource] = useState<PdfSource | null>(null);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [rotateSpecificSource, setRotateSpecificSource] = useState<PdfSource | null>(null);
  const [rotateSpecificPages, setRotateSpecificPages] = useState('1, 3, 5');
  const [rotateSpecificAngle, setRotateSpecificAngle] = useState<90 | 180 | 270>(90);
  const [officeToPdfSource, setOfficeToPdfSource] = useState<PdfSource | null>(null);
  const [pdfToPdfaSource, setPdfToPdfaSource] = useState<PdfSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const officeInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!reorderPagesSource) {
      setReorderPageIndices([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const buf = await getPdfBuffer(reorderPagesSource);
        const pdf = await PDFDocument.load(buf);
        const n = pdf.getPageCount();
        if (!cancelled) setReorderPageIndices(Array.from({ length: n }, (_, i) => i));
      } catch {
        if (!cancelled) setReorderPageIndices([]);
      }
    })();
    return () => { cancelled = true; };
  }, [reorderPagesSource]);

  const openFileInput = (forTool: PickerFor | null) => {
    setPickerFor(forTool);
    if (forTool === 'officeToPdf') officeInputRef.current?.click();
    else fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }
    const src: PdfSource = { type: 'local', file };
    if (pickerFor === 'merge') setMergeItems((p) => [...p, { id: crypto.randomUUID(), source: src }]);
    else if (pickerFor === 'split') setSplitSource(src);
    else if (pickerFor === 'extract') setExtractSource(src);
    else if (pickerFor === 'watermark') setWatermarkSource(src);
    else if (pickerFor === 'compress') setCompressSource(src);
    else if (pickerFor === 'ocr') setOcrSource(src);
    else if (pickerFor === 'rotate') setRotateSource(src);
    else if (pickerFor === 'pageNumbers') setPageNumbersSource(src);
    else if (pickerFor === 'crop') setCropSource(src);
    else if (pickerFor === 'removePages') setRemovePagesSource(src);
    else if (pickerFor === 'pdfToImages') setPdfToImagesSource(src);
    else if (pickerFor === 'protect') setProtectSource(src);
    else if (pickerFor === 'unlock') setUnlockSource(src);
    else if (pickerFor === 'redact') setRedactSource(src);
    else if (pickerFor === 'reorderPages') setReorderPagesSource(src);
    else if (pickerFor === 'headersFooters') setHeadersFootersSource(src);
    else if (pickerFor === 'rotateSpecific') setRotateSpecificSource(src);
    else if (pickerFor === 'pdfToPdfa') setPdfToPdfaSource(src);
    setPickerFor(null);
    e.target.value = '';
  };

  const handleOfficeFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const file = files[0];
    const officeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel',
    ];
    if (!officeTypes.includes(file.type) && !/\.(docx?|pptx?|xlsx?)$/i.test(file.name)) {
      setError('Please select a Word, PowerPoint, or Excel file');
      return;
    }
    setOfficeToPdfSource({ type: 'local', file });
    setPickerFor(null);
    e.target.value = '';
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setImagesToPdfFiles((p) => [...p, ...arr]);
    e.target.value = '';
  };

  const handleSelectFromTaas = (file: TaasFile) => {
    const src: PdfSource = { type: 'taas', file };
    if (pickerFor === 'merge') setMergeItems((p) => [...p, { id: crypto.randomUUID(), source: src }]);
    else if (pickerFor === 'split') setSplitSource(src);
    else if (pickerFor === 'extract') setExtractSource(src);
    else if (pickerFor === 'watermark') setWatermarkSource(src);
    else if (pickerFor === 'compress') setCompressSource(src);
    else if (pickerFor === 'ocr') setOcrSource(src);
    else if (pickerFor === 'rotate') setRotateSource(src);
    else if (pickerFor === 'pageNumbers') setPageNumbersSource(src);
    else if (pickerFor === 'crop') setCropSource(src);
    else if (pickerFor === 'removePages') setRemovePagesSource(src);
    else if (pickerFor === 'pdfToImages') setPdfToImagesSource(src);
    else if (pickerFor === 'protect') setProtectSource(src);
    else if (pickerFor === 'unlock') setUnlockSource(src);
    else if (pickerFor === 'redact') setRedactSource(src);
    else if (pickerFor === 'reorderPages') setReorderPagesSource(src);
    else if (pickerFor === 'headersFooters') setHeadersFootersSource(src);
    else if (pickerFor === 'rotateSpecific') setRotateSpecificSource(src);
    else if (pickerFor === 'officeToPdf') setOfficeToPdfSource(src);
    else if (pickerFor === 'pdfToPdfa') setPdfToPdfaSource(src);
    setShowFilePicker(false);
    setPickerFor(null);
  };

  const openPicker = (forTool: typeof pickerFor) => {
    setPickerFor(forTool);
    setShowFilePicker(true);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToTaas = async (blob: Blob, baseName: string) => {
    const file = new File([blob], baseName, { type: 'application/pdf' });
    await filesApi.uploadFile(file, undefined, (p) => console.log('Upload:', p));
  };

  const processResult = async (blob: Blob, baseName: string) => {
    downloadBlob(blob, baseName);
    if (storeToTaas) await saveToTaas(blob, baseName);
  };

  const processResults = async (results: { blob: Blob; name: string }[]) => {
    for (const { blob, name } of results) downloadBlob(blob, name);
    if (storeToTaas) for (const { blob, name } of results) await saveToTaas(blob, name);
  };

  const handleMerge = async () => {
    if (mergeItems.length < 2) {
      setError('Select at least 2 PDFs to merge');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const { source } of mergeItems) {
        const buf = await getPdfBuffer(source);
        const src = await PDFDocument.load(buf);
        const pages = await mergedPdf.copyPages(src, src.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      }
      const bytes = await mergedPdf.save();
      const blob = new Blob([bytes as BlobPart]);
      await processResult(blob, `merged-${Date.now()}.pdf`);
      setActiveTool(null);
      setMergeItems([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Merge failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!splitSource) {
      setError('Select a PDF to split');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const buf = await getPdfBuffer(splitSource);
      const src = await PDFDocument.load(buf);
      const totalPages = src.getPageCount();
      const ranges = splitRanges.split(',').map((r) => r.trim());
      const results: { blob: Blob; name: string }[] = [];
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const match = range.match(/^(\d+)-(\d+)$/) || range.match(/^(\d+)$/);
        if (!match) continue;
        const start = match[2] ? parseInt(match[1], 10) : parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10);
        const safeStart = Math.max(1, Math.min(start, totalPages));
        const safeEnd = Math.max(1, Math.min(end, totalPages));
        const newPdf = await PDFDocument.create();
        const indices = Array.from({ length: safeEnd - safeStart + 1 }, (_, k) => safeStart - 1 + k);
        const pages = await newPdf.copyPages(src, indices);
        pages.forEach((p) => newPdf.addPage(p));
        const bytes = await newPdf.save();
        results.push({ blob: new Blob([bytes as BlobPart]), name: `split-${i + 1}-${Date.now()}.pdf` });
      }
      await processResults(results);
      setActiveTool(null);
      setSplitSource(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Split failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtract = async () => {
    if (!extractSource) {
      setError('Select a PDF to extract from');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const buf = await getPdfBuffer(extractSource);
      const src = await PDFDocument.load(buf);
      const totalPages = src.getPageCount();
      const pageNums = extractPages
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= totalPages);
      if (pageNums.length === 0) {
        setError('Enter valid page numbers (e.g. 1, 3, 5)');
        setIsProcessing(false);
        return;
      }
      const newPdf = await PDFDocument.create();
      const indices = pageNums.map((n) => n - 1);
      const pages = await newPdf.copyPages(src, indices);
      pages.forEach((p) => newPdf.addPage(p));
      const bytes = await newPdf.save();
      const blob = new Blob([bytes as BlobPart]);
      await processResult(blob, `extracted-${Date.now()}.pdf`);
      setActiveTool(null);
      setExtractSource(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Extract failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWatermark = async () => {
    if (!watermarkSource) {
      setError('Select a PDF to watermark');
      return;
    }
    if (!watermarkText.trim()) {
      setError('Enter watermark text');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const buf = await getPdfBuffer(watermarkSource);
      const pdf = await PDFDocument.load(buf);
      const pages = pdf.getPages();
      const font = await pdf.embedStandardFont(StandardFonts.HelveticaBold);
      for (const page of pages) {
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) / 15;
        page.drawText(watermarkText, {
          x: width / 2 - (watermarkText.length * fontSize * 0.3) / 2,
          y: height / 2 - fontSize / 2,
          size: fontSize,
          font,
          opacity: 0.3,
          rotate: degrees(45),
        });
      }
      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart]);
      await processResult(blob, `watermarked-${Date.now()}.pdf`);
      setActiveTool(null);
      setWatermarkSource(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Watermark failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompress = async () => {
    if (!compressSource) {
      setError('Select a PDF to compress');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const file = await getPdfFile(compressSource);
      const res = await pdfToolsApi.compress(file);
      const blob = res.data as Blob;
      const baseName = getSourceName(compressSource).replace(/\.pdf$/i, '') || 'compressed';
      await processResult(blob, `compressed-${baseName}.pdf`);
      setActiveTool(null);
      setCompressSource(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Compress failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOfficeToPdf = async () => {
    if (!officeToPdfSource) {
      setError('Select a Word, PowerPoint, or Excel file');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const file = await getPdfFile(officeToPdfSource);
      const res = await pdfToolsApi.officeToPdf(file);
      const blob = res.data as Blob;
      const baseName = getSourceName(officeToPdfSource).replace(/\.[^.]+$/, '') || 'converted';
      await processResult(blob, `${baseName}.pdf`);
      setActiveTool(null);
      setOfficeToPdfSource(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Office to PDF failed. Ensure LibreOffice is installed on the server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePdfToPdfa = async () => {
    if (!pdfToPdfaSource) {
      setError('Select a PDF to convert');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const file = await getPdfFile(pdfToPdfaSource);
      const res = await pdfToolsApi.pdfToPdfa(file);
      const blob = res.data as Blob;
      const baseName = getSourceName(pdfToPdfaSource).replace(/\.pdf$/i, '') || 'converted';
      await processResult(blob, `${baseName}-pdfa.pdf`);
      setActiveTool(null);
      setPdfToPdfaSource(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'PDF/A conversion failed. Ensure Ghostscript is installed on the server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOcr = async () => {
    if (!ocrSource) {
      setError('Select a PDF to extract text from');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setOcrResult(null);
    try {
      const file = await getPdfFile(ocrSource);
      const res = await pdfToolsApi.extractText(file);
      const text = res.data?.data?.text ?? '';
      setOcrResult(text || '(No text found. PDF may be scanned - try a different file.)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Extract text failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyOcrResult = () => {
    if (ocrResult) {
      navigator.clipboard.writeText(ocrResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRotate = async () => {
    if (!rotateSource) { setError('Select a PDF'); return; }
    setIsProcessing(true); setError(null);
    try {
      const buf = await getPdfBuffer(rotateSource);
      const pdf = await PDFDocument.load(buf);
      const pages = pdf.getPages();
      for (const page of pages) {
        const rot = toDegrees(page.getRotation());
        page.setRotation(degrees((rot + 90) % 360));
      }
      const bytes = await pdf.save();
      await processResult(new Blob([bytes as BlobPart]), `rotated-${Date.now()}.pdf`);
      setActiveTool(null); setRotateSource(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Rotate failed'); } finally { setIsProcessing(false); }
  };

  const handlePageNumbers = async () => {
    if (!pageNumbersSource) { setError('Select a PDF'); return; }
    setIsProcessing(true); setError(null);
    try {
      const buf = await getPdfBuffer(pageNumbersSource);
      const pdf = await PDFDocument.load(buf);
      const pages = pdf.getPages();
      const font = await pdf.embedStandardFont(StandardFonts.Helvetica);
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const text = `${i + 1}`;
        const fontSize = 12;
        page.drawText(text, { x: width - 30, y: height - 20, size: fontSize, font, color: rgb(0.5, 0.5, 0.5) });
      }
      const bytes = await pdf.save();
      await processResult(new Blob([bytes as BlobPart]), `numbered-${Date.now()}.pdf`);
      setActiveTool(null); setPageNumbersSource(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsProcessing(false); }
  };

  const handleCrop = async () => {
    if (!cropSource) { setError('Select a PDF'); return; }
    const margin = parseInt(cropMargin, 10) || 0;
    if (margin < 0 || margin > 200) { setError('Margin 0–200'); return; }
    setIsProcessing(true); setError(null);
    try {
      const buf = await getPdfBuffer(cropSource);
      const pdf = await PDFDocument.load(buf);
      const pages = pdf.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const m = margin;
        page.setCropBox(m, m, width - 2 * m, height - 2 * m);
        page.setMediaBox(m, m, width - 2 * m, height - 2 * m);
      }
      const bytes = await pdf.save();
      await processResult(new Blob([bytes as BlobPart]), `cropped-${Date.now()}.pdf`);
      setActiveTool(null); setCropSource(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Crop failed'); } finally { setIsProcessing(false); }
  };

  const handleRemovePages = async () => {
    if (!removePagesSource) { setError('Select a PDF'); return; }
    setIsProcessing(true); setError(null);
    try {
      const buf = await getPdfBuffer(removePagesSource);
      const src = await PDFDocument.load(buf);
      const totalPages = src.getPageCount();
      const toRemove = new Set<number>();
      for (const part of removePagesInput.split(',').map((s) => s.trim())) {
        const m = part.match(/^(\d+)-(\d+)$/) || part.match(/^(\d+)$/);
        if (!m) continue;
        if (m[2]) {
          const a = Math.max(1, Math.min(parseInt(m[1], 10), totalPages));
          const b = Math.max(1, Math.min(parseInt(m[2], 10), totalPages));
          for (let n = Math.min(a, b); n <= Math.max(a, b); n++) toRemove.add(n);
        } else {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n >= 1 && n <= totalPages) toRemove.add(n);
        }
      }
      const toKeep = Array.from({ length: totalPages }, (_, i) => i).filter((i) => !toRemove.has(i + 1));
      if (toKeep.length === 0) { setError('Must keep at least one page'); setIsProcessing(false); return; }
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(src, toKeep);
      pages.forEach((p) => newPdf.addPage(p));
      const bytes = await newPdf.save();
      await processResult(new Blob([bytes as BlobPart]), `removed-${Date.now()}.pdf`);
      setActiveTool(null); setRemovePagesSource(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsProcessing(false); }
  };

  const handleImagesToPdf = async () => {
    if (imagesToPdfFiles.length === 0) { setError('Add at least one image'); return; }
    setIsProcessing(true); setError(null);
    try {
      const pdf = await PDFDocument.create();
      for (const imgFile of imagesToPdfFiles) {
        const bytes = await imgFile.arrayBuffer();
        const ext = imgFile.name.split('.').pop()?.toLowerCase();
        const page = pdf.addPage();
        const { width, height } = page.getSize();
        if (ext === 'png') {
          const img = await pdf.embedPng(bytes);
          const scale = Math.min(width / img.width, height / img.height);
          page.drawImage(img, { x: 0, y: 0, width: img.width * scale, height: img.height * scale });
        } else {
          const img = await pdf.embedJpg(bytes);
          const scale = Math.min(width / img.width, height / img.height);
          page.drawImage(img, { x: 0, y: 0, width: img.width * scale, height: img.height * scale });
        }
      }
      const out = await pdf.save();
      await processResult(new Blob([out as BlobPart]), `images-${Date.now()}.pdf`);
      setActiveTool(null); setImagesToPdfFiles([]);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsProcessing(false); }
  };

  const handlePdfToImages = async () => {
    if (!pdfToImagesSource) { setError('Select a PDF'); return; }
    setIsProcessing(true); setError(null);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';
      const file = await getPdfFile(pdfToImagesSource);
      const data = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data }).promise;
      const numPages = doc.numPages;
      for (let i = 1; i <= numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('Blob failed'))), 'image/jpeg', 0.92);
        });
        downloadBlob(blob, `page-${i}.jpg`);
        if (storeToTaas) await saveToTaas(blob, `page-${i}.jpg`);
      }
      setActiveTool(null); setPdfToImagesSource(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsProcessing(false); }
  };

  const handleProtect = async () => {
    if (!protectSource || !protectPassword.trim()) {
      setError('Select a PDF and enter a password');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib-with-encrypt');
      const buf = await getPdfBuffer(protectSource);
      const pdf = await PDFDocument.load(buf);
      await pdf.encrypt({
        userPassword: protectPassword.trim(),
        ownerPassword: protectPassword.trim(),
      });
      const bytes = await pdf.save();
      await processResult(new Blob([bytes as BlobPart]), `protected-${Date.now()}.pdf`);
      setActiveTool(null);
      setProtectSource(null);
      setProtectPassword('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Protect failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockSource || !unlockPassword.trim()) {
      setError('Select a PDF and enter the password');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib-with-encrypt');
      const buf = await getPdfBuffer(unlockSource);
      const pdf = await PDFDocument.load(buf, { password: unlockPassword.trim() });
      const bytes = await pdf.save();
      await processResult(new Blob([bytes as BlobPart]), `unlocked-${Date.now()}.pdf`);
      setActiveTool(null);
      setUnlockSource(null);
      setUnlockPassword('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unlock failed. Wrong password or PDF not encrypted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedact = async () => {
    if (!redactSource) { setError('Select a PDF'); return; }
    setIsProcessing(true); setError(null);
    try {
      const buf = await getPdfBuffer(redactSource);
      const pdf = await PDFDocument.load(buf);
      const totalPages = pdf.getPageCount();
      const toRedact = new Set(
        redactPages.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n >= 1 && n <= totalPages)
      );
      const pages = pdf.getPages();
      for (let i = 0; i < pages.length; i++) {
        if (!toRedact.has(i + 1)) continue;
        const page = pages[i];
        const { width, height } = page.getSize();
        page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0, 0, 0) });
      }
      const bytes = await pdf.save();
      await processResult(new Blob([bytes as BlobPart]), `redacted-${Date.now()}.pdf`);
      setActiveTool(null); setRedactSource(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsProcessing(false); }
  };

  const handleReorderPages = async () => {
    if (!reorderPagesSource || reorderPageIndices.length === 0) { setError('Select a PDF'); return; }
    setIsProcessing(true); setError(null);
    try {
      const buf = await getPdfBuffer(reorderPagesSource);
      const src = await PDFDocument.load(buf);
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(src, reorderPageIndices);
      pages.forEach((p) => newPdf.addPage(p));
      const bytes = await newPdf.save();
      await processResult(new Blob([bytes as BlobPart]), `reordered-${Date.now()}.pdf`);
      setActiveTool(null); setReorderPagesSource(null); setReorderPageIndices([]);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Reorder failed'); } finally { setIsProcessing(false); }
  };

  const handleHeadersFooters = async () => {
    if (!headersFootersSource) { setError('Select a PDF'); return; }
    if (!headerText.trim() && !footerText.trim()) { setError('Enter header or footer text'); return; }
    setIsProcessing(true); setError(null);
    try {
      const buf = await getPdfBuffer(headersFootersSource);
      const pdf = await PDFDocument.load(buf);
      const font = await pdf.embedStandardFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { height } = page.getSize();
        const fontSize = 10;
        const yTop = height - 15;
        const yBottom = 15;
        if (headerText.trim()) {
          const text = headerText.replace(/{page}/g, String(i + 1)).replace(/{total}/g, String(pages.length));
          page.drawText(text, { x: 20, y: yTop, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
        }
        if (footerText.trim()) {
          const text = footerText.replace(/{page}/g, String(i + 1)).replace(/{total}/g, String(pages.length));
          page.drawText(text, { x: 20, y: yBottom, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
        }
      }
      const bytes = await pdf.save();
      await processResult(new Blob([bytes as BlobPart]), `headers-footers-${Date.now()}.pdf`);
      setActiveTool(null); setHeadersFootersSource(null); setHeaderText(''); setFooterText('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsProcessing(false); }
  };

  const handleRotateSpecific = async () => {
    if (!rotateSpecificSource) { setError('Select a PDF'); return; }
    setIsProcessing(true); setError(null);
    try {
      const buf = await getPdfBuffer(rotateSpecificSource);
      const pdf = await PDFDocument.load(buf);
      const totalPages = pdf.getPageCount();
      const toRotate = new Set<number>();
      for (const part of rotateSpecificPages.split(',').map((s) => s.trim())) {
        const m = part.match(/^(\d+)-(\d+)$/) || part.match(/^(\d+)$/);
        if (!m) continue;
        if (m[2]) {
          const a = Math.max(1, Math.min(parseInt(m[1], 10), totalPages));
          const b = Math.max(1, Math.min(parseInt(m[2], 10), totalPages));
          for (let n = Math.min(a, b); n <= Math.max(a, b); n++) toRotate.add(n);
        } else {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n >= 1 && n <= totalPages) toRotate.add(n);
        }
      }
      const pages = pdf.getPages();
      const rot = rotateSpecificAngle;
      for (let i = 0; i < pages.length; i++) {
        if (!toRotate.has(i + 1)) continue;
        const page = pages[i];
        const currentRot = toDegrees(page.getRotation());
        page.setRotation(degrees((currentRot + rot) % 360));
      }
      const bytes = await pdf.save();
      await processResult(new Blob([bytes as BlobPart]), `rotated-${Date.now()}.pdf`);
      setActiveTool(null); setRotateSpecificSource(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); } finally { setIsProcessing(false); }
  };

  const FileSourceButtons = ({ forTool }: { forTool: PickerFor }) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => openPicker(forTool)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
      >
        <Cloud className="w-4 h-4" /> From TAAS
      </button>
      <button
        type="button"
        onClick={() => openFileInput(forTool)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg font-medium hover:bg-cyan-100"
      >
        <Upload className="w-4 h-4" /> From computer
      </button>
    </div>
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleMergeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMergeItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleReorderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('page-', ''), 10);
      const newIndex = parseInt(String(over.id).replace('page-', ''), 10);
      if (!isNaN(oldIndex) && !isNaN(newIndex)) {
        setReorderPageIndices((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  const SortableReorderPageItem = ({ pageIndex, arrayIndex }: { pageIndex: number; arrayIndex: number }) => {
    const id = `page-${arrayIndex}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border bg-white',
          isDragging ? 'opacity-80 shadow-lg border-cyan-400 z-50' : 'border-slate-200'
        )}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="font-medium text-slate-800">Page {pageIndex + 1}</span>
      </div>
    );
  };

  const SortableMergeCard = ({ item, index }: { item: MergeItem; index: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border bg-white shadow-sm flex-shrink-0 min-w-[200px] sm:min-w-[240px]',
          isDragging ? 'opacity-80 shadow-lg border-cyan-400 z-50' : 'border-slate-200'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <PdfThumbnails source={item.source} maxPages={1} compact className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate" title={getSourceName(item.source)}>
                {getSourceName(item.source)}
              </p>
              <span className="text-xs text-slate-500 font-medium">#{index + 1} in merge order</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMergeItems((p) => p.filter((i) => i.id !== item.id))}
          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 self-end sm:self-center"
          aria-label="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const MergeFileList = () => (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Drag to reorder. First PDF will be at the top of the merged file.</p>
      <div className="flex flex-wrap gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMergeDragEnd}>
          <SortableContext items={mergeItems.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
            {mergeItems.map((item, i) => (
              <SortableMergeCard key={item.id} item={item} index={i} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <FileSourceButtons forTool="merge" />
    </div>
  );

  const SingleFileSelect = ({
    source,
    setSource,
    forTool,
    label = 'Select PDF',
    showThumbnails = true,
  }: {
    source: PdfSource | null;
    setSource: (s: PdfSource | null) => void;
    forTool: PickerFor;
    label?: string;
    showThumbnails?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openPicker(forTool)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
        >
          <Cloud className="w-4 h-4" /> From TAAS
        </button>
        <button
          type="button"
          onClick={() => openFileInput(forTool)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg font-medium hover:bg-cyan-100"
        >
          <Upload className="w-4 h-4" /> From computer
        </button>
        {source && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
            {getSourceName(source)}
            <button type="button" onClick={() => setSource(null)} className="text-emerald-600 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </span>
        )}
      </div>
      {source && showThumbnails && <PdfThumbnails source={source} className="mt-3" />}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <ModernSidebar />
      <main className="flex-1 md:ml-20 min-h-screen bg-[#f0f5fa]">
        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileInputChange} />
        <input ref={officeInputRef} type="file" accept=".doc,.docx,.ppt,.pptx,.xls,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleOfficeFileInputChange} />
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageInputChange} />
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-center gap-4 mb-4">
              <Link
                to="/plugins"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Plugins
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">PDF Tools</h1>
                <p className="text-slate-600 text-sm">Merge, split, compress, and transform PDFs</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium">
                <Monitor className="w-3.5 h-3.5" /> Client: Merge, Split, Extract, Watermark
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                <Server className="w-3.5 h-3.5" /> Server: Compress, Extract Text, Office→PDF, PDF→PDF/A
              </span>
            </div>
          </motion.div>

          {['Organize', 'Edit', 'Convert', 'Security', 'Tools'].map((cat) => (
            <div key={cat} className="mb-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {TOOLS.filter((t) => t.category === cat).map((tool, i) => (
                  <motion.button
                    key={tool.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setActiveTool(tool.id)}
                    className={cn(
                      'text-left p-4 rounded-2xl border transition-all duration-200',
                      'bg-white border-slate-200 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <tool.icon className="w-4 h-4 text-cyan-600" />
                      </div>
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', tool.side === 'client' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600')}>
                        {tool.side === 'client' ? <Monitor className="w-3 h-3 inline" /> : <Server className="w-3 h-3 inline" />}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{tool.name}</h3>
                    <p className="text-xs text-slate-600">{tool.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!activeTool} onOpenChange={(open) => { if (!open) { setActiveTool(null); setOcrResult(null); } }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {activeTool && (
              <>
                <DialogHeader>
                  <DialogTitle>{TOOLS.find((t) => t.id === activeTool)?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2 min-w-0 overflow-visible">

            {activeTool === 'merge' && (
              <div className="space-y-4">
                <MergeFileList />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save result to TAAS storage</span>
                </label>
                <button
                  onClick={handleMerge}
                  disabled={mergeItems.length < 2 || isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Merge & Download
                </button>
              </div>
            )}

            {activeTool === 'split' && (
              <div className="space-y-4">
                <SingleFileSelect source={splitSource} setSource={setSplitSource} forTool="split" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Page ranges (e.g. 1-3, 4-6, 7)</label>
                  <input type="text" value={splitRanges} onChange={(e) => setSplitRanges(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save results to TAAS storage</span>
                </label>
                <button onClick={handleSplit} disabled={!splitSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Split & Download
                </button>
              </div>
            )}

            {activeTool === 'extract' && (
              <div className="space-y-4">
                <SingleFileSelect source={extractSource} setSource={setExtractSource} forTool="extract" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Page numbers (e.g. 1, 3, 5)</label>
                  <input type="text" value={extractPages} onChange={(e) => setExtractPages(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save result to TAAS storage</span>
                </label>
                <button onClick={handleExtract} disabled={!extractSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Extract & Download
                </button>
              </div>
            )}

            {activeTool === 'watermark' && (
              <div className="space-y-4">
                <SingleFileSelect source={watermarkSource} setSource={setWatermarkSource} forTool="watermark" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Watermark text</label>
                  <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save result to TAAS storage</span>
                </label>
                <button onClick={handleWatermark} disabled={!watermarkSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Add Watermark & Download
                </button>
              </div>
            )}

            {activeTool === 'compress' && (
              <div className="space-y-4">
                <SingleFileSelect source={compressSource} setSource={setCompressSource} forTool="compress" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save result to TAAS storage</span>
                </label>
                <button onClick={handleCompress} disabled={!compressSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Compress & Download
                </button>
              </div>
            )}

            {activeTool === 'ocr' && (
              <div className="space-y-4">
                <SingleFileSelect source={ocrSource} setSource={setOcrSource} forTool="ocr" />
                <button onClick={handleOcr} disabled={!ocrSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanText className="w-5 h-5" />}
                  Extract Text
                </button>
                {ocrResult !== null && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Extracted text</label>
                      <button onClick={copyOcrResult} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-stone-200 rounded-lg text-sm">
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-50 rounded-xl text-sm text-slate-800 whitespace-pre-wrap max-h-64 overflow-y-auto border border-slate-200">
                      {ocrResult}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTool === 'rotate' && (
              <div className="space-y-4">
                <SingleFileSelect source={rotateSource} setSource={setRotateSource} forTool="rotate" />
                <p className="text-sm text-slate-600">Rotate all pages 90° clockwise</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleRotate} disabled={!rotateSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Rotate & Download
                </button>
              </div>
            )}

            {activeTool === 'pageNumbers' && (
              <div className="space-y-4">
                <SingleFileSelect source={pageNumbersSource} setSource={setPageNumbersSource} forTool="pageNumbers" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handlePageNumbers} disabled={!pageNumbersSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Add Numbers & Download
                </button>
              </div>
            )}

            {activeTool === 'crop' && (
              <div className="space-y-4">
                <SingleFileSelect source={cropSource} setSource={setCropSource} forTool="crop" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crop margin (px, 0–200)</label>
                  <input type="number" min={0} max={200} value={cropMargin} onChange={(e) => setCropMargin(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleCrop} disabled={!cropSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Crop & Download
                </button>
              </div>
            )}

            {activeTool === 'removePages' && (
              <div className="space-y-4">
                <SingleFileSelect source={removePagesSource} setSource={setRemovePagesSource} forTool="removePages" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pages to remove (e.g. 1, 3, 5 or 1-5)</label>
                  <input type="text" value={removePagesInput} onChange={(e) => setRemovePagesInput(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" placeholder="1, 3, 5-8" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleRemovePages} disabled={!removePagesSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Remove Pages & Download
                </button>
              </div>
            )}

            {activeTool === 'reorderPages' && (
              <div className="space-y-4">
                <SingleFileSelect source={reorderPagesSource} setSource={setReorderPagesSource} forTool="reorderPages" label="Select PDF to reorder" />
                {reorderPagesSource && reorderPageIndices.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Drag to reorder pages (top = first page)</p>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorderDragEnd}>
                        <SortableContext items={reorderPageIndices.map((_, i) => `page-${i}`)} strategy={verticalListSortingStrategy}>
                          {reorderPageIndices.map((pageIdx, i) => (
                            <SortableReorderPageItem key={`page-${i}`} pageIndex={pageIdx} arrayIndex={i} />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleReorderPages} disabled={!reorderPagesSource || reorderPageIndices.length === 0 || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Reorder & Download
                </button>
              </div>
            )}

            {activeTool === 'rotateSpecific' && (
              <div className="space-y-4">
                <SingleFileSelect source={rotateSpecificSource} setSource={setRotateSpecificSource} forTool="rotateSpecific" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pages to rotate (e.g. 1, 3, 5 or 1-5)</label>
                  <input type="text" value={rotateSpecificPages} onChange={(e) => setRotateSpecificPages(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" placeholder="1, 3, 5-8" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rotation angle</label>
                  <select value={rotateSpecificAngle} onChange={(e) => setRotateSpecificAngle(Number(e.target.value) as 90 | 180 | 270)} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                    <option value={90}>90° clockwise</option>
                    <option value={180}>180°</option>
                    <option value={270}>270° clockwise (90° counter-clockwise)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleRotateSpecific} disabled={!rotateSpecificSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Rotate Pages & Download
                </button>
              </div>
            )}

            {activeTool === 'headersFooters' && (
              <div className="space-y-4">
                <SingleFileSelect source={headersFootersSource} setSource={setHeadersFootersSource} forTool="headersFooters" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Header text (optional)</label>
                  <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" placeholder="Document title • Use {page} and {total} for page numbers" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Footer text (optional)</label>
                  <input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" placeholder="Page {page} of {total}" />
                </div>
                <p className="text-xs text-slate-500">Use {'{page}'} for current page, {'{total}'} for total pages</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleHeadersFooters} disabled={!headersFootersSource || (!headerText.trim() && !footerText.trim()) || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Add Headers & Footers
                </button>
              </div>
            )}

            {activeTool === 'imagesToPdf' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Images (JPG/PNG)</label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg font-medium hover:bg-cyan-100">
                      <Upload className="w-4 h-4" /> Add images
                    </button>
                    {imagesToPdfFiles.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
                        {f.name}
                        <button type="button" onClick={() => setImagesToPdfFiles((p) => p.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleImagesToPdf} disabled={imagesToPdfFiles.length === 0 || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Create PDF & Download
                </button>
              </div>
            )}

            {activeTool === 'pdfToImages' && (
              <div className="space-y-4">
                <SingleFileSelect source={pdfToImagesSource} setSource={setPdfToImagesSource} forTool="pdfToImages" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save images to TAAS</span>
                </label>
                <button onClick={handlePdfToImages} disabled={!pdfToImagesSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Export as JPG
                </button>
              </div>
            )}

            {activeTool === 'officeToPdf' && (
              <div className="space-y-4">
                <SingleFileSelect source={officeToPdfSource} setSource={setOfficeToPdfSource} forTool="officeToPdf" label="Select Word, PowerPoint, or Excel file" showThumbnails={false} />
                <p className="text-sm text-slate-600">Converts .doc, .docx, .ppt, .pptx, .xls, .xlsx to PDF. Requires LibreOffice on the server.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleOfficeToPdf} disabled={!officeToPdfSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Convert to PDF
                </button>
              </div>
            )}

            {activeTool === 'pdfToPdfa' && (
              <div className="space-y-4">
                <SingleFileSelect source={pdfToPdfaSource} setSource={setPdfToPdfaSource} forTool="pdfToPdfa" label="Select PDF to convert" />
                <p className="text-sm text-slate-600">Converts to PDF/A-1 (archival format for long-term preservation). Requires Ghostscript on the server.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handlePdfToPdfa} disabled={!pdfToPdfaSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Convert to PDF/A
                </button>
              </div>
            )}

            {activeTool === 'protect' && (
              <div className="space-y-4">
                <SingleFileSelect source={protectSource} setSource={setProtectSource} forTool="protect" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" value={protectPassword} onChange={(e) => setProtectPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" placeholder="Enter password" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save result to TAAS storage</span>
                </label>
                <button onClick={handleProtect} disabled={!protectSource || !protectPassword.trim() || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  Protect PDF
                </button>
              </div>
            )}

            {activeTool === 'unlock' && (
              <div className="space-y-4">
                <SingleFileSelect source={unlockSource} setSource={setUnlockSource} forTool="unlock" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" placeholder="Enter password" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save result to TAAS storage</span>
                </label>
                <button onClick={handleUnlock} disabled={!unlockSource || !unlockPassword.trim() || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                  Unlock PDF
                </button>
              </div>
            )}

            {activeTool === 'redact' && (
              <div className="space-y-4">
                <SingleFileSelect source={redactSource} setSource={setRedactSource} forTool="redact" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pages to redact (black out)</label>
                  <input type="text" value={redactPages} onChange={(e) => setRedactPages(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" placeholder="1, 2, 3" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={storeToTaas} onChange={(e) => setStoreToTaas(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Save to TAAS</span>
                </label>
                <button onClick={handleRedact} disabled={!redactSource || isProcessing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Redact & Download
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <FilePickerDialog
        isOpen={showFilePicker}
        onClose={() => { setShowFilePicker(false); setPickerFor(null); }}
        onSelect={handleSelectFromTaas}
        title={pickerFor === 'officeToPdf' ? 'Select Office file from TAAS' : 'Select PDF from TAAS'}
        filterMimeType={pickerFor === 'officeToPdf' ? 'officedocument' : 'pdf'}
      />
    </div>
  );
}
