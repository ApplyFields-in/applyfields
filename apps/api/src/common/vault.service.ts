import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const IV_LENGTH = 12; // 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
const KEY_LENGTH = 32; // 256 bits (AES-256)
const ALGORITHM = 'aes-256-gcm';

export interface EncryptedVaultPayload {
  data: Buffer;
  encryptedKey: Buffer;
}

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly logger = new Logger(VaultService.name);
  private masterKey: Buffer | null = null;

  constructor(customMasterKey?: Buffer | string) {
    if (customMasterKey) {
      this.masterKey = this.parseKey(customMasterKey);
    }
  }

  onModuleInit(): void {
    this.ensureMasterKey();
  }

  /**
   * Parse a 32-byte key from Base64, hex, or raw binary representation.
   */
  private parseKey(val: string | Buffer): Buffer | null {
    if (Buffer.isBuffer(val)) {
      return val.length === KEY_LENGTH ? val : null;
    }
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();

    // 1. Try base64
    try {
      const b64 = Buffer.from(trimmed, 'base64');
      if (b64.length === KEY_LENGTH) return b64;
    } catch {}

    // 2. Try hex (64 chars)
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      try {
        const hex = Buffer.from(trimmed, 'hex');
        if (hex.length === KEY_LENGTH) return hex;
      } catch {}
    }

    // 3. Raw utf8 / buffer if exactly 32 bytes
    if (Buffer.byteLength(trimmed, 'utf8') === KEY_LENGTH) {
      return Buffer.from(trimmed, 'utf8');
    }

    return null;
  }

  /**
   * Resolve and validate master key.
   * In production, throws immediately if VAULT_MASTER_KEY is missing or invalid.
   */
  public ensureMasterKey(): Buffer {
    if (this.masterKey && this.masterKey.length === KEY_LENGTH) {
      return this.masterKey;
    }

    const envKey = process.env.VAULT_MASTER_KEY;
    const parsed = envKey ? this.parseKey(envKey) : null;
    if (parsed) {
      this.masterKey = parsed;
      return this.masterKey;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: VAULT_MASTER_KEY is required in production and must decode to exactly 32 bytes (AES-256).',
      );
    }

    this.logger.warn(
      'VAULT_MASTER_KEY is missing or invalid in non-production. Falling back to local development master key.',
    );
    this.masterKey = Buffer.from('01234567890123456789012345678901', 'utf8'); // 32 bytes
    return this.masterKey;
  }

  /**
   * Encrypt a plain document buffer with AES-256-GCM using an ephemeral file key,
   * then lock the file key using the master key.
   *
   * Stored format for both data and locked key:
   * [12-byte IV][16-byte auth tag][ciphertext]
   */
  encrypt(buffer: Buffer): EncryptedVaultPayload {
    const masterKey = this.ensureMasterKey();

    // 1. Generate random 32-byte key for this file
    const fileKey = randomBytes(KEY_LENGTH);

    // 2. Encrypt file buffer with fileKey
    const fileIv = randomBytes(IV_LENGTH);
    const fileCipher = createCipheriv(ALGORITHM, fileKey, fileIv);
    const fileCiphertext = Buffer.concat([
      fileCipher.update(buffer),
      fileCipher.final(),
    ]);
    const fileAuthTag = fileCipher.getAuthTag();
    const data = Buffer.concat([fileIv, fileAuthTag, fileCiphertext]);

    // 3. Lock fileKey with masterKey
    const keyIv = randomBytes(IV_LENGTH);
    const keyCipher = createCipheriv(ALGORITHM, masterKey, keyIv);
    const keyCiphertext = Buffer.concat([
      keyCipher.update(fileKey),
      keyCipher.final(),
    ]);
    const keyAuthTag = keyCipher.getAuthTag();
    const encryptedKey = Buffer.concat([keyIv, keyAuthTag, keyCiphertext]);

    return { data, encryptedKey };
  }

  /**
   * Decrypt an encrypted document buffer.
   * If encryptedKey is NULL or empty, this is a legacy unencrypted file: returns data unchanged.
   * Otherwise unlocks the file key with masterKey and decrypts data, verifying GCM auth tags.
   */
  decrypt(data: Buffer, encryptedKey: Buffer | null | undefined): Buffer {
    if (!encryptedKey || encryptedKey.length === 0) {
      // Old unencrypted file backwards compatibility
      return data;
    }

    const masterKey = this.ensureMasterKey();

    // 1. Unlock the fileKey with masterKey
    if (encryptedKey.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted key payload: length too short');
    }
    const keyIv = encryptedKey.subarray(0, IV_LENGTH);
    const keyAuthTag = encryptedKey.subarray(
      IV_LENGTH,
      IV_LENGTH + AUTH_TAG_LENGTH,
    );
    const keyCiphertext = encryptedKey.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const keyDecipher = createDecipheriv(ALGORITHM, masterKey, keyIv);
    keyDecipher.setAuthTag(keyAuthTag);
    const fileKey = Buffer.concat([
      keyDecipher.update(keyCiphertext),
      keyDecipher.final(),
    ]);

    if (fileKey.length !== KEY_LENGTH) {
      throw new Error('Decrypted file key has invalid length');
    }

    // 2. Decrypt data with fileKey
    if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted data payload: length too short');
    }
    const fileIv = data.subarray(0, IV_LENGTH);
    const fileAuthTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const fileCiphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const fileDecipher = createDecipheriv(ALGORITHM, fileKey, fileIv);
    fileDecipher.setAuthTag(fileAuthTag);
    const plain = Buffer.concat([
      fileDecipher.update(fileCiphertext),
      fileDecipher.final(),
    ]);

    return plain;
  }

  isEncrypted(encryptedKey: Buffer | null | undefined): boolean {
    return Boolean(encryptedKey && encryptedKey.length > 0);
  }
}
