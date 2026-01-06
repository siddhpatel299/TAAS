/**
 * Import Job Service
 * 
 * Handles background file imports from Telegram chats.
 * Uses in-memory job tracking (not persistent across restarts).
 * 
 * This solves the timeout issue on Render where large files
 * take longer than the 30-second request limit.
 */

import { telegramChatService } from './telegram-chat.service';

export interface ImportJob {
  id: string;
  userId: string;
  chatId: string;
  messageId: number;
  fileName: string;
  fileSize: number;
  folderId?: string;
  status: 'pending' | 'downloading' | 'uploading' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
  result?: {
    fileId: string;
    fileName: string;
    size: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// In-memory job store (not persistent across restarts)
const jobs = new Map<string, ImportJob>();

// Clean up old jobs periodically (keep last 100, max 1 hour old)
const cleanupJobs = () => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt.getTime() > maxAge) {
      jobs.delete(id);
    }
  }
  
  // Keep only last 100 jobs per user
  const userJobs = new Map<string, ImportJob[]>();
  for (const job of jobs.values()) {
    if (!userJobs.has(job.userId)) {
      userJobs.set(job.userId, []);
    }
    userJobs.get(job.userId)!.push(job);
  }
  
  for (const [userId, userJobList] of userJobs.entries()) {
    if (userJobList.length > 100) {
      // Sort by createdAt descending, delete oldest
      userJobList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      for (let i = 100; i < userJobList.length; i++) {
        jobs.delete(userJobList[i].id);
      }
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupJobs, 10 * 60 * 1000);

class ImportJobService {
  /**
   * Create a new import job and start processing in background
   */
  async createJob(
    userId: string,
    chatId: string,
    messageId: number,
    fileName: string,
    fileSize: number,
    folderId?: string
  ): Promise<ImportJob> {
    // Generate unique job ID
    const id = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ImportJob = {
      id,
      userId,
      chatId,
      messageId,
      fileName,
      fileSize,
      folderId,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    jobs.set(id, job);
    
    // Start processing in background (don't await)
    this.processJob(job).catch((error) => {
      console.error(`Job ${id} failed:`, error);
      job.status = 'failed';
      job.error = error.message || 'Unknown error';
      job.updatedAt = new Date();
    });
    
    return job;
  }
  
  /**
   * Get job status by ID
   */
  getJob(jobId: string, userId: string): ImportJob | null {
    const job = jobs.get(jobId);
    if (!job || job.userId !== userId) {
      return null;
    }
    return job;
  }
  
  /**
   * Get all jobs for a user (most recent first)
   */
  getUserJobs(userId: string): ImportJob[] {
    const userJobs: ImportJob[] = [];
    for (const job of jobs.values()) {
      if (job.userId === userId) {
        userJobs.push(job);
      }
    }
    return userJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Check if user has a pending/in-progress import for this message
   */
  hasActiveJobForMessage(userId: string, chatId: string, messageId: number): boolean {
    for (const job of jobs.values()) {
      if (
        job.userId === userId &&
        job.chatId === chatId &&
        job.messageId === messageId &&
        (job.status === 'pending' || job.status === 'downloading' || job.status === 'uploading')
      ) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Process the import job in background
   */
  private async processJob(job: ImportJob): Promise<void> {
    try {
      job.status = 'downloading';
      job.updatedAt = new Date();
      
      // The actual import is done by telegramChatService
      // We'll update progress based on estimated time
      const progressInterval = setInterval(() => {
        if (job.status === 'downloading' && job.progress < 45) {
          job.progress += 5;
          job.updatedAt = new Date();
        } else if (job.status === 'uploading' && job.progress < 95) {
          job.progress += 5;
          job.updatedAt = new Date();
        }
      }, 2000);
      
      try {
        // Simulate download phase progress
        job.progress = 10;
        
        const result = await telegramChatService.importFileFromMessage(
          job.userId,
          job.chatId,
          job.messageId,
          job.folderId
        );
        
        clearInterval(progressInterval);
        
        if (!result.success) {
          throw new Error(result.error || 'Import failed');
        }
        
        job.status = 'completed';
        job.progress = 100;
        job.result = {
          fileId: result.fileId!,
          fileName: result.fileName!,
          size: result.size!,
        };
        job.updatedAt = new Date();
        
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
      
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message || 'Import failed';
      job.updatedAt = new Date();
      throw error;
    }
  }
}

export const importJobService = new ImportJobService();
