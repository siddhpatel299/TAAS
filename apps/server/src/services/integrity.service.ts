/**
 * Integrity Verification Service
 * 
 * Handles SHA-256 hash verification for encrypted chunks.
 * Ensures data integrity throughout the upload/download lifecycle.
 */

import crypto from 'crypto';

export interface ChunkIntegrityData {
  chunkIndex: number;
  expectedHash: string;
  size: number;
}

export interface IntegrityVerificationResult {
  valid: boolean;
  chunkIndex: number;
  expectedHash: string;
  computedHash: string;
  error?: string;
}

export class IntegrityService {
  /**
   * Calculate SHA-256 hash of a buffer
   */
  calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify a single chunk's integrity
   */
  verifyChunk(data: Buffer, expectedHash: string, chunkIndex: number): IntegrityVerificationResult {
    const computedHash = this.calculateHash(data);
    const valid = computedHash === expectedHash;

    return {
      valid,
      chunkIndex,
      expectedHash,
      computedHash,
      error: valid ? undefined : `Hash mismatch for chunk ${chunkIndex}`,
    };
  }

  /**
   * Verify multiple chunks
   */
  verifyChunks(
    chunks: Array<{ data: Buffer; expectedHash: string; chunkIndex: number }>
  ): { allValid: boolean; results: IntegrityVerificationResult[] } {
    const results = chunks.map(({ data, expectedHash, chunkIndex }) =>
      this.verifyChunk(data, expectedHash, chunkIndex)
    );

    return {
      allValid: results.every(r => r.valid),
      results,
    };
  }

  /**
   * Generate integrity manifest for a file's chunks
   */
  generateManifest(chunks: Array<{ data: Buffer; chunkIndex: number }>): ChunkIntegrityData[] {
    return chunks.map(({ data, chunkIndex }) => ({
      chunkIndex,
      expectedHash: this.calculateHash(data),
      size: data.length,
    }));
  }

  /**
   * Verify file integrity after reassembly
   */
  verifyReassembledFile(data: Buffer, expectedHash: string): {
    valid: boolean;
    computedHash: string;
  } {
    const computedHash = this.calculateHash(data);
    return {
      valid: computedHash === expectedHash,
      computedHash,
    };
  }

  /**
   * Create a verification token for chunk upload
   * This prevents chunk substitution attacks
   */
  createChunkToken(
    uploadSessionId: string,
    chunkIndex: number,
    chunkHash: string,
    secret: string
  ): string {
    const data = `${uploadSessionId}:${chunkIndex}:${chunkHash}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify a chunk token
   */
  verifyChunkToken(
    token: string,
    uploadSessionId: string,
    chunkIndex: number,
    chunkHash: string,
    secret: string
  ): boolean {
    const expectedToken = this.createChunkToken(uploadSessionId, chunkIndex, chunkHash, secret);
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
  }
}

export const integrityService = new IntegrityService();
