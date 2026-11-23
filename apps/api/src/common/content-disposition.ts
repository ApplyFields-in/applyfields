/**
 * Content-Disposition that survives any file name. Node throws (→ 500) on non-Latin-1 header text,
 * so "ఆధార్.pdf" broke every view/download; quotes broke the header. ASCII fallback + RFC 5987 UTF-8 name.
 */
export function contentDisposition(kind: 'inline' | 'attachment', fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]|["\\]/g, '_');
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
