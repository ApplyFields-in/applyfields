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
 * Checks if user's roles satisfy the required roles (considering hierarchy).
 */
export function hasStaffPermission(
  userRoles: StaffRole[],
  requiredRoles?: StaffRole[],
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    // Any valid staff member is permitted if no specific role is specified
    return userRoles.length > 0;
  }
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // If user has any role equal to or higher in the hierarchy than the minimum required role
  const minRequiredLevel = Math.min(
    ...requiredRoles.map((r) => ROLE_LEVELS[r] ?? 0),
  );
  return userRoles.some((role) => (ROLE_LEVELS[role] ?? 0) >= minRequiredLevel);
}
