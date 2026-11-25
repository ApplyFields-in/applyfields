import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { VaultService } from '../src/common/vault.service.js';
import { StorageService } from '../src/common/storage.service.js';

const envPath = [
  path.resolve(process.cwd(), 'apps/api/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(import.meta.dirname, '../.env'),
].find((p) => existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
}

interface Counts {
  encrypted: number;
  skipped: number;
  failed: number;
}

interface MigrationItem {
  id: string;
  label: string;
  storagePath: string | null;
  mimeType: string;
  saveKey: (encryptedKey: Uint8Array<ArrayBuffer>) => Promise<void>;
}

function inferMimeType(storagePath: string | null, explicit?: string | null): string {
  if (explicit) return explicit;
  const ext = (storagePath ?? '').split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}

async function encryptBatch(
  title: string,
  items: MigrationItem[],
  vaultService: VaultService,
  storageService: StorageService,
): Promise<Counts> {
  const counts: Counts = { encrypted: 0, skipped: 0, failed: 0 };
  console.log(`\n[${title}] Found ${items.length} unencrypted row(s) to process.`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`  [${i + 1}/${items.length}] ${item.id} (${item.label})...`);

    if (!item.storagePath || /^https?:\/\//i.test(item.storagePath)) {
      console.warn(`    [SKIP] Missing or non-storage path: ${item.storagePath ?? '(null)'}`);
      counts.skipped++;
      continue;
    }

    try {
      const isLocalFile = existsSync(item.storagePath);
      const rawBytes = isLocalFile
        ? readFileSync(item.storagePath)
        : await storageService.download(storageService.documentsBucket, item.storagePath);

      if (!rawBytes || rawBytes.length === 0) {
        console.warn(`    [SKIP] File not found or empty in storage: ${item.storagePath}`);
        counts.skipped++;
        continue;
      }

      const { data: encryptedData, encryptedKey } = vaultService.encrypt(rawBytes);

      if (isLocalFile) {
        writeFileSync(item.storagePath, encryptedData);
      } else {
        const uploaded = await storageService.upload(
          storageService.documentsBucket,
          item.storagePath,
          encryptedData,
          item.mimeType,
        );
        if (!uploaded) {
          throw new Error(`Failed to re-upload encrypted file to storage: ${item.storagePath}`);
        }
      }

      await item.saveKey(new Uint8Array(encryptedKey));
      counts.encrypted++;
      console.log(`    [OK] Encrypted and updated ${item.id}`);
    } catch (err) {
      console.error(`    [ERROR] Failed to process ${item.id}:`, (err as Error).message);
      counts.failed++;
    }
  }

  console.log(
    `[${title}] Summary -> encrypted: ${counts.encrypted}, skipped: ${counts.skipped}, failed: ${counts.failed}`,
  );
  return counts;
}

async function run() {
  console.log('--- One-off Vault Document Encryption Migration (Part 2) ---');

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

  try {
    const [citizenDocs, partnerDocs, bookingSlips] = await Promise.all([
      prisma.user_documents.findMany({
        where: { encrypted_key: null, deleted_at: null },
        select: { id: true, storage_path: true, mime_type: true, file_name: true },
      }),
      prisma.partner_documents.findMany({
        where: { encrypted_key: null },
        select: { id: true, storage_path: true, document_kind: true },
      }),
      prisma.service_requests.findMany({
        where: {
          acknowledgment_slip_url: { not: null },
          acknowledgment_slip_encrypted_key: null,
        },
        select: { id: true, acknowledgment_slip_url: true, official_app_number: true },
      }),
    ]);

    const cCounts = await encryptBatch(
      'user_documents',
      citizenDocs.map((doc) => ({
        id: doc.id,
        label: doc.file_name || doc.storage_path,
        storagePath: doc.storage_path,
        mimeType: inferMimeType(doc.storage_path, doc.mime_type),
        saveKey: async (key) => {
          await prisma.user_documents.update({
            where: { id: doc.id },
            data: { encrypted_key: key },
          });
        },
      })),
      vaultService,
      storageService,
    );

    const pCounts = await encryptBatch(
      'partner_documents',
      partnerDocs.map((doc) => ({
        id: doc.id,
        label: `${doc.document_kind} (${doc.storage_path})`,
        storagePath: doc.storage_path,
        mimeType: inferMimeType(doc.storage_path),
        saveKey: async (key) => {
          await prisma.partner_documents.update({
            where: { id: doc.id },
            data: { encrypted_key: key },
          });
        },
      })),
      vaultService,
      storageService,
    );

    const sCounts = await encryptBatch(
      'service_requests.acknowledgment_slip',
      bookingSlips.map((req) => ({
        id: req.id,
        label: req.official_app_number || req.acknowledgment_slip_url || req.id,
        storagePath: req.acknowledgment_slip_url,
        mimeType: inferMimeType(req.acknowledgment_slip_url),
        saveKey: async (key) => {
          await prisma.service_requests.update({
            where: { id: req.id },
            data: { acknowledgment_slip_encrypted_key: key },
          });
        },
      })),
      vaultService,
      storageService,
    );

    const total: Counts = {
      encrypted: cCounts.encrypted + pCounts.encrypted + sCounts.encrypted,
      skipped: cCounts.skipped + pCounts.skipped + sCounts.skipped,
      failed: cCounts.failed + pCounts.failed + sCounts.failed,
    };

    console.log('\n--- Overall Migration Summary ---');
    console.log(`Encrypted: ${total.encrypted}`);
    console.log(`Skipped:   ${total.skipped}`);
    console.log(`Failed:    ${total.failed}`);
  } finally {
    await prisma.onModuleDestroy();
  }
}

run().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
