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
