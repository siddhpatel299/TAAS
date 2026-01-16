/**
 * Client-Side Encryption Service
 * 
 * All encryption happens in the browser BEFORE upload.
 * Keys never leave the client or touch the server.
 * Uses AES-256-GCM for authenticated encryption.
 */

// Constants
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const TAG_LENGTH = 128; // Authentication tag bits

export interface EncryptedBlob {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  fileKey: CryptoKey;
  fileKeyEncrypted: ArrayBuffer; // Encrypted with master key
  salt: Uint8Array;
}

export interface EncryptedChunk {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  hash: string; // SHA-256 hash for integrity
  chunkIndex: number;
}

export interface DecryptionResult {
  plaintext: ArrayBuffer;
  verified: boolean;
}

/**
 * Generate a cryptographically secure random IV
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random AES-256 key for file encryption
 */
export async function generateFileKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    true, // extractable - needed to encrypt with master key
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to raw bytes
 */
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

/**
 * Import raw bytes as a CryptoKey
 */
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a file key with the master key
 */
export async function encryptFileKey(
  fileKey: CryptoKey,
  masterKey: CryptoKey
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const iv = generateIV();
  const rawKey = await exportKey(fileKey);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv), tagLength: TAG_LENGTH },
    masterKey,
    rawKey
  );

  return { encrypted, iv };
}

/**
 * Decrypt a file key with the master key
 */
export async function decryptFileKey(
  encryptedKey: ArrayBuffer,
  iv: Uint8Array,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv), tagLength: TAG_LENGTH },
    masterKey,
    encryptedKey
  );

  return importKey(rawKey);
}

/**
 * Calculate SHA-256 hash of data for integrity verification
 */
export async function calculateHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt a single chunk of data
 */
export async function encryptChunk(
  chunk: ArrayBuffer,
  fileKey: CryptoKey,
  chunkIndex: number
): Promise<EncryptedChunk> {
  const iv = generateIV();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv), tagLength: TAG_LENGTH },
    fileKey,
    chunk
  );

  // Hash the ciphertext for integrity verification
  const hash = await calculateHash(ciphertext);

  return {
    ciphertext,
    iv,
    hash,
    chunkIndex,
  };
}

/**
 * Decrypt a single chunk of data
 */
export async function decryptChunk(
  encryptedChunk: EncryptedChunk,
  fileKey: CryptoKey
): Promise<DecryptionResult> {
  // Verify integrity before decryption
  const computedHash = await calculateHash(encryptedChunk.ciphertext);
  const verified = computedHash === encryptedChunk.hash;

  if (!verified) {
    throw new Error(`Chunk ${encryptedChunk.chunkIndex} integrity check failed! Expected ${encryptedChunk.hash}, got ${computedHash}`);
  }

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encryptedChunk.iv), tagLength: TAG_LENGTH },
    fileKey,
    encryptedChunk.ciphertext
  );

  return { plaintext, verified };
}

/**
 * Encrypt an entire file with chunking support
 * Chunks are encrypted individually for streaming and resumability
 */
export async function encryptFile(
  file: ArrayBuffer,
  masterKey: CryptoKey,
  chunkSize: number = 1.9 * 1024 * 1024 * 1024 // 1.9GB chunks
): Promise<{
  chunks: EncryptedChunk[];
  fileKeyEncrypted: ArrayBuffer;
  fileKeyIv: Uint8Array;
  totalSize: number;
  originalHash: string;
}> {
  // Generate a unique key for this file
  const fileKey = await generateFileKey();

  // Encrypt the file key with master key
  const { encrypted: fileKeyEncrypted, iv: fileKeyIv } = await encryptFileKey(fileKey, masterKey);

  // Calculate hash of original file for verification
  const originalHash = await calculateHash(file);

  // Split into chunks and encrypt each
  const chunks: EncryptedChunk[] = [];
  const totalChunks = Math.ceil(file.byteLength / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.byteLength);
    const chunkData = file.slice(start, end);

    const encryptedChunk = await encryptChunk(chunkData, fileKey, i);
    chunks.push(encryptedChunk);
  }

  return {
    chunks,
    fileKeyEncrypted,
    fileKeyIv,
    totalSize: file.byteLength,
    originalHash,
  };
}

/**
 * Decrypt and reassemble a file from encrypted chunks
 */
export async function decryptFile(
  chunks: EncryptedChunk[],
  fileKeyEncrypted: ArrayBuffer,
  fileKeyIv: Uint8Array,
  masterKey: CryptoKey,
  expectedHash: string
): Promise<ArrayBuffer> {
  // Decrypt the file key
  const fileKey = await decryptFileKey(fileKeyEncrypted, fileKeyIv, masterKey);

  // Sort chunks by index
  const sortedChunks = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);

  // Decrypt each chunk and collect plaintexts
  const decryptedChunks: ArrayBuffer[] = [];

  for (const chunk of sortedChunks) {
    const { plaintext, verified } = await decryptChunk(chunk, fileKey);

    if (!verified) {
      throw new Error(`Chunk ${chunk.chunkIndex} failed integrity verification`);
    }

    decryptedChunks.push(plaintext);
  }

  // Reassemble the file
  const totalSize = decryptedChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const reassembled = new Uint8Array(totalSize);

  let offset = 0;
  for (const chunk of decryptedChunks) {
    reassembled.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  // Verify final hash
  const computedHash = await calculateHash(reassembled.buffer.slice(0) as ArrayBuffer);
  if (computedHash !== expectedHash) {
    throw new Error(`File integrity check failed! Expected ${expectedHash}, got ${computedHash}`);
  }

  return reassembled.buffer;
}

/**
 * Convert ArrayBuffer to Base64 for transport
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert Uint8Array to Base64
 */
export function uint8ArrayToBase64(arr: Uint8Array): string {
  return arrayBufferToBase64(arr.buffer.slice(0) as ArrayBuffer);
}

/**
 * Convert Base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(base64));
}
