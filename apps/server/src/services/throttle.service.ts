/**
 * Upload Throttle Service
 * 
 * Implements human-like upload behavior to avoid triggering
 * Telegram's abuse detection systems.
 */

import { EventEmitter } from 'events';

// Configuration
const MIN_CHUNK_DELAY_MS = 500;
const MAX_CHUNK_DELAY_MS = 2000;
const MIN_FILE_DELAY_MS = 1000;
const MAX_FILE_DELAY_MS = 3000;
const JITTER_FACTOR = 0.3;
const MAX_CHUNKS_PER_MINUTE = 10;
const COOLDOWN_PERIOD_MS = 60000; // 1 minute

interface UploadSession {
  userId: string;
  sessionId: string;
  startTime: number;
  chunksUploaded: number;
  lastChunkTime: number;
  totalChunks: number;
}

interface ThrottleState {
  lastUploadTime: number;
  uploadsInLastMinute: number;
  isInCooldown: boolean;
  cooldownUntil: number;
}

export class ThrottleService extends EventEmitter {
  private userStates: Map<string, ThrottleState> = new Map();
  private activeSessions: Map<string, UploadSession> = new Map();

  /**
   * Get or create throttle state for a user
   */
  private getState(userId: string): ThrottleState {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        lastUploadTime: 0,
        uploadsInLastMinute: 0,
        isInCooldown: false,
        cooldownUntil: 0,
      });
    }
    return this.userStates.get(userId)!;
  }

  /**
   * Add jitter to a delay value
   */
  private addJitter(baseDelay: number): number {
    const jitter = baseDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
    return Math.max(MIN_CHUNK_DELAY_MS, Math.round(baseDelay + jitter));
  }

  /**
   * Calculate delay for the next chunk based on upload patterns
   */
  calculateChunkDelay(session: UploadSession): number {
    const state = this.getState(session.userId);
    const now = Date.now();

    // Check if in cooldown
    if (state.isInCooldown && now < state.cooldownUntil) {
      return state.cooldownUntil - now;
    }

    // Reset cooldown if expired
    if (state.isInCooldown && now >= state.cooldownUntil) {
      state.isInCooldown = false;
      state.uploadsInLastMinute = 0;
    }

    // Calculate progress-based delay (slower as upload progresses)
    const progressFactor = 1 + (session.chunksUploaded / session.totalChunks) * 0.5;
    
    // Calculate load-based delay (slower if many recent uploads)
    const loadFactor = 1 + (state.uploadsInLastMinute / MAX_CHUNKS_PER_MINUTE) * 2;

    // Base delay with factors
    const baseDelay = MIN_CHUNK_DELAY_MS + 
      Math.random() * (MAX_CHUNK_DELAY_MS - MIN_CHUNK_DELAY_MS);
    
    const calculatedDelay = baseDelay * progressFactor * loadFactor;
    
    return this.addJitter(calculatedDelay);
  }

  /**
   * Calculate delay between files
   */
  calculateFileDelay(userId: string): number {
    const state = this.getState(userId);
    const now = Date.now();

    // If last upload was very recent, add extra delay
    const timeSinceLastUpload = now - state.lastUploadTime;
    if (timeSinceLastUpload < MIN_FILE_DELAY_MS) {
      return MIN_FILE_DELAY_MS - timeSinceLastUpload + this.addJitter(500);
    }

    // Base file delay with jitter
    const baseDelay = MIN_FILE_DELAY_MS + 
      Math.random() * (MAX_FILE_DELAY_MS - MIN_FILE_DELAY_MS);
    
    return this.addJitter(baseDelay);
  }

  /**
   * Check if user can proceed with upload
   */
  canProceed(userId: string): { allowed: boolean; waitTime: number; reason?: string } {
    const state = this.getState(userId);
    const now = Date.now();

    // Check cooldown
    if (state.isInCooldown && now < state.cooldownUntil) {
      return {
        allowed: false,
        waitTime: state.cooldownUntil - now,
        reason: 'Rate limit cooldown active',
      };
    }

    // Check uploads per minute
    if (state.uploadsInLastMinute >= MAX_CHUNKS_PER_MINUTE) {
      // Trigger cooldown
      state.isInCooldown = true;
      state.cooldownUntil = now + COOLDOWN_PERIOD_MS;
      
      return {
        allowed: false,
        waitTime: COOLDOWN_PERIOD_MS,
        reason: 'Too many uploads, entering cooldown',
      };
    }

    return { allowed: true, waitTime: 0 };
  }

  /**
   * Start an upload session
   */
  startSession(userId: string, sessionId: string, totalChunks: number): UploadSession {
    const session: UploadSession = {
      userId,
      sessionId,
      startTime: Date.now(),
      chunksUploaded: 0,
      lastChunkTime: Date.now(),
      totalChunks,
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): UploadSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Record a chunk upload
   */
  recordChunkUpload(sessionId: string): { nextDelay: number } {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const state = this.getState(session.userId);
    const now = Date.now();

    // Update session
    session.chunksUploaded++;
    session.lastChunkTime = now;

    // Update state
    state.lastUploadTime = now;
    state.uploadsInLastMinute++;

    // Clean up old upload counts (sliding window)
    setTimeout(() => {
      const currentState = this.userStates.get(session.userId);
      if (currentState) {
        currentState.uploadsInLastMinute = Math.max(0, currentState.uploadsInLastMinute - 1);
      }
    }, 60000);

    // Calculate next delay
    const nextDelay = this.calculateChunkDelay(session);

    this.emit('chunkUploaded', {
      sessionId,
      chunkIndex: session.chunksUploaded - 1,
      totalChunks: session.totalChunks,
      nextDelay,
    });

    return { nextDelay };
  }

  /**
   * End an upload session
   */
  endSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.emit('sessionEnded', {
        sessionId,
        userId: session.userId,
        duration: Date.now() - session.startTime,
        chunksUploaded: session.chunksUploaded,
      });
    }
    this.activeSessions.delete(sessionId);
  }

  /**
   * Get upload statistics for a user
   */
  getUserStats(userId: string): {
    uploadsInLastMinute: number;
    isInCooldown: boolean;
    cooldownRemaining: number;
    activeSessions: number;
  } {
    const state = this.getState(userId);
    const now = Date.now();

    const activeSessions = Array.from(this.activeSessions.values())
      .filter(s => s.userId === userId).length;

    return {
      uploadsInLastMinute: state.uploadsInLastMinute,
      isInCooldown: state.isInCooldown && now < state.cooldownUntil,
      cooldownRemaining: state.isInCooldown ? Math.max(0, state.cooldownUntil - now) : 0,
      activeSessions,
    };
  }

  /**
   * Sleep helper for delays
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with throttling
   */
  async executeWithThrottle<T>(
    userId: string,
    operation: () => Promise<T>,
    sessionId?: string
  ): Promise<T> {
    // Check if can proceed
    const { allowed, waitTime, reason } = this.canProceed(userId);
    
    if (!allowed) {
      console.log(`Throttling user ${userId}: ${reason}, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    // If session exists, calculate and apply chunk delay
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session && session.chunksUploaded > 0) {
        const delay = this.calculateChunkDelay(session);
        await this.sleep(delay);
      }
    }

    // Execute the operation
    const result = await operation();

    // Record the upload if in a session
    if (sessionId) {
      this.recordChunkUpload(sessionId);
    }

    return result;
  }
}

export const throttleService = new ThrottleService();
