/**
 * Local Encryption Service
 * 
 * Handles AES-256-GCM encryption of files before upload.
 * Keys are stored only locally, never transmitted.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import { StoreService } from './store-service';

const AES_KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

export interface EncryptedFile {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  originalSize: number;
  encryptedSize: number;
  hash: string; // SHA-256 of original file
}

export class EncryptionService {
  private storeService: StoreService;
  private masterKey: Buffer | null = null;

  constructor(storeService: StoreService) {
    this.storeService = storeService;
    this.loadOrCreateMasterKey();
  }

  /**
   * Load existing master key or create a new one
   */
  private loadOrCreateMasterKey(): void {
    const savedKey = this.storeService.getMasterKey();
    
    if (savedKey) {
      this.masterKey = Buffer.from(savedKey, 'base64');
    } else {
      // Generate a new master key
      this.masterKey = crypto.randomBytes(AES_KEY_LENGTH);
      this.storeService.setMasterKey(this.masterKey.toString('base64'));
      console.log('Generated new master encryption key');
    }
  }

  /**
   * Encrypt a file from disk
   */
  async encryptFile(filePath: string): Promise<EncryptedFile> {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    // Read file
    const plaintext = await fs.promises.readFile(filePath);
    
    // Calculate hash of original file
    const hash = crypto.createHash('sha256').update(plaintext).digest('hex');
    
    // Generate unique IV for this file
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Generate a unique file key (derived from master key + random salt)
    const salt = crypto.randomBytes(16);
    const fileKey = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      100000,
      AES_KEY_LENGTH,
      'sha256'
    );
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', fileKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    
    // Encrypt
    const encrypted = Buffer.concat([
      salt, // Prepend salt for key derivation on decrypt
      cipher.update(plaintext),
      cipher.final(),
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      ciphertext: encrypted,
      iv,
      authTag,
      originalSize: plaintext.length,
      encryptedSize: encrypted.length + iv.length + authTag.length,
      hash,
    };
  }

  /**
   * Encrypt a buffer directly
   */
  encryptBuffer(buffer: Buffer): EncryptedFile {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    // Calculate hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Generate unique IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Generate file key
    const salt = crypto.randomBytes(16);
    const fileKey = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      100000,
      AES_KEY_LENGTH,
      'sha256'
    );
    
    // Encrypt
    const cipher = crypto.createCipheriv('aes-256-gcm', fileKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    
    const encrypted = Buffer.concat([
      salt,
      cipher.update(buffer),
      cipher.final(),
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      ciphertext: encrypted,
      iv,
      authTag,
      originalSize: buffer.length,
      encryptedSize: encrypted.length + iv.length + authTag.length,
      hash,
    };
  }

  /**
   * Decrypt an encrypted file
   */
  decryptFile(encrypted: EncryptedFile): Buffer {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    // Extract salt from ciphertext
    const salt = encrypted.ciphertext.subarray(0, 16);
    const actualCiphertext = encrypted.ciphertext.subarray(16);
    
    // Derive file key
    const fileKey = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      100000,
      AES_KEY_LENGTH,
      'sha256'
    );
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', fileKey, encrypted.iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(encrypted.authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(actualCiphertext),
      decipher.final(),
    ]);
    
    // Verify hash
    const hash = crypto.createHash('sha256').update(decrypted).digest('hex');
    if (hash !== encrypted.hash) {
      throw new Error('File integrity check failed');
    }
    
    return decrypted;
  }

  /**
   * Package encrypted file for upload (combines iv + authTag + ciphertext)
   */
  packageForUpload(encrypted: EncryptedFile): Buffer {
    // Format: [iv (12)] [authTag (16)] [ciphertext (variable)]
    return Buffer.concat([
      encrypted.iv,
      encrypted.authTag,
      encrypted.ciphertext,
    ]);
  }

  /**
   * Unpackage a downloaded file
   */
  unpackageDownload(buffer: Buffer): { iv: Buffer; authTag: Buffer; ciphertext: Buffer } {
    return {
      iv: buffer.subarray(0, IV_LENGTH),
      authTag: buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH),
      ciphertext: buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH),
    };
  }

  /**
   * Check if encryption is ready
   */
  isReady(): boolean {
    return this.masterKey !== null;
  }
}
