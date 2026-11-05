import { SetMetadata } from '@nestjs/common';
import type { StaffRole } from '@applyfields/types';

export const ROLES_KEY = 'roles';

/**
 * Decorator to require specific staff roles or role levels on admin routes.
 *
 * Example:
 *   @Roles('reviewer') // reviewer and above (reviewer, admin, super_admin)
 *   @Roles('admin')    // admin and above (admin, super_admin)
 *   @Roles('super_admin') // super_admin only
 */
export const Roles = (...roles: StaffRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Hierarchy ranks for staff roles. Higher number = higher permission.
 * super_admin (50) > admin (40) > reviewer (30) > content_editor (20) > support (10)
 */
export const ROLE_LEVELS: Record<StaffRole, number> = {
  super_admin: 50,
  admin: 40,
  partner_manager: 35,
  partner_ops: 25,
  services_officer: 30,
  case_agent: 20,
  content_reviewer: 30,
  reviewer: 30,
  scraper_lead: 25,
  content_editor: 20,
  career_curator: 30,
  institution_analyst: 25,
  support: 10,
};

/**
 * A user passes when they hold one of the listed roles, or they are admin / super_admin
 * at or above the lowest listed level. Roles are departments, not a ladder:
 *   reviewer, content_editor → Apply & Career content
 *   support                  → Partners & Citizen Services
 *   admin, super_admin       → everything (only super_admin passes @Roles('super_admin'))
 */
export function hasStaffPermission(
  userRoles: StaffRole[],
  requiredRoles?: StaffRole[],
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (!requiredRoles || requiredRoles.length === 0) return true;

  const minRequiredLevel = Math.min(...requiredRoles.map((r) => ROLE_LEVELS[r] ?? 0));
  return userRoles.some((role) => {
    if (requiredRoles.includes(role)) return true;
    const level = ROLE_LEVELS[role] ?? 0;
    return level >= ROLE_LEVELS.admin && level >= minRequiredLevel;
  });
}
