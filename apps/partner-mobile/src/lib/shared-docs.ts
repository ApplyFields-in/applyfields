/**
 * Open a document a citizen shared with a booking (booking screen and chat attachments):
 * GET /bookings/:id/documents/:share/file with the session token in the header (never in the URL),
 * saved as one temporary file in the app cache, then the phone's viewer. The previous copy is
 * removed first, and sign-out removes it too.
 */
import { Directory, File, Paths } from 'expo-file-system';

import { API_URL, getToken } from './api';

const dir = new Directory(Paths.cache, 'shared');

const EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function clearSharedDocuments(): void {
  try {
    if (dir.exists) dir.delete();
  } catch {
    // nothing to clear
  }
}

export async function openSharedDocument(input: {
  bookingId: string;
  shareId: string;
  title: string;
  mimeType?: string | null;
}): Promise<void> {
  clearSharedDocuments();
  dir.create({ intermediates: true });
  const mimeType = input.mimeType || 'application/pdf';
  const target = new File(dir, `${input.shareId.replace(/[^a-z0-9-]/gi, '_')}.${EXT[mimeType] ?? 'pdf'}`);
  const token = await getToken();
  let file: File;
  try {
    file = await File.downloadFileAsync(
      `${API_URL}/bookings/${encodeURIComponent(input.bookingId)}/documents/${encodeURIComponent(input.shareId)}/file`,
      target,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
  } catch (err) {
    const status = /status:?\s*(\d{3})|HTTP (\d{3})/.exec((err as Error).message);
    const code = status?.[1] ?? status?.[2];
    if (code === '404') throw new Error('This document is no longer shared. The citizen may have removed it.');
    if (code === '401' || code === '403') throw new Error('Sign in again to open this document.');
    throw new Error('Could not download the document. Check your connection and try again.');
  }
  await file.preview({ title: input.title, mimeType });
}
