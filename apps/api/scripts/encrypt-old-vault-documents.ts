import * as dotenv from 'dotenv';
import * as path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { VaultService } from '../src/common/vault.service.js';
import { StorageService } from '../src/common/storage.service.js';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

async function run() {
  console.log('--- One-off Vault Document Encryption Migration ---');

  const masterKey = process.env.VAULT_MASTER_KEY;
  if (!masterKey) {
    console.error('Error: VAULT_MASTER_KEY is not set in environment.');
    process.exit(1);
  }

  const vaultService = new VaultService(masterKey);
  try {
    vaultService.ensureMasterKey();
  } catch (err) {
    console.error('Error with VAULT_MASTER_KEY:', (err as Error).message);
    process.exit(1);
  }

  const prisma = new PrismaService();
  await prisma.onModuleInit();
  const storageService = new StorageService();

  console.log('Scanning user_documents for unencrypted rows (encrypted_key IS NULL)...');
  const unencrypted = await prisma.user_documents.findMany({
    where: {
      encrypted_key: null,
      deleted_at: null,
    },
    select: {
      id: true,
      storage_path: true,
      mime_type: true,
      file_name: true,
    },
  });

  console.log(`Found ${unencrypted.length} unencrypted document(s) to process.`);
  if (unencrypted.length === 0) {
    console.log('No documents require encryption. All up to date.');
    await prisma.onModuleDestroy();
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < unencrypted.length; i++) {
    const doc = unencrypted[i];
    console.log(`[${i + 1}/${unencrypted.length}] Processing doc ID: ${doc.id} (${doc.file_name || doc.storage_path})...`);

    try {
      let rawBytes: Buffer | null = null;
      if (existsSync(doc.storage_path)) {
        rawBytes = readFileSync(doc.storage_path);
      } else {
        rawBytes = await storageService.download(storageService.documentsBucket, doc.storage_path);
      }

      if (!rawBytes || rawBytes.length === 0) {
        console.warn(`  [WARN] File not found in storage for ${doc.storage_path}. Skipping.`);
        failCount++;
        continue;
      }

      // Encrypt file bytes
      const { data: encryptedData, encryptedKey } = vaultService.encrypt(rawBytes);

      // Re-upload or overwrite local file
      if (existsSync(doc.storage_path)) {
        writeFileSync(doc.storage_path, encryptedData);
      } else {
        const uploaded = await storageService.upload(
          storageService.documentsBucket,
          doc.storage_path,
          encryptedData,
          doc.mime_type || 'application/octet-stream',
        );
        if (!uploaded) {
          throw new Error(`Failed to re-upload encrypted file to storage: ${doc.storage_path}`);
        }
      }

      // Update DB record
      await prisma.user_documents.update({
        where: { id: doc.id },
        data: {
          encrypted_key: new Uint8Array(encryptedKey),
        },
      });

      successCount++;
      console.log(`  [OK] Encrypted and updated doc ${doc.id}`);
    } catch (err) {
      console.error(`  [ERROR] Failed to process doc ${doc.id}:`, (err as Error).message);
      failCount++;
    }
  }

  console.log('--- Migration Summary ---');
  console.log(`Successfully encrypted: ${successCount}`);
  console.log(`Failed / Skipped: ${failCount}`);
  await prisma.onModuleDestroy();
}

run().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
