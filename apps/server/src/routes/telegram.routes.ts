import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { telegramChatService } from '../services/telegram-chat.service';
import { deferredImportService } from '../services/deferred-import.service';

const router: Router = Router();

/**
 * Telegram Chats Routes
 * 
 * These routes provide manual, on-demand access to Telegram chats.
 * Users can browse their chats, view messages with files, and import
 * individual files to TAAS.
 * 
 * CRITICAL RULES:
 * - All operations are manual (triggered by user click)
 * - One file per import action (no bulk/batch)
 * - No chat scanning, indexing, or polling
 * - No background sync or scheduled jobs
 * - Imports are deferred (async) but NOT autonomous
 */

// Get user's Telegram chats/groups/channels
router.get('/chats', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const chats = await telegramChatService.getChats(req.user!.id);

  res.json({
    success: true,
    data: chats,
  });
}));

// Get messages from a specific chat
router.get('/chats/:chatId/messages', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { limit, offsetId, filesOnly, fileType } = req.query;

  const result = await telegramChatService.getChatMessages(
    req.user!.id,
    chatId,
    {
      limit: limit ? parseInt(limit as string) : 50,
      offsetId: offsetId ? parseInt(offsetId as string) : undefined,
      filesOnly: filesOnly !== 'false', // Default to true
      fileType: (fileType as 'all' | 'video' | 'photo' | 'document' | 'audio') || 'all',
    }
  );

  res.json({
    success: true,
    data: result.messages,
    meta: {
      hasMore: result.hasMore,
      counts: result.counts,
    },
  });
}));

// Get a single message by ID
router.get('/chats/:chatId/messages/:messageId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chatId, messageId } = req.params;

  const message = await telegramChatService.getMessage(
    req.user!.id,
    chatId,
    parseInt(messageId)
  );

  if (!message) {
    throw new ApiError('Message not found', 404);
  }

  res.json({
    success: true,
    data: message,
  });
}));

// Import a file from a specific message to TAAS
// User-initiated, one file at a time, deferred for large files
router.post('/chats/:chatId/messages/:messageId/import', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chatId, messageId } = req.params;
  const { folderId } = req.body;

  // Validate messageId
  const msgId = parseInt(messageId);
  if (isNaN(msgId)) {
    throw new ApiError('Invalid message ID', 400);
  }

  // Get file info first to determine size
  const message = await telegramChatService.getMessage(req.user!.id, chatId, msgId);
  if (!message) {
    throw new ApiError('Message not found', 404);
  }

  // Determine file size and name
  let fileSize = 0;
  let fileName = 'unknown';
  if (message.hasDocument && message.document) {
    fileSize = message.document.size;
    fileName = message.document.fileName;
  } else if (message.hasVideo && message.video) {
    fileSize = message.video.size;
    fileName = message.video.fileName;
  } else if (message.hasPhoto && message.photo) {
    fileSize = message.photo.size;
    fileName = `photo_${msgId}.jpg`;
  } else if (message.hasAudio && message.audio) {
    fileSize = message.audio.size;
    fileName = message.audio.fileName;
  }

  // For files > 10MB, use deferred import to avoid timeout
  // This is still user-initiated, just async to handle slow transfers
  const TEN_MB = 10 * 1024 * 1024;
  
  if (fileSize > TEN_MB) {
    try {
      // Start deferred import (validates session, checks limits)
      const imp = await deferredImportService.startImport(
        req.user!.id,
        chatId,
        msgId,
        fileName,
        fileSize,
        folderId
      );

      res.json({
        success: true,
        deferred: true,
        importId: imp.id,
        message: `Import started for "${fileName}" (${(fileSize / (1024 * 1024)).toFixed(2)} MB). This may take a few minutes.`,
      });
    } catch (error: any) {
      throw new ApiError(error.message || 'Failed to start import', 400);
    }
    return;
  }

  // For smaller files, import synchronously
  const result = await telegramChatService.importFileFromMessage(
    req.user!.id,
    chatId,
    msgId,
    folderId
  );

  if (!result.success) {
    throw new ApiError(result.error || 'Failed to import file', 500);
  }

  res.json({
    success: true,
    deferred: false,
    data: {
      fileId: result.fileId,
      fileName: result.fileName,
      size: result.size,
    },
    message: `Successfully imported "${result.fileName}" to TAAS`,
  });
}));

// Get deferred import status
router.get('/imports/:importId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { importId } = req.params;

  const imp = deferredImportService.getImport(importId, req.user!.id);
  if (!imp) {
    throw new ApiError('Import not found', 404);
  }

  res.json({
    success: true,
    data: imp,
  });
}));

// Get user's recent imports (for status display, limited to 10)
router.get('/imports', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const imports = deferredImportService.getUserImports(req.user!.id);

  res.json({
    success: true,
    data: imports,
  });
}));

// Stream media (video/audio) from Telegram message
// Enables preview without importing - uses HTTP Range for seeking
router.get('/chats/:chatId/messages/:messageId/stream', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chatId, messageId } = req.params;
  
  const msgId = parseInt(messageId);
  if (isNaN(msgId)) {
    throw new ApiError('Invalid message ID', 400);
  }

  try {
    const { stream, mimeType, size, fileName } = await telegramChatService.streamMediaFromMessage(
      req.user!.id,
      chatId,
      msgId
    );

    // Handle stream errors
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Stream failed' });
      }
    });

    // Handle client disconnect
    res.on('close', () => {
      stream.destroy();
    });

    // Handle range requests for video seeking
    const range = req.headers.range;
    
    if (range && size > 0) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', mimeType);
      
      // Note: For full range support, we'd need random access to Telegram files
      // For now, we stream from the beginning
      stream.pipe(res);
    } else {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
      if (size > 0) {
        res.setHeader('Content-Length', size);
        res.setHeader('Accept-Ranges', 'bytes');
      }
      stream.pipe(res);
    }
  } catch (error: any) {
    console.error('Stream media error:', error.message);
    throw new ApiError(error.message || 'Failed to stream media', 500);
  }
}));

export default router;
