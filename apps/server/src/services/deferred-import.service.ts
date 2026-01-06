/**
 * Deferred Import Service
 * 
 * Handles user-initiated async file imports from Telegram chats.
 * 
 * CRITICAL DESIGN PRINCIPLES:
 * - Every import is triggered by explicit user action (click)
 * - One import = one file = one message = one intent
 * - No retries, no batching, no scheduling
 * - Import dies if user session is invalid
 * - Maximum runtime enforced (5 minutes)
 * - Not persistent across server restarts (intentional)
 * 
 * This is NOT a "job queue" or "worker system".
 * This is a deferred user action that may take time.
 */

import { telegramChatService } from './telegram-chat.service';
import { telegramService } from './telegram.service';

export interface DeferredImport {
  id: string;
  userId: string;
  chatId: string;
  messageId: number;
  fileName: string;
  fileSize: number;
  folderId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'aborted';
  error?: string;
  result?: {
    fileId: string;
    fileName: string;
    size: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

// Configuration - strict limits
const CONFIG = {
  MAX_RUNTIME_MS: 5 * 60 * 1000,      // 5 minutes max per import
  MAX_IMPORTS_PER_USER: 10,            // Max pending imports per user
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000,  // Cleanup every 5 minutes
  MAX_AGE_MS: 30 * 60 * 1000,          // Delete completed imports after 30 min
  RETRY_COUNT: 0,                       // Zero retries - fail fast
};

// In-memory store (intentionally not persistent)
const imports = new Map<string, DeferredImport>();

// Cleanup old imports periodically
const cleanupImports = () => {
  const now = Date.now();
  
  for (const [id, imp] of imports.entries()) {
    const age = now - imp.createdAt.getTime();
    
    // Delete old completed/failed/aborted imports
    if (
      (imp.status === 'completed' || imp.status === 'failed' || imp.status === 'aborted') &&
      age > CONFIG.MAX_AGE_MS
    ) {
      imports.delete(id);
      continue;
    }
    
    // Abort stuck imports (exceeded max runtime)
    if (
      (imp.status === 'pending' || imp.status === 'processing') &&
      age > CONFIG.MAX_RUNTIME_MS
    ) {
      imp.status = 'aborted';
      imp.error = 'Import exceeded maximum runtime (5 minutes)';
      imp.completedAt = new Date();
    }
  }
};

setInterval(cleanupImports, CONFIG.CLEANUP_INTERVAL_MS);

class DeferredImportService {
  /**
   * Start a deferred import for a user action.
   * 
   * Validates:
   * - User has valid Telegram session
   * - No duplicate import for same message
   * - User hasn't exceeded import limit
   */
  async startImport(
    userId: string,
    chatId: string,
    messageId: number,
    fileName: string,
    fileSize: number,
    folderId?: string
  ): Promise<DeferredImport> {
    // CRITICAL: Verify user has active Telegram session
    const client = await telegramService.getClient(userId);
    if (!client) {
      throw new Error('No active Telegram session. Please log in again.');
    }

    // Check for duplicate import
    if (this.hasActiveImport(userId, chatId, messageId)) {
      throw new Error('Import already in progress for this file');
    }

    // Check user import limit
    const activeCount = this.getActiveImportCount(userId);
    if (activeCount >= CONFIG.MAX_IMPORTS_PER_USER) {
      throw new Error(`Maximum ${CONFIG.MAX_IMPORTS_PER_USER} concurrent imports allowed`);
    }

    // Create import record
    const id = `import_${userId.slice(-6)}_${Date.now()}`;
    
    const imp: DeferredImport = {
      id,
      userId,
      chatId,
      messageId,
      fileName,
      fileSize,
      folderId,
      status: 'pending',
      createdAt: new Date(),
    };
    
    imports.set(id, imp);
    
    // Process immediately (no queue, no delay)
    // This runs async but we don't await - returns to user immediately
    this.processImport(imp);
    
    return imp;
  }

  /**
   * Get import status.
   * Only returns imports belonging to the requesting user.
   */
  getImport(importId: string, userId: string): DeferredImport | null {
    const imp = imports.get(importId);
    if (!imp || imp.userId !== userId) {
      return null;
    }
    return imp;
  }

  /**
   * Get user's recent imports (for status display).
   * Limited to last 10.
   */
  getUserImports(userId: string): DeferredImport[] {
    const userImports: DeferredImport[] = [];
    
    for (const imp of imports.values()) {
      if (imp.userId === userId) {
        userImports.push(imp);
      }
    }
    
    return userImports
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  /**
   * Check if user has active import for specific message.
   */
  hasActiveImport(userId: string, chatId: string, messageId: number): boolean {
    for (const imp of imports.values()) {
      if (
        imp.userId === userId &&
        imp.chatId === chatId &&
        imp.messageId === messageId &&
        (imp.status === 'pending' || imp.status === 'processing')
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Count active imports for user.
   */
  private getActiveImportCount(userId: string): number {
    let count = 0;
    for (const imp of imports.values()) {
      if (
        imp.userId === userId &&
        (imp.status === 'pending' || imp.status === 'processing')
      ) {
        count++;
      }
    }
    return count;
  }

  /**
   * Process the import.
   * 
   * CRITICAL BEHAVIOR:
   * - No retries on failure
   * - Aborts if session becomes invalid
   * - Has hard timeout
   * - One file only
   */
  private async processImport(imp: DeferredImport): Promise<void> {
    const startTime = Date.now();
    
    try {
      imp.status = 'processing';
      
      // CRITICAL: Re-verify session before processing
      const client = await telegramService.getClient(imp.userId);
      if (!client) {
        imp.status = 'aborted';
        imp.error = 'Session expired. Please log in again.';
        imp.completedAt = new Date();
        return;
      }

      // Set hard timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Import timed out (5 minute limit)'));
        }, CONFIG.MAX_RUNTIME_MS);
      });

      // Race between import and timeout
      const importPromise = telegramChatService.importFileFromMessage(
        imp.userId,
        imp.chatId,
        imp.messageId,
        imp.folderId
      );

      const result = await Promise.race([importPromise, timeoutPromise]);

      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }

      // Success - record result
      imp.status = 'completed';
      imp.result = {
        fileId: result.fileId!,
        fileName: result.fileName!,
        size: result.size!,
      };
      imp.completedAt = new Date();

      console.log(
        `[DeferredImport] Completed: ${imp.fileName} (${imp.fileSize} bytes) ` +
        `in ${Date.now() - startTime}ms for user ${imp.userId.slice(-6)}`
      );

    } catch (error: any) {
      // CRITICAL: No retry logic - fail immediately
      imp.status = 'failed';
      imp.error = error.message || 'Unknown error';
      imp.completedAt = new Date();

      console.error(
        `[DeferredImport] Failed: ${imp.fileName} for user ${imp.userId.slice(-6)}: ${imp.error}`
      );
    }
  }
}

export const deferredImportService = new DeferredImportService();
