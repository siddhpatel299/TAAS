/**
 * Secure Download Service
 * 
 * Handles downloading encrypted chunks and client-side decryption
 * with integrity verification.
 */

import {
  decryptFile,
  base64ToArrayBuffer,
  base64ToUint8Array,
  calculateHash,
  EncryptedChunk,
} from './crypto';
import { keyManager } from './keyManager';

export interface SecureDownloadOptions {
  fileId: string;
  fileName: string;
  onProgress?: (progress: number, stage: 'downloading' | 'decrypting' | 'verifying') => void;
}

export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  encryptedFileKey: string;
  fileKeyIv: string;
  originalHash: string;
  isChunked: boolean;
  chunkCount: number;
}

export interface ChunkData {
  chunkIndex: number;
  ciphertext: string; // Base64
  iv: string; // Base64
  hash: string;
}

/**
 * Download and decrypt a file
 */
export async function secureDownload(
  options: SecureDownloadOptions,
  apiBaseUrl: string,
  authToken: string
): Promise<Blob> {
  const { fileId, fileName, onProgress } = options;
  
  // Ensure encryption is unlocked
  const masterKey = keyManager.getMasterKey();
  
  // Get file metadata
  onProgress?.(0, 'downloading');
  
  const metadataResponse = await fetch(`${apiBaseUrl}/api/files/${fileId}/metadata`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  
  if (!metadataResponse.ok) {
    const error = await metadataResponse.json();
    throw new Error(error.message || 'Failed to get file metadata');
  }
  
  const metadata: FileMetadata = (await metadataResponse.json()).data;
  
  // Download all chunks
  const encryptedChunks: EncryptedChunk[] = [];
  
  for (let i = 0; i < metadata.chunkCount; i++) {
    const chunkResponse = await fetch(`${apiBaseUrl}/api/files/${fileId}/chunk/${i}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!chunkResponse.ok) {
      const error = await chunkResponse.json();
      throw new Error(error.message || `Failed to download chunk ${i + 1}`);
    }
    
    const chunkData: ChunkData = (await chunkResponse.json()).data;
    
    // Verify chunk hash before adding to collection
    const ciphertext = base64ToArrayBuffer(chunkData.ciphertext);
    const computedHash = await calculateHash(ciphertext);
    
    if (computedHash !== chunkData.hash) {
      throw new Error(
        `Chunk ${i} integrity verification failed! ` +
        `Expected hash: ${chunkData.hash}, Computed: ${computedHash}. ` +
        `File may be corrupted or tampered with.`
      );
    }
    
    encryptedChunks.push({
      chunkIndex: chunkData.chunkIndex,
      ciphertext,
      iv: base64ToUint8Array(chunkData.iv),
      hash: chunkData.hash,
    });
    
    const downloadProgress = ((i + 1) / metadata.chunkCount) * 100;
    onProgress?.(downloadProgress, 'downloading');
  }
  
  // Decrypt the file
  onProgress?.(0, 'decrypting');
  
  const decryptedBuffer = await decryptFile(
    encryptedChunks,
    base64ToArrayBuffer(metadata.encryptedFileKey),
    base64ToUint8Array(metadata.fileKeyIv),
    masterKey,
    metadata.originalHash
  );
  
  onProgress?.(100, 'decrypting');
  onProgress?.(100, 'verifying');
  
  // Create blob for download
  return new Blob([decryptedBuffer], { type: metadata.mimeType });
}

/**
 * Trigger browser download of a blob
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Verify file integrity without downloading
 */
export async function verifyFileIntegrity(
  fileId: string,
  apiBaseUrl: string,
  authToken: string,
  onProgress?: (chunkIndex: number, totalChunks: number, status: 'checking' | 'valid' | 'invalid') => void
): Promise<{ valid: boolean; invalidChunks: number[] }> {
  // Get file metadata
  const metadataResponse = await fetch(`${apiBaseUrl}/api/files/${fileId}/metadata`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  
  if (!metadataResponse.ok) {
    throw new Error('Failed to get file metadata');
  }
  
  const metadata: FileMetadata = (await metadataResponse.json()).data;
  const invalidChunks: number[] = [];
  
  // Check each chunk
  for (let i = 0; i < metadata.chunkCount; i++) {
    onProgress?.(i, metadata.chunkCount, 'checking');
    
    const chunkResponse = await fetch(`${apiBaseUrl}/api/files/${fileId}/chunk/${i}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!chunkResponse.ok) {
      invalidChunks.push(i);
      onProgress?.(i, metadata.chunkCount, 'invalid');
      continue;
    }
    
    const chunkData: ChunkData = (await chunkResponse.json()).data;
    const ciphertext = base64ToArrayBuffer(chunkData.ciphertext);
    const computedHash = await calculateHash(ciphertext);
    
    if (computedHash !== chunkData.hash) {
      invalidChunks.push(i);
      onProgress?.(i, metadata.chunkCount, 'invalid');
    } else {
      onProgress?.(i, metadata.chunkCount, 'valid');
    }
  }
  
  return {
    valid: invalidChunks.length === 0,
    invalidChunks,
  };
}
