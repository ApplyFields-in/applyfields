import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { StaffRole } from '@applyfields/types';

export interface StaffUser {
  id: string;
  email: string | null;
  name: string | null;
  roles: StaffRole[];
}

/**
 * The logged-in staff member's user id, for audit logs and published_by.
 */
export const ActorId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<{ staff?: StaffUser }>();
    return req.staff?.id ?? null;
  },
);

/**
 * The full logged-in staff object: { id, email, name, roles }.
 */
export const StaffMember = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): StaffUser | null => {
    const req = ctx.switchToHttp().getRequest<{ staff?: StaffUser }>();
    return req.staff ?? null;
  },
);
