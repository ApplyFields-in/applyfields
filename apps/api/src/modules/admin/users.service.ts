import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminUserItem,
  AdminUserList,
  StaffRole,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AdminUsersQuery {
  q?: string;
  page?: number | string;
  limit?: number | string;
  status?: string;
}

// ---- PII masking helpers ----

/** `likhith@gmail.com` → `l*****h@gmail.com` */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return `***@${domain ?? '***'}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local.at(-1)}@${domain}`;
}

/** `+919876543210` → `+91****3210` */
function maskPhone(phone: string): string {
  if (phone.length <= 6) return '****' + phone.slice(-2);
  return phone.slice(0, phone.length - 8) + '****' + phone.slice(-4);
}

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AdminUsersQuery = {},
  ): Promise<AdminUserList & { page: number; limit: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { user_profiles: { full_name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, userRows] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          user_profiles: true,
          user_roles_user_roles_user_idTousers: true,
        },
      }),
    ]);

    const users: AdminUserItem[] = userRows.map((u) => ({
      id: u.id,
      email: u.email ? maskEmail(u.email) : null,
      phone: u.phone ? maskPhone(u.phone) : null,
      status: u.status,
      full_name: u.user_profiles?.full_name ?? null,
      gender: u.user_profiles?.gender ?? null,
      category: u.user_profiles?.category ?? null,
      state_code: u.user_profiles?.state_code ?? null,
      avatar_url: u.user_profiles?.avatar_url ?? null,
      email_verified: Boolean(u.email_verified_at),
      phone_verified: Boolean(u.phone_verified_at),
      created_at: u.created_at.toISOString(),
      roles: (u.user_roles_user_roles_user_idTousers || []).map(
        (r) => r.role as StaffRole,
      ),
    }));

    return {
      users,
      total,
      page,
      limit,
    };
  }

  // ---- Single user detail (masked) ----

  async detail(userId: string): Promise<AdminUserItem> {
    const u = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_profiles: true,
        user_roles_user_roles_user_idTousers: true,
      },
    });
    if (!u) throw new NotFoundException('User not found');

    return {
      id: u.id,
      email: u.email ? maskEmail(u.email) : null,
      phone: u.phone ? maskPhone(u.phone) : null,
      status: u.status,
      full_name: u.user_profiles?.full_name ?? null,
      gender: u.user_profiles?.gender ?? null,
      category: u.user_profiles?.category ?? null,
      state_code: u.user_profiles?.state_code ?? null,
      avatar_url: u.user_profiles?.avatar_url ?? null,
      email_verified: Boolean(u.email_verified_at),
      phone_verified: Boolean(u.phone_verified_at),
      created_at: u.created_at.toISOString(),
      roles: (u.user_roles_user_roles_user_idTousers || []).map(
        (r) => r.role as StaffRole,
      ),
    };
  }

  // ---- Block / unblock ----

  async setStatus(
    userId: string,
    newStatus: 'active' | 'suspended',
    actorId: string | null,
  ): Promise<AdminUserItem> {
    const u = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException('User not found');
    if (u.status === newStatus)
      throw new BadRequestException(`User is already ${newStatus}`);

    await this.prisma.users.update({
      where: { id: userId },
      data: { status: newStatus, updated_at: new Date() },
    });

    await this.prisma.audit_logs.create({
      data: {
        actor_id: actorId,
        action: newStatus === 'suspended' ? 'user.block' : 'user.unblock',
        target_type: 'user',
        target_id: userId,
        details: { previous_status: u.status },
      },
    });

    return this.detail(userId);
  }

  // ---- Grant / revoke staff role ----

  private static readonly VALID_ROLES: StaffRole[] = [
    'super_admin',
    'admin',
    'reviewer',
    'content_editor',
    'support',
  ];

  async grantRole(
    userId: string,
    role: StaffRole,
    actorId: string | null,
  ): Promise<AdminUserItem> {
    if (!UsersAdminService.VALID_ROLES.includes(role))
      throw new BadRequestException(`Invalid role: ${role}`);

    const u = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException('User not found');

    // upsert: grant is idempotent
    await this.prisma.$executeRawUnsafe(
      `insert into user_roles (user_id, role, granted_by, granted_at)
       values ($1::uuid, $2::staff_role, $3::uuid, now())
       on conflict (user_id, role) do nothing`,
      userId,
      role,
      actorId,
    );

    await this.prisma.audit_logs.create({
      data: {
        actor_id: actorId,
        action: 'user.grant_role',
        target_type: 'user',
        target_id: userId,
        details: { role },
      },
    });

    return this.detail(userId);
  }

  async revokeRole(
    userId: string,
    role: StaffRole,
    actorId: string | null,
  ): Promise<AdminUserItem> {
    if (!UsersAdminService.VALID_ROLES.includes(role))
      throw new BadRequestException(`Invalid role: ${role}`);

    const u = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException('User not found');

    const deleted = await this.prisma.user_roles.deleteMany({
      where: { user_id: userId, role: role as any },
    });

    if (deleted.count === 0)
      throw new BadRequestException(`User does not have role ${role}`);

    await this.prisma.audit_logs.create({
      data: {
        actor_id: actorId,
        action: 'user.revoke_role',
        target_type: 'user',
        target_id: userId,
        details: { role },
      },
    });

    return this.detail(userId);
  }
}
