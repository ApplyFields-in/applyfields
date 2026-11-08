/**
 * The college import filled unknown fields with text like "Data not given" or
 * "Not provided in source". Those are not data: drop them before a client sees
 * them, so apps and the website simply hide the field.
 */
const PLACEHOLDER = /^\s*(n\/?a|na|nil|null|none|-+|—)\s*\.?\s*$/i;
/** Anywhere in a value: "Annual Tuition Fee: Data not given / Concessions…" carries no fee. */
const PLACEHOLDER_PHRASE = /data not (given|available)|not provided in source/i;

export function isPlaceholder(v: unknown): boolean {
  return typeof v === 'string' && (v.trim() === '' || PLACEHOLDER.test(v) || PLACEHOLDER_PHRASE.test(v));
}

/** null for a placeholder; for "A · Data not given" keeps only the real parts ("A"). */
export function cleanText(v: string | null | undefined): string | null {
  if (v == null) return null;
  const parts = v.split(/\s+·\s+/).filter((p) => !isPlaceholder(p));
  return parts.length ? parts.join(' · ') : null;
}

/** Descriptions embed the phrase mid-sentence: "…in Pune, Not provided in source. Recognized by AICTE." */
export function cleanDescription(v: string | null | undefined): string | null {
  if (v == null) return null;
  const out = v
    .replace(/,?\s*(data not given|not provided in source)\s*[.,;]?/gi, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out && !isPlaceholder(out) && out !== '.' ? out : null;
}

/** Drops placeholder values (and empty arrays/objects) from a JSON object such as accreditation or placement_stats. */
export function cleanJson<T>(obj: T): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v == null || isPlaceholder(v)) continue;
    if (Array.isArray(v)) {
      const items = v.filter((x) => !isPlaceholder(x));
      if (items.length) out[k] = items;
      continue;
    }
    if (typeof v === 'object') {
      const inner = cleanJson(v);
      if (Object.keys(inner as object).length) out[k] = inner;
      continue;
    }
    out[k] = v;
  }
  return out as T;
}

/** Applies all of the above to an institution row; fields it doesn't have are left alone. */
export function withoutPlaceholders<T extends Record<string, any>>(row: T): T {
  const r: Record<string, any> = { ...row };
  for (const f of ['fees_text', 'ranking_text', 'website', 'address']) if (f in r) r[f] = cleanText(r[f]);
  if ('description' in r) r.description = cleanDescription(r.description);
  if ('accreditation' in r) r.accreditation = cleanJson(r.accreditation ?? {});
  if ('placement_stats' in r) r.placement_stats = cleanJson(r.placement_stats ?? {});
  if (Array.isArray(r.courses)) r.courses = r.courses.map((c: any) => ({ ...c, fees_text: cleanText(c.fees_text) }));
  return r as T;
}
