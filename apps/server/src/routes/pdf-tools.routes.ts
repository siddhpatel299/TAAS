import { Router, Response, IRouter } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';

const router: IRouter = Router();
const execFileAsync = promisify(execFile);

const OFFICE_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/msword', // doc
  'application/vnd.ms-powerpoint', // ppt
  'application/vnd.ms-excel',
];

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, os.tmpdir()),
    filename: (_, file, cb) =>
      cb(null, `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || '.pdf'}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

const officeUpload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, os.tmpdir()),
    filename: (_, file, cb) =>
      cb(null, `office-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || ''}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_, file, cb) => {
    const allowed = OFFICE_MIMES.includes(file.mimetype) ||
      file.originalname.match(/\.(docx?|pptx?|xlsx?)$/i);
    if (allowed) cb(null, true);
    else cb(new Error('Only Word, PowerPoint, and Excel files are allowed'));
  },
});

// Compress PDF - server-side
router.post('/compress', authMiddleware, upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError('No file uploaded', 400);

  const inputPath = req.file.path;
  try {
    const data = await fs.promises.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
    const bytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compressed-${req.file.originalname}"`);
    res.send(Buffer.from(bytes));
  } finally {
    await fs.promises.unlink(inputPath).catch(() => {});
  }
}));

// OCR / Extract Text - server-side
router.post('/extract-text', authMiddleware, upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError('No file uploaded', 400);

  const inputPath = req.file.path;
  try {
    const data = await fs.promises.readFile(inputPath);
    const parser = new PDFParse({ data });
    const result = await parser.getText();
    await parser.destroy();

    res.json({
      success: true,
      data: {
        text: result.text || '',
        numPages: result.total ?? 0,
        info: {},
      },
    });
  } finally {
    await fs.promises.unlink(inputPath).catch(() => {});
  }
}));

// Office to PDF (Word, PowerPoint, Excel) - requires LibreOffice installed
router.post('/office-to-pdf', authMiddleware, officeUpload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError('No file uploaded', 400);

  const inputPath = req.file.path;
  try {
    const libre = await import('libreoffice-convert');
    const convertAsync = promisify(libre.convert);

    const data = await fs.promises.readFile(inputPath);
    const pdfBuf = await convertAsync(data, '.pdf', undefined);

    const baseName = req.file.originalname.replace(/\.[^.]+$/, '') || 'converted';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
    res.send(Buffer.from(pdfBuf as Buffer));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Conversion failed';
    if (msg.includes('soffice') || msg.includes('LibreOffice') || msg.includes('ENOENT')) {
      throw new ApiError('Office conversion requires LibreOffice. Install it on the server (e.g. apt install libreoffice).', 503);
    }
    throw new ApiError(msg, 500);
  } finally {
    await fs.promises.unlink(inputPath).catch(() => {});
  }
}));

// PDF to PDF/A (archival format) - requires Ghostscript installed
router.post('/pdf-to-pdfa', authMiddleware, upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError('No file uploaded', 400);

  const inputPath = req.file.path;
  const outputPath = path.join(os.tmpdir(), `pdfa-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);

  try {
    await execFileAsync('gs', [
      '-dPDFA=1',
      '-dBATCH',
      '-dNOPAUSE',
      '-dNOOUTERSAVE',
      '-sColorConversionStrategy=RGB',
      '-sDEVICE=pdfwrite',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ], { timeout: 120000 });

    const data = await fs.promises.readFile(outputPath);
    const baseName = req.file.originalname.replace(/\.pdf$/i, '') || 'converted';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}-pdfa.pdf"`);
    res.send(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Conversion failed';
    if (msg.includes('gs') || msg.includes('ENOENT') || msg.includes('spawn')) {
      throw new ApiError('PDF/A conversion requires Ghostscript. Install it on the server (e.g. apt install ghostscript).', 503);
    }
    throw new ApiError(msg, 500);
  } finally {
    await fs.promises.unlink(inputPath).catch(() => {});
    await fs.promises.unlink(outputPath).catch(() => {});
  }
}));

export default router;
