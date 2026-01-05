/**
 * Secure Upload Service
 * 
 * Handles client-side encryption and throttled uploads
 * with human-like behavior to avoid Telegram abuse detection.
 */

import {
  encryptFile,
  arrayBufferToBase64,
  uint8ArrayToBase64,
  EncryptedChunk,
} from './crypto';
import { keyManager } from './keyManager';

// Upload configuration
const MIN_DELAY_MS = 500; // Minimum delay between chunks
const MAX_DELAY_MS = 2000; // Maximum delay between chunks
const JITTER_FACTOR = 0.3; // 30% jitter

export interface SecureUploadOptions {
  file: File;
  folderId?: string;
  onProgress?: (progress: number, stage: 'encrypting' | 'uploading') => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
}

export interface SecureUploadResult {
  fileId: string;
  name: string;
  size: number;
  encrypted: true;
}

export interface ChunkUploadPayload {
  chunkIndex: number;
  totalChunks: number;
  ciphertext: string; // Base64
  iv: string; // Base64
  hash: string; // SHA-256 hex
}

export interface FileUploadMetadata {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId?: string;
  encryptedFileKey: string; // Base64
  fileKeyIv: string; // Base64
  originalHash: string;
  totalChunks: number;
}

/**
 * Add jitter to a delay value
 */
function addJitter(baseDelay: number): number {
  const jitter = baseDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
  return Math.max(MIN_DELAY_MS, baseDelay + jitter);
}

/**
 * Calculate delay based on chunk size and position
 * Mimics human upload behavior
 */
function calculateDelay(chunkIndex: number, totalChunks: number): number {
  // Base delay increases slightly for later chunks (simulates fatigue/network)
  const progressFactor = 1 + (chunkIndex / totalChunks) * 0.5;
  const baseDelay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  return addJitter(baseDelay * progressFactor);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Securely upload a file with client-side encryption
 */
export async function secureUpload(
  options: SecureUploadOptions,
  apiBaseUrl: string,
  authToken: string
): Promise<SecureUploadResult> {
  const { file, folderId, onProgress, onChunkComplete } = options;
  
  // Ensure encryption is unlocked
  const masterKey = keyManager.getMasterKey();
  
  // Read file as ArrayBuffer
  onProgress?.(0, 'encrypting');
  const fileBuffer = await file.arrayBuffer();
  
  // Encrypt the file (this happens entirely client-side)
  const {
    chunks,
    fileKeyEncrypted,
    fileKeyIv,
    originalHash,
  } = await encryptFile(fileBuffer, masterKey);
  
  onProgress?.(100, 'encrypting');
  
  // Prepare metadata for server
  const metadata: FileUploadMetadata = {
    fileName: file.name,
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    folderId,
    encryptedFileKey: arrayBufferToBase64(fileKeyEncrypted),
    fileKeyIv: uint8ArrayToBase64(fileKeyIv),
    originalHash,
    totalChunks: chunks.length,
  };
  
  // Start upload session with server
  const sessionResponse = await fetch(`${apiBaseUrl}/api/files/upload/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(metadata),
  });
  
  if (!sessionResponse.ok) {
    const error = await sessionResponse.json();
    throw new Error(error.message || 'Failed to start upload session');
  }
  
  const { uploadSessionId } = await sessionResponse.json();
  
  // Upload chunks sequentially with delays
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Add human-like delay between chunks (not before first chunk)
    if (i > 0) {
      const delay = calculateDelay(i, chunks.length);
      await sleep(delay);
    }
    
    // Prepare chunk payload
    const chunkPayload: ChunkUploadPayload = {
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunks.length,
      ciphertext: arrayBufferToBase64(chunk.ciphertext),
      iv: uint8ArrayToBase64(chunk.iv),
      hash: chunk.hash,
    };
    
    // Upload the chunk
    const chunkResponse = await fetch(`${apiBaseUrl}/api/files/upload/chunk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Upload-Session': uploadSessionId,
      },
      body: JSON.stringify(chunkPayload),
    });
    
    if (!chunkResponse.ok) {
      const error = await chunkResponse.json();
      throw new Error(error.message || `Failed to upload chunk ${i + 1}`);
    }
    
    // Report progress
    const progress = ((i + 1) / chunks.length) * 100;
    onProgress?.(progress, 'uploading');
    onChunkComplete?.(i, chunks.length);
  }
  
  // Finalize the upload
  const finalizeResponse = await fetch(`${apiBaseUrl}/api/files/upload/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-Upload-Session': uploadSessionId,
    },
  });
  
  if (!finalizeResponse.ok) {
    const error = await finalizeResponse.json();
    throw new Error(error.message || 'Failed to finalize upload');
  }
  
  const result = await finalizeResponse.json();
  
  return {
    fileId: result.data.id,
    name: result.data.name,
    size: result.data.size,
    encrypted: true,
  };
}

/**
 * Batch upload with proper throttling
 */
export async function secureBatchUpload(
  files: File[],
  folderId: string | undefined,
  apiBaseUrl: string,
  authToken: string,
  onFileProgress?: (fileIndex: number, progress: number, stage: 'encrypting' | 'uploading') => void,
  onFileComplete?: (fileIndex: number, result: SecureUploadResult) => void
): Promise<SecureUploadResult[]> {
  const results: SecureUploadResult[] = [];
  
  // Upload files sequentially (not in parallel) to avoid triggering abuse detection
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Add delay between files
    if (i > 0) {
      const fileDelay = 1000 + Math.random() * 2000; // 1-3 seconds between files
      await sleep(fileDelay);
    }
    
    const result = await secureUpload(
      {
        file,
        folderId,
        onProgress: (progress, stage) => onFileProgress?.(i, progress, stage),
      },
      apiBaseUrl,
      authToken
    );
    
    results.push(result);
    onFileComplete?.(i, result);
  }
  
  return results;
}
