import { Injectable, Logger } from '@nestjs/common';

/** Supabase Storage, server side only (uses the service-role key — never send it to a browser). */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  /** Bucket where the scraper keeps downloaded notification PDFs (apps/ingestion STORAGE_BUCKET). */
  readonly notificationsBucket = process.env.STORAGE_BUCKET ?? 'notifications';
  /** Bucket for user-uploaded resume files. */
  readonly resumesBucket = process.env.RESUMES_BUCKET ?? 'resumes';
  /** Bucket for user-uploaded applicant documents (10th marksheet, degree, caste, photo, etc.). */
  readonly documentsBucket = process.env.DOCUMENTS_BUCKET ?? 'documents';

  /**
   * Upload a buffer to Supabase Storage. Returns the object path on success, null if Storage
   * isn't configured or the upload failed (caller should fall back to local disk).
   */
  async upload(
    bucket: string,
    path: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string | null> {
    const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return null;

    const encoded = path.split('/').map(encodeURIComponent).join('/');
    try {
      const res = await fetch(`${base}/storage/v1/object/${bucket}/${encoded}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: new Uint8Array(buffer),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        this.logger.warn(`Upload failed ${bucket}/${path}: HTTP ${res.status}`);
        return null;
      }
      return path;
    } catch (err) {
      this.logger.warn(`Upload failed ${bucket}/${path}: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * A short-lived link to a private file, or null if Storage isn't configured or the file is missing.
   * `path` may include the bucket name as its first segment — it is stripped.
   * Pass `download` to force Content-Disposition: attachment with that filename.
   */
  async signedUrl(
    bucket: string,
    path: string,
    expiresInSeconds = 600,
    download?: string,
  ): Promise<string | null> {
    const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return null;

    const objectPath = path
      .replace(/^\/+/, '')
      .replace(new RegExp(`^${bucket}/`), '');
    const encoded = objectPath.split('/').map(encodeURIComponent).join('/');
    const body: Record<string, unknown> = { expiresIn: expiresInSeconds };
    if (download) body.download = download;
    try {
      const res = await fetch(
        `${base}/storage/v1/object/sign/${bucket}/${encoded}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            apikey: key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!res.ok) {
        this.logger.warn(
          `Could not sign ${bucket}/${objectPath}: HTTP ${res.status}`,
        );
        return null;
      }
      const { signedURL } = (await res.json()) as { signedURL?: string };
      return signedURL ? `${base}/storage/v1${signedURL}` : null;
    } catch (err) {
      this.logger.warn(
        `Could not sign ${bucket}/${objectPath}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
