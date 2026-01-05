import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { telegramChatService } from '../services/telegram-chat.service';

const router: Router = Router();

/**
 * Telegram Chats Routes
 * 
 * These routes provide manual, on-demand access to Telegram chats.
 * Users can browse their chats, view messages with files, and import
 * individual files to TAAS.
 * 
 * Rules:
 * - All operations are manual (triggered by user action)
 * - One file per import action (no bulk/batch operations)
 * - No chat scanning, indexing, or polling
 * - No background sync or scheduled jobs
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
  const { limit, offsetId, filesOnly } = req.query;

  const result = await telegramChatService.getChatMessages(
    req.user!.id,
    chatId,
    {
      limit: limit ? parseInt(limit as string) : 50,
      offsetId: offsetId ? parseInt(offsetId as string) : undefined,
      filesOnly: filesOnly !== 'false', // Default to true
    }
  );

  res.json({
    success: true,
    data: result.messages,
    meta: {
      hasMore: result.hasMore,
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
// This is the key action - manual, one file at a time
router.post('/chats/:chatId/messages/:messageId/import', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chatId, messageId } = req.params;
  const { folderId } = req.body;

  // Validate messageId is provided and is a number
  const msgId = parseInt(messageId);
  if (isNaN(msgId)) {
    throw new ApiError('Invalid message ID', 400);
  }

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
    data: {
      fileId: result.fileId,
      fileName: result.fileName,
      size: result.size,
    },
    message: `Successfully imported "${result.fileName}" to TAAS`,
  });
}));

export default router;
