import type { ExtractedFieldItem } from '@applyfields/types';

/**
 * Document details are only what the person typed or confirmed. Nothing is read or guessed from the
 * file here (no OCR yet), so a document starts with no fields rather than invented ones.
 *
 * Full Aadhaar numbers are never stored (project rule + UIDAI storage rules): any value that holds a
 * 12-digit Aadhaar-shaped number is cut to its last 4 digits before it reaches the database.
 */
const AADHAAR = /(?<!\d)(\d{4})[ -]?(\d{4})[ -]?(\d{4})(?!\d)/g;

export function maskAadhaarIn(value: string): string {
  return value.replace(AADHAAR, (_m, _a, _b, last4: string) => `XXXX XXXX ${last4}`);
}

/** Keeps well-formed fields only, trims them, and masks Aadhaar numbers. */
export function sanitizeFields(fields: unknown): ExtractedFieldItem[] {
  if (!Array.isArray(fields)) return [];
  return fields
    .filter(
      (f): f is ExtractedFieldItem =>
        !!f && typeof f === 'object' && typeof f.key === 'string' && typeof f.label === 'string' && typeof f.value === 'string',
    )
    .slice(0, 50)
    .map((f) => ({ ...f, key: f.key.trim(), label: f.label.trim(), value: maskAadhaarIn(f.value.trim()) }));
}
