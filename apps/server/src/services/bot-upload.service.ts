/**
 * Bot Upload Service
 * 
 * Uses Telegram Bot API for parallel file chunk uploads.
 * Supports MULTIPLE bots for even more parallelism!
 * Bot API is HTTP-based, so no AUTH_KEY_DUPLICATED issues!
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { config } from '../config';
import crypto from 'crypto';

// Bot API has 50MB limit - use 20MB chunks for more parallelism
const BOT_UPLOAD_LIMIT = 50 * 1024 * 1024; // 50MB
const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks - smaller for more parallelism
const MIN_SIZE_FOR_BOT_UPLOAD = 50 * 1024 * 1024; // 50MB threshold

interface BotUploadParams {
    channelId: string;
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    onProgress?: (progress: number) => void;
}

interface ChunkUploadResult {
    chunkIndex: number;
    messageId: number;
    fileId: string;
    size: number;
}

interface BotUploadResult {
    success: boolean;
    isChunked: boolean;
    checksum: string;
    chunks: ChunkUploadResult[];
    totalSize: number;
}

export class BotUploadService {
    private botTokens: string[] = [];

    constructor() {
        // Support multiple bot tokens for more parallelism
        // TELEGRAM_BOT_TOKEN=token1,token2,token3,token4
        const tokenConfig = config.telegramBotToken;
        if (tokenConfig) {
            // Split by comma to support multiple tokens
            this.botTokens = tokenConfig.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }

        if (this.botTokens.length > 0) {
            console.log(`[BotUpload] Initialized with ${this.botTokens.length} bot(s)`);
        }
    }

    /**
     * Check if bot upload is available
     */
    isAvailable(): boolean {
        return this.botTokens.length > 0;
    }

    /**
     * Get number of available bots
     */
    getBotCount(): number {
        return this.botTokens.length;
    }

    /**
     * Check if file is suitable for bot upload
     */
    shouldUseBotUpload(size: number): boolean {
        return this.isAvailable() && size > MIN_SIZE_FOR_BOT_UPLOAD;
    }

    /**
     * Upload file using Bot API with parallel chunks
     * Uses round-robin distribution across multiple bots
     */
    async uploadFile(params: BotUploadParams): Promise<BotUploadResult> {
        const { channelId, buffer, fileName, mimeType, onProgress } = params;

        if (this.botTokens.length === 0) {
            throw new Error('No bot tokens configured');
        }

        const checksum = this.calculateHash(buffer);
        const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);

        // Calculate parallelism - upload one chunk per bot at a time
        const maxParallel = this.botTokens.length;

        console.log(`[BotUpload] Starting parallel upload: ${fileName}`);
        console.log(`[BotUpload] Size: ${(buffer.length / 1024 / 1024).toFixed(1)} MB, ${totalChunks} chunks, ${maxParallel} bots`);

        // Split buffer into chunks
        const chunks: { index: number; data: Buffer }[] = [];
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, buffer.length);
            chunks.push({ index: i, data: buffer.slice(start, end) });
        }

        // Track progress for each chunk
        const chunkProgress: number[] = new Array(totalChunks).fill(0);
        const updateProgress = () => {
            if (onProgress) {
                const total = chunkProgress.reduce((a, b) => a + b, 0) / totalChunks;
                onProgress(total);
            }
        };

        // Upload chunks in parallel batches, distributing across bots
        const results: ChunkUploadResult[] = [];
        const startTime = Date.now();

        for (let batchStart = 0; batchStart < totalChunks; batchStart += maxParallel) {
            const batchEnd = Math.min(batchStart + maxParallel, totalChunks);
            const batchChunks = chunks.slice(batchStart, batchEnd);

            console.log(`[BotUpload] Batch ${Math.floor(batchStart / maxParallel) + 1}/${Math.ceil(totalChunks / maxParallel)} (${batchChunks.length} parallel)`);

            const batchPromises = batchChunks.map(async (chunk, batchIndex) => {
                const chunkName = totalChunks > 1
                    ? `${fileName}.part${chunk.index + 1}of${totalChunks}`
                    : fileName;

                // Round-robin bot selection within batch
                const botToken = this.botTokens[batchIndex % this.botTokens.length];

                const result = await this.uploadChunk(
                    botToken,
                    channelId,
                    chunk.data,
                    chunkName,
                    mimeType,
                    (progress) => {
                        chunkProgress[chunk.index] = progress;
                        updateProgress();
                    }
                );

                return {
                    chunkIndex: chunk.index,
                    messageId: result.messageId,
                    fileId: result.fileId,
                    size: chunk.data.length,
                };
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        // Sort by chunk index
        results.sort((a, b) => a.chunkIndex - b.chunkIndex);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const speed = ((buffer.length / 1024 / 1024) / parseFloat(elapsed)).toFixed(1);
        console.log(`[BotUpload] Completed: ${fileName} in ${elapsed}s (${speed} MB/s)`);

        return {
            success: true,
            isChunked: totalChunks > 1,
            checksum,
            chunks: results,
            totalSize: buffer.length,
        };
    }

    /**
     * Download a single chunk via Bot API (public for streaming downloads)
     */
    public async downloadChunk(botToken: string, fileId: string): Promise<Buffer> {
        // Step 1: Get file path from Telegram
        const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`;

        try {
            const fileInfoResponse = await axios.get(getFileUrl, { timeout: 30000 }); // 30s for file info

            if (!fileInfoResponse.data.ok) {
                throw new Error(fileInfoResponse.data.description || 'Failed to get file info');
            }

            const filePath = fileInfoResponse.data.result.file_path;

            // Step 2: Download the file
            const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

            const response = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000, // 2 minutes for 20MB chunks
            });

            return Buffer.from(response.data);
        } catch (error: any) {
            console.error(`[BotDownload] Download failed:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Download a single chunk by file ID (convenience wrapper)
     */
    public async downloadSingleChunk(fileId: string, chunkIndex: number = 0): Promise<Buffer> {
        const botToken = this.getNextBotToken(chunkIndex);
        return this.downloadChunk(botToken, fileId);
    }

    /**
     * Get next bot token for round-robin distribution
     */
    getNextBotToken(currentIndex: number): string {
        if (this.botTokens.length === 0) return '';
        return this.botTokens[currentIndex % this.botTokens.length];
    }

    /**
     * Upload a single chunk via Bot API
     * Made public to allow streaming uploads from routes
     */
    public async uploadChunk(
        botToken: string,
        channelId: string,
        buffer: Buffer,
        fileName: string,
        mimeType: string,
        onProgress?: (progress: number) => void
    ): Promise<{ messageId: number; fileId: string; size: number }> {
        const formData = new FormData();

        // Channel ID format for Bot API
        // If channelId is like "1234567890", we need to prepend "-100"
        let chatId = channelId;
        if (!channelId.startsWith('-')) {
            chatId = `-100${channelId}`;
        }

        console.log(`[BotUpload] Using channel ID: ${channelId} -> chat_id: ${chatId}`);

        formData.append('chat_id', chatId);
        formData.append('document', buffer, {
            filename: fileName,
            contentType: mimeType,
        });
        formData.append('caption', `📦 ${fileName}`);

        const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

        // Retry logic for transient network errors
        const maxRetries = 3;
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[BotUpload] Attempt ${attempt}/${maxRetries} for ${fileName}`);

                // Need to recreate formData for retry (streams can only be read once)
                const retryFormData = new FormData();
                retryFormData.append('chat_id', chatId);
                retryFormData.append('document', buffer, {
                    filename: fileName,
                    contentType: mimeType,
                });
                retryFormData.append('caption', `📦 ${fileName}`);

                const response = await axios.post(url, retryFormData, {
                    headers: retryFormData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 120000, // 2 minutes for 20MB chunks
                    onUploadProgress: (progressEvent) => {
                        if (onProgress && progressEvent.total) {
                            const progress = (progressEvent.loaded / progressEvent.total) * 100;
                            onProgress(progress);
                        }
                    },
                });

                if (!response.data.ok) {
                    throw new Error(response.data.description || 'Bot API error');
                }

                const message = response.data.result;
                const document = message.document;

                console.log(`[BotUpload] Success on attempt ${attempt}`);
                return {
                    messageId: message.message_id,
                    fileId: document.file_id,
                    size: document.file_size
                };
            } catch (error: any) {
                lastError = error;
                const isRetryable = error.code === 'ETIMEDOUT' ||
                    error.code === 'ECONNRESET' ||
                    error.code === 'ENETUNREACH' ||
                    error.message?.includes('timeout');

                console.error(`[BotUpload] Attempt ${attempt} failed:`, error.code || error.message);

                if (attempt < maxRetries && isRetryable) {
                    const delay = Math.pow(2, attempt) * 2500; // 5s, 10s, 20s
                    console.log(`[BotUpload] Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else if (!isRetryable) {
                    break; // Don't retry non-transient errors
                }
            }
        }

        console.error(`[BotUpload] All ${maxRetries} attempts failed for ${fileName}`);
        throw lastError;
    }

    /**
     * Upload a chunk from a file path (streaming - minimal memory usage)
     * Streams directly to Telegram without loading entire file into memory
     */
    public async uploadChunkFromFile(
        botToken: string,
        channelId: string,
        filePath: string,
        fileName: string,
        mimeType: string,
        fileSize: number
    ): Promise<{ messageId: number; fileId: string; size: number }> {
        // Channel ID format for Bot API
        let chatId = channelId;
        if (!channelId.startsWith('-')) {
            chatId = `-100${channelId}`;
        }

        const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
        const maxRetries = 3;
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[BotUpload] Streaming attempt ${attempt}/${maxRetries} for ${fileName}`);

                // Create fresh stream and form data for each attempt
                const fileStream = fs.createReadStream(filePath);
                const formData = new FormData();

                formData.append('chat_id', chatId);
                formData.append('document', fileStream, {
                    filename: fileName,
                    contentType: mimeType,
                    knownLength: fileSize,
                });
                formData.append('caption', `📦 ${fileName}`);

                const response = await axios.post(url, formData, {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 120000, // 2 minutes
                });

                if (!response.data.ok) {
                    throw new Error(response.data.description || 'Bot API error');
                }

                const message = response.data.result;
                const document = message.document;

                console.log(`[BotUpload] Stream success on attempt ${attempt}`);
                return {
                    messageId: message.message_id,
                    fileId: document.file_id,
                    size: document.file_size
                };
            } catch (error: any) {
                lastError = error;
                const isRetryable = error.code === 'ETIMEDOUT' ||
                    error.code === 'ECONNRESET' ||
                    error.code === 'ENETUNREACH' ||
                    error.message?.includes('timeout');

                console.error(`[BotUpload] Stream attempt ${attempt} failed:`, error.code || error.message);

                if (attempt < maxRetries && isRetryable) {
                    const delay = Math.pow(2, attempt) * 2500;
                    console.log(`[BotUpload] Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else if (!isRetryable) {
                    break;
                }
            }
        }

        console.error(`[BotUpload] All ${maxRetries} stream attempts failed for ${fileName}`);
        throw lastError;
    }

    /**
     * Download file chunks in parallel using multiple bots
     */
    async downloadFile(chunks: { fileId: string; chunkIndex: number }[]): Promise<Buffer> {
        if (this.botTokens.length === 0) {
            throw new Error('No bot tokens configured');
        }

        console.log(`[BotDownload] Starting parallel download: ${chunks.length} chunks, ${this.botTokens.length} bots`);
        const startTime = Date.now();

        // Download chunks in parallel batches
        const results: { chunkIndex: number; data: Buffer }[] = [];
        const maxParallel = this.botTokens.length;

        for (let batchStart = 0; batchStart < chunks.length; batchStart += maxParallel) {
            const batchEnd = Math.min(batchStart + maxParallel, chunks.length);
            const batchChunks = chunks.slice(batchStart, batchEnd);

            console.log(`[BotDownload] Batch ${Math.floor(batchStart / maxParallel) + 1}/${Math.ceil(chunks.length / maxParallel)} (${batchChunks.length} parallel)`);

            const batchPromises = batchChunks.map(async (chunk, batchIndex) => {
                const botToken = this.botTokens[batchIndex % this.botTokens.length];
                const data = await this.downloadChunk(botToken, chunk.fileId);
                return { chunkIndex: chunk.chunkIndex, data };
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        // Sort by chunk index and combine
        results.sort((a, b) => a.chunkIndex - b.chunkIndex);
        const combined = Buffer.concat(results.map(r => r.data));

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const speed = ((combined.length / 1024 / 1024) / parseFloat(elapsed)).toFixed(1);
        console.log(`[BotDownload] Completed: ${(combined.length / 1024 / 1024).toFixed(1)} MB in ${elapsed}s (${speed} MB/s)`);

        return combined;
    }



    /**
     * Calculate SHA-256 hash
     */
    private calculateHash(data: Buffer): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Download a file by channel ID and message ID (for files uploaded via MTProto)
     * Bot forwards the message to get a Bot API file_id, then downloads it
     */
    async downloadByMessageId(channelId: string, messageId: number): Promise<Buffer> {
        if (!this.isAvailable()) {
            throw new Error('Bot service not available');
        }

        const botToken = this.botTokens[0];
        let chatId = channelId;
        if (!channelId.startsWith('-')) {
            chatId = `-100${channelId}`;
        }

        console.log(`[BotDownload] Downloading by message ID: channel=${chatId}, msg=${messageId}`);

        try {
            // Step 1: Forward the message to get Bot API file info
            const forwardUrl = `https://api.telegram.org/bot${botToken}/forwardMessage`;
            const forwardResponse = await axios.post(forwardUrl, {
                chat_id: chatId,
                from_chat_id: chatId,
                message_id: messageId,
            });

            if (!forwardResponse.data.ok) {
                throw new Error(forwardResponse.data.description || 'Failed to forward message');
            }

            const forwardedMsg = forwardResponse.data.result;
            const forwardedMsgId = forwardedMsg.message_id;

            // Get file_id from the forwarded message
            let fileId: string | null = null;
            if (forwardedMsg.document) {
                fileId = forwardedMsg.document.file_id;
            } else if (forwardedMsg.photo) {
                fileId = forwardedMsg.photo[forwardedMsg.photo.length - 1].file_id;
            } else if (forwardedMsg.video) {
                fileId = forwardedMsg.video.file_id;
            } else if (forwardedMsg.audio) {
                fileId = forwardedMsg.audio.file_id;
            }

            if (!fileId) {
                throw new Error('No downloadable file in forwarded message');
            }

            console.log(`[BotDownload] Got file_id from forwarded message`);

            // Step 2: Download using the Bot API file_id
            const buffer = await this.downloadChunk(botToken, fileId);

            // Step 3: Delete the forwarded message to keep channel clean
            try {
                await axios.post(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
                    chat_id: chatId,
                    message_id: forwardedMsgId,
                });
            } catch {
                // Ignore deletion errors
            }

            return buffer;
        } catch (error: any) {
            console.error(`[BotDownload] downloadByMessageId failed:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get bot username(s)
     */
    getBotUsername(): string | null {
        return config.telegramBotUsername || null;
    }
}

export const botUploadService = new BotUploadService();
