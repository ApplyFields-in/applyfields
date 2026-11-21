import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { VaultService } from './vault.service.js';

describe('VaultService', () => {
  const originalEnv = { ...process.env };
  const validBase64Key = randomBytes(32).toString('base64');

  beforeEach(() => {
    delete process.env.VAULT_MASTER_KEY;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('encrypts and decrypts a document buffer successfully (round-trip)', () => {
    process.env.VAULT_MASTER_KEY = validBase64Key;
    const service = new VaultService();

    const plain = Buffer.from('Sensitive Aadhaar Marks & Certificate Content 123456');
    const { data, encryptedKey } = service.encrypt(plain);

    expect(data).not.toEqual(plain);
    expect(data.length).toBeGreaterThan(plain.length);
    expect(encryptedKey.length).toBe(12 + 16 + 32); // IV (12) + Tag (16) + 32-byte key

    const decrypted = service.decrypt(data, encryptedKey);
    expect(decrypted.toString()).toBe(plain.toString());
  });

  it('returns data as-is if encryptedKey is null or undefined (legacy unencrypted file)', () => {
    const service = new VaultService(randomBytes(32));
    const legacyPlain = Buffer.from('Old unencrypted PDF content');

    expect(service.decrypt(legacyPlain, null)).toEqual(legacyPlain);
    expect(service.decrypt(legacyPlain, undefined)).toEqual(legacyPlain);
  });

  it('fails with auth tag mismatch when ciphertext is tampered', () => {
    process.env.VAULT_MASTER_KEY = validBase64Key;
    const service = new VaultService();

    const plain = Buffer.from('Tamper test data');
    const { data, encryptedKey } = service.encrypt(plain);

    // Tamper with the ciphertext (last byte)
    const tamperedData = Buffer.from(data);
    tamperedData[tamperedData.length - 1] ^= 0x01;

    expect(() => service.decrypt(tamperedData, encryptedKey)).toThrow();
  });

  it('fails when encryptedKey is tampered', () => {
    process.env.VAULT_MASTER_KEY = validBase64Key;
    const service = new VaultService();

    const plain = Buffer.from('Tamper key test data');
    const { data, encryptedKey } = service.encrypt(plain);

    const tamperedKey = Buffer.from(encryptedKey);
    tamperedKey[tamperedKey.length - 1] ^= 0x01;

    expect(() => service.decrypt(data, tamperedKey)).toThrow();
  });

  it('fails to decrypt when using a different master key', () => {
    const key1 = randomBytes(32).toString('base64');
    const key2 = randomBytes(32).toString('base64');

    const service1 = new VaultService(key1);
    const service2 = new VaultService(key2);

    const plain = Buffer.from('Cross key verification test');
    const { data, encryptedKey } = service1.encrypt(plain);

    expect(() => service2.decrypt(data, encryptedKey)).toThrow();
  });

  it('refuses to start in production if VAULT_MASTER_KEY is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.VAULT_MASTER_KEY;

    const service = new VaultService();
    expect(() => service.onModuleInit()).toThrow(/VAULT_MASTER_KEY is required in production/);
  });

  it('refuses to start in production if VAULT_MASTER_KEY is not 32 bytes', () => {
    process.env.NODE_ENV = 'production';
    process.env.VAULT_MASTER_KEY = Buffer.from('short-key').toString('base64');

    const service = new VaultService();
    expect(() => service.onModuleInit()).toThrow(/VAULT_MASTER_KEY is required in production/);
  });

  it('falls back to development master key when outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VAULT_MASTER_KEY;

    const service = new VaultService();
    expect(() => service.onModuleInit()).not.toThrow();

    const plain = Buffer.from('Dev mode test');
    const { data, encryptedKey } = service.encrypt(plain);
    expect(service.decrypt(data, encryptedKey)).toEqual(plain);
  });
});
