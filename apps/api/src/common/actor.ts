import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * The logged-in staff member's user id, for audit logs and published_by.
 * null until staff login exists — the StaffGuard will set `request.staff`.
 */
export const ActorId = createParamDecorator((_: unknown, ctx: ExecutionContext): string | null => {
  const req = ctx.switchToHttp().getRequest<{ staff?: { id?: string } }>();
  return req.staff?.id ?? null;
});
