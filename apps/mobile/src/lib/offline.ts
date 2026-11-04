/**
 * Files kept on the phone for when there is no signal — exam centres often jam
 * mobile data. Certificates and admit cards from Documents, notification PDFs
 * from an opportunity. They live in the app's private document directory (not
 * Downloads or the gallery, so other apps can't read them) with a JSON index.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

import { getToken } from './api';

export interface OfflineFile {
  /** 'doc:<id>' for the user's own documents, 'pdf:<slug>' for public notifications */
  key: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  savedAt: string;
}

const dir = new Directory(Paths.document, 'offline');
const indexFile = new File(dir, 'index.json');

const EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function readIndex(): OfflineFile[] {
  try {
    return indexFile.exists ? (JSON.parse(indexFile.textSync()) as OfflineFile[]) : [];
  } catch {
    return [];
  }
}

let files = readIndex();
const listeners = new Set<() => void>();

function commit(next: OfflineFile[]): void {
  if (!dir.exists) dir.create({ intermediates: true });
  indexFile.writeSync(JSON.stringify(next));
  files = next;
  for (const l of listeners) l();
}

/** Everything saved on this phone, newest first. Re-renders when it changes. */
export function useOfflineFiles(): OfflineFile[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => files,
  );
}

/**
 * Download `url` into the offline store. `auth` sends the access token (for
 * GET /documents/:id/download). The downloader rejects any non-2xx response, so
 * an expired session never ends up on disk pretending to be a PDF.
 */
export async function saveOffline(input: {
  key: string;
  title: string;
  url: string;
  mimeType?: string | null;
  auth?: boolean;
}): Promise<OfflineFile> {
  if (!dir.exists) dir.create({ intermediates: true });
  const mimeType = input.mimeType || 'application/pdf';
  const target = new File(dir, `${input.key.replace(/[^a-z0-9-]/gi, '_')}.${EXT[mimeType] ?? 'pdf'}`);
  if (target.exists) target.delete();

  const token = input.auth ? await getToken() : null;
  let file: File;
  try {
    file = await File.downloadFileAsync(
      input.url,
      target,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
  } catch (err) {
    throw new Error(downloadError((err as Error).message));
  }

  const entry: OfflineFile = {
    key: input.key,
    title: input.title,
    fileName: file.name,
    mimeType,
    size: file.size ?? 0,
    savedAt: new Date().toISOString(),
  };
  commit([entry, ...files.filter((f) => f.key !== input.key)]);
  return entry;
}

/** The native error ("…has been rejected → response has status: 404") in words a citizen can act on. */
export function downloadError(native: string): string {
  const code = /status:?\s*(\d{3})|HTTP (\d{3})/.exec(native);
  const status = code?.[1] ?? code?.[2];
  if (status === '401' || status === '403') return 'Your session has ended. Sign in again, then save it.';
  if (status === '404') return 'The official site no longer has this file. Open the official page instead.';
  if (status) return `The site would not send the file right now (error ${status}). Try again later.`;
  return 'No connection right now. Connect once to save this file to your phone.';
}

export function removeOffline(key: string): void {
  const entry = files.find((f) => f.key === key);
  if (entry) {
    const file = new File(dir, entry.fileName);
    if (file.exists) file.delete();
  }
  commit(files.filter((f) => f.key !== key));
}

/** Personal documents go on sign-out, so a shared phone doesn't keep someone's certificates. */
export function clearPersonalOffline(): void {
  for (const f of files.filter((f) => f.key.startsWith('doc:'))) removeOffline(f.key);
}

/** Native viewer: Quick Look on iOS, the system PDF/image viewer on Android. Works offline. */
export function openOffline(entry: OfflineFile): Promise<void> {
  return new File(dir, entry.fileName).preview({ title: entry.title, mimeType: entry.mimeType });
}
