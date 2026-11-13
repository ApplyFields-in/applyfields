/** Pure rules the admin app's session and lock run on. No React / Expo imports, so staff.check.ts can run them in Node. */

export type Department = 'apply' | 'career' | 'partners' | 'services';

export const DEPARTMENT_LABEL: Record<Department, string> = {
  apply: 'Apply',
  career: 'Career',
  partners: 'Partners',
  services: 'Services',
};

/**
 * Same mapping as apps/admin/src/lib/nav.tsx departmentsForRoles and the API's @Roles:
 * super_admin/admin → all · support → Partners + Services · reviewer/content_editor → Apply + Career.
 */
export function departmentsForRoles(roles: readonly string[] = []): Department[] {
  if (roles.includes('super_admin') || roles.includes('admin')) return ['apply', 'career', 'partners', 'services'];
  const out: Department[] = [];
  if (roles.includes('reviewer') || roles.includes('content_editor')) out.push('apply', 'career');
  if (roles.includes('support')) out.push('partners', 'services');
  return out;
}

/** Back from the background after this long → ask for Face ID / fingerprint again. */
export const LOCK_AFTER_MS = 30_000;

/** backgroundAt = when the app left the foreground (null = it never did since the last unlock). */
export function shouldLock(backgroundAt: number | null, now: number): boolean {
  return backgroundAt !== null && now - backgroundAt >= LOCK_AFTER_MS;
}

/** Login identifiers: trimmed, emails lower-cased (LoginDto `identifier`). */
export function loginId(identifier: string): string {
  const id = identifier.trim();
  return id.includes('@') ? id.toLowerCase() : id;
}

/**
 * Same answer as the API's hasStaffPermission (apps/api/src/common/roles.decorator.ts) for the roles this app
 * uses: a listed role passes; admin passes everything except super_admin-only; super_admin passes everything.
 * required = [] → any staff role.
 */
export function canUse(roles: readonly string[], required: readonly string[]): boolean {
  if (roles.length === 0) return false;
  if (required.length === 0) return true;
  if (roles.includes('super_admin')) return true;
  if (roles.includes('admin') && required.some((r) => r !== 'super_admin')) return true;
  return roles.some((r) => required.includes(r));
}

export type TabName = 'pulse' | 'kyc' | 'queue' | 'broadcast' | 'account';

/** Each tab and the @Roles of the API it calls. Order = tab bar order. */
export const TABS: readonly { name: TabName; title: string; roles: readonly string[] }[] = [
  { name: 'pulse', title: 'Pulse', roles: [] }, // GET /admin/summary: any staff
  { name: 'kyc', title: 'KYC', roles: ['support'] }, // /admin/partners
  { name: 'queue', title: 'Review', roles: ['reviewer', 'content_editor'] }, // GET /admin/review
  { name: 'broadcast', title: 'Broadcast', roles: ['admin'] }, // POST /admin/notifications/broadcast
  { name: 'account', title: 'Account', roles: [] },
];

export function tabsForRoles(roles: readonly string[]): TabName[] {
  return TABS.filter((t) => canUse(roles, t.roles)).map((t) => t.name);
}

// ---------- KYC ----------

export interface KycSpec {
  kind: string;
  label: string;
  optional?: boolean;
}
export interface KycDoc {
  id: string;
  document_kind: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}
export type KycRowState = 'missing' | 'pending' | 'verified' | 'rejected';
export interface KycRow<D extends KycDoc> {
  spec: KycSpec;
  doc: D | null;
  state: KycRowState;
}

const INSTITUTION_TYPES = ['college', 'university', 'training_institute'];
export const isInstitutionType = (type: string) => INSTITUTION_TYPES.includes(type);

/**
 * One row per expected document (latest upload of each kind wins). A partner can be approved only when
 * every required document is verified: the real version of the website's "all 4 boxes ticked" rule.
 */
export function kycRows<D extends KycDoc>(specs: readonly KycSpec[], docs: readonly D[]) {
  const latest = new Map<string, D>();
  for (const d of docs) {
    const prev = latest.get(d.document_kind);
    if (!prev || d.created_at > prev.created_at) latest.set(d.document_kind, d);
  }
  const rows = specs.map((spec): KycRow<D> => {
    const doc = latest.get(spec.kind) ?? null;
    return { spec, doc, state: doc ? doc.status : 'missing' };
  });
  const blocking = rows.filter((r) => !r.spec.optional && r.state !== 'verified');
  return { rows, blocking, ready: blocking.length === 0 };
}

// ---------- Escalations, guides, staff push ----------

/** Same @Roles as the API: disputes + guide list = support; marking a guide verified = admin. */
export const ESCALATION_ROLES = ['support'] as const;
export const GUIDE_LIST_ROLES = ['support'] as const;
export const GUIDE_VERIFY_ROLES = ['admin'] as const;

/** A published guide needs a fresh check when it was never verified or the last check is older than this. */
export const GUIDE_STALE_DAYS = 90;

export function guideNeedsCheck(lastVerifiedAt: string | null, now: number): boolean {
  if (!lastVerifiedAt) return true;
  const at = Date.parse(lastVerifiedAt);
  return Number.isNaN(at) || now - at > GUIDE_STALE_DAYS * 86_400_000;
}

/**
 * Staff alerts link to the admin website (apps/api notifyStaff → adminLink). Map them to this app's screens;
 * null = no screen for it (open Pulse).
 */
export function alertRoute(link: string | null | undefined): string | null {
  if (!link) return null;
  const path = link.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0];
  if (path === '/disputes') return '/escalations';
  if (path === '/review') return '/queue';
  const partner = path.match(/^\/partners\/([0-9a-f-]{36})$/i);
  if (partner) return `/kyc/${partner[1]}`;
  return null;
}
