/**
 * Key Derivation and Management Service
 * 
 * Derives master key from user passphrase using PBKDF2.
 * The passphrase is NEVER sent to the server.
 * Only a salted hash is stored for passphrase verification.
 */

import {
  generateSalt,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64ToUint8Array,
  uint8ArrayToBase64,
} from './crypto';

// Constants for key derivation
const PBKDF2_ITERATIONS = 600000; // High iteration count for security
const MASTER_KEY_LENGTH = 256; // bits
const VERIFICATION_HASH_ITERATIONS = 100000; // Separate iterations for verification

export interface DerivedKeyData {
  masterKey: CryptoKey;
  salt: string; // Base64 encoded
  verificationHash: string; // For server-side passphrase verification
}

export interface StoredKeyData {
  salt: string;
  verificationHash: string;
}

/**
 * Derive a master key from a passphrase using PBKDF2
 */
export async function deriveMasterKey(
  passphrase: string,
  salt?: Uint8Array
): Promise<{ masterKey: CryptoKey; salt: Uint8Array }> {
  // Use provided salt or generate new one
  const keySalt = salt || generateSalt();
  
  // Convert passphrase to key material
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the master key
  const masterKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: keySalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: MASTER_KEY_LENGTH },
    false, // Not extractable - master key never leaves memory
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
  
  return { masterKey, salt: keySalt };
}

/**
 * Generate a verification hash for the passphrase
 * This hash is stored on the server to verify the passphrase is correct
 * Uses a different salt and iteration count than the master key
 */
export async function generateVerificationHash(
  passphrase: string,
  salt: Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();
  
  // Combine passphrase with a domain separator to create verification-specific input
  const verificationInput = encoder.encode(`TAAS-VERIFY:${passphrase}`);
  
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    verificationInput,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits for verification (not a key)
  const verificationBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: VERIFICATION_HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    256
  );
  
  return arrayBufferToBase64(verificationBits);
}

/**
 * Initialize encryption for a new user
 * Called during first-time setup when user creates their passphrase
 */
export async function initializeEncryption(passphrase: string): Promise<DerivedKeyData> {
  if (passphrase.length < 12) {
    throw new Error('Passphrase must be at least 12 characters');
  }
  
  // Derive the master key
  const { masterKey, salt } = await deriveMasterKey(passphrase);
  
  // Generate verification hash
  const verificationHash = await generateVerificationHash(passphrase, salt);
  
  return {
    masterKey,
    salt: uint8ArrayToBase64(salt),
    verificationHash,
  };
}

/**
 * Unlock encryption with an existing passphrase
 * Called when user logs in and needs to decrypt files
 */
export async function unlockEncryption(
  passphrase: string,
  storedData: StoredKeyData
): Promise<CryptoKey> {
  const salt = base64ToUint8Array(storedData.salt);
  
  // Derive the master key
  const { masterKey } = await deriveMasterKey(passphrase, salt);
  
  // Verify the passphrase is correct
  const computedHash = await generateVerificationHash(passphrase, salt);
  
  if (computedHash !== storedData.verificationHash) {
    throw new Error('Invalid passphrase');
  }
  
  return masterKey;
}

/**
 * Change the user's passphrase
 * Re-encrypts all file keys with the new master key
 */
export async function changePassphrase(
  oldPassphrase: string,
  newPassphrase: string,
  storedData: StoredKeyData,
  encryptedFileKeys: Array<{ fileId: string; encryptedKey: string; iv: string }>
): Promise<{
  newStoredData: StoredKeyData;
  reEncryptedKeys: Array<{ fileId: string; encryptedKey: string; iv: string }>;
}> {
  if (newPassphrase.length < 12) {
    throw new Error('New passphrase must be at least 12 characters');
  }
  
  // Unlock with old passphrase
  const oldMasterKey = await unlockEncryption(oldPassphrase, storedData);
  
  // Initialize with new passphrase
  const { masterKey: newMasterKey, salt, verificationHash } = await initializeEncryption(newPassphrase);
  
  // Re-encrypt all file keys
  const reEncryptedKeys: Array<{ fileId: string; encryptedKey: string; iv: string }> = [];
  
  for (const { fileId, encryptedKey, iv } of encryptedFileKeys) {
    // Decrypt with old master key
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
    const ivBuffer = base64ToUint8Array(iv);
    
    const rawKey = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer, tagLength: 128 },
      oldMasterKey,
      encryptedKeyBuffer
    );
    
    // Re-encrypt with new master key
    const newIv = crypto.getRandomValues(new Uint8Array(12));
    const newEncryptedKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: newIv, tagLength: 128 },
      newMasterKey,
      rawKey
    );
    
    reEncryptedKeys.push({
      fileId,
      encryptedKey: arrayBufferToBase64(newEncryptedKey),
      iv: uint8ArrayToBase64(newIv),
    });
  }
  
  return {
    newStoredData: { salt, verificationHash },
    reEncryptedKeys,
  };
}

/**
 * Validate passphrase strength
 */
export function validatePassphraseStrength(passphrase: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (passphrase.length >= 12) score += 1;
  else feedback.push('Passphrase should be at least 12 characters');
  
  if (passphrase.length >= 16) score += 1;
  if (passphrase.length >= 20) score += 1;
  
  if (/[a-z]/.test(passphrase)) score += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(passphrase)) score += 1;
  else feedback.push('Add uppercase letters');
  
  if (/[0-9]/.test(passphrase)) score += 1;
  else feedback.push('Add numbers');
  
  if (/[^a-zA-Z0-9]/.test(passphrase)) score += 1;
  else feedback.push('Add special characters');
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(passphrase)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }
  
  if (/^[a-zA-Z]+$/.test(passphrase)) {
    score -= 1;
    feedback.push('Mix in numbers and symbols');
  }
  
  return {
    valid: passphrase.length >= 12 && score >= 4,
    score: Math.max(0, Math.min(7, score)),
    feedback,
  };
}

/**
 * Key Manager class for managing encryption state
 */
export class KeyManager {
  private masterKey: CryptoKey | null = null;
  private isUnlocked = false;
  
  /**
   * Check if encryption is unlocked
   */
  get unlocked(): boolean {
    return this.isUnlocked && this.masterKey !== null;
  }
  
  /**
   * Get the master key (throws if locked)
   */
  getMasterKey(): CryptoKey {
    if (!this.masterKey) {
      throw new Error('Encryption is locked. Please enter your passphrase.');
    }
    return this.masterKey;
  }
  
  /**
   * Initialize for a new user
   */
  async initialize(passphrase: string): Promise<StoredKeyData> {
    const { masterKey, salt, verificationHash } = await initializeEncryption(passphrase);
    this.masterKey = masterKey;
    this.isUnlocked = true;
    return { salt, verificationHash };
  }
  
  /**
   * Unlock with existing passphrase
   */
  async unlock(passphrase: string, storedData: StoredKeyData): Promise<void> {
    this.masterKey = await unlockEncryption(passphrase, storedData);
    this.isUnlocked = true;
  }
  
  /**
   * Lock encryption (clear master key from memory)
   */
  lock(): void {
    this.masterKey = null;
    this.isUnlocked = false;
  }
  
  /**
   * Change passphrase
   */
  async changePassphrase(
    oldPassphrase: string,
    newPassphrase: string,
    storedData: StoredKeyData,
    encryptedFileKeys: Array<{ fileId: string; encryptedKey: string; iv: string }>
  ) {
    const result = await changePassphrase(oldPassphrase, newPassphrase, storedData, encryptedFileKeys);
    
    // Update master key to new one
    const { masterKey } = await deriveMasterKey(newPassphrase, base64ToUint8Array(result.newStoredData.salt));
    this.masterKey = masterKey;
    
    return result;
  }
}

// Singleton instance
export const keyManager = new KeyManager();
