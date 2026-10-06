import { Injectable, Logger } from '@nestjs/common';

/** Supabase Storage, server side only (uses the service-role key — never send it to a browser). */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  /** Bucket where the scraper keeps downloaded notification PDFs (apps/ingestion STORAGE_BUCKET). */
  readonly notificationsBucket = process.env.STORAGE_BUCKET ?? 'notifications';

  /**
   * A short-lived link to a private file, or null if Storage isn't configured or the file is missing.
   * `path` may include the bucket name as its first segment — it is stripped.
   */
  async signedUrl(bucket: string, path: string, expiresInSeconds = 600): Promise<string | null> {
    const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return null;

    const objectPath = path.replace(/^\/+/, '').replace(new RegExp(`^${bucket}/`), '');
    const encoded = objectPath.split('/').map(encodeURIComponent).join('/');
    try {
      const res = await fetch(`${base}/storage/v1/object/sign/${bucket}/${encoded}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: expiresInSeconds }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`Could not sign ${bucket}/${objectPath}: HTTP ${res.status}`);
        return null;
      }
      const { signedURL } = (await res.json()) as { signedURL?: string };
      return signedURL ? `${base}/storage/v1${signedURL}` : null;
    } catch (err) {
      this.logger.warn(`Could not sign ${bucket}/${objectPath}: ${(err as Error).message}`);
      return null;
    }
  }
}
