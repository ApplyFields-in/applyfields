import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminUserItem,
  AdminUserList,
  AdminUserStats,
  StaffRole,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { StaffUser } from '../../common/actor.js';

export interface AdminUsersQuery {
  q?: string;
  page?: number | string;
  limit?: number | string;
  status?: string;
  type?: 'all' | 'staff' | 'citizens';
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
    requester?: StaffUser,
  ): Promise<
    AdminUserList & {
      page: number;
      limit: number;
      staff_count: number;
      citizen_count: number;
    }
  > {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const isSuperAdmin = requester?.roles.includes('super_admin') ?? false;
    const isAdmin = requester?.roles.includes('admin') ?? false;

    const andConditions: any[] = [];

    if (query.status && query.status !== 'all') {
      andConditions.push({ status: query.status });
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      andConditions.push({
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { user_profiles: { full_name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    // Role-based visibility:
    // 1. Other staff (reviewer, content_editor, support) only see normal citizen users (no staff roles)
    // 2. Admin sees other staff and users, but CANNOT see or track super_admin
    // 3. Super admin sees all users and all staff
    if (!isSuperAdmin && !isAdmin) {
      andConditions.push({
        user_roles_user_roles_user_idTousers: { none: {} },
      });
    } else if (isAdmin && !isSuperAdmin) {
      andConditions.push({
        user_roles_user_roles_user_idTousers: { none: { role: 'super_admin' } },
      });
      if (query.type === 'staff') {
        andConditions.push({
          user_roles_user_roles_user_idTousers: { some: {} },
        });
      } else if (query.type === 'citizens') {
        andConditions.push({
          user_roles_user_roles_user_idTousers: { none: {} },
        });
      }
    } else if (isSuperAdmin) {
      if (query.type === 'staff') {
        andConditions.push({
          user_roles_user_roles_user_idTousers: { some: {} },
        });
      } else if (query.type === 'citizens') {
        andConditions.push({
          user_roles_user_roles_user_idTousers: { none: {} },
        });
      }
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    // Calculate staff and citizen totals visible to requester
    let staffCountPromise: Promise<number>;
    let citizenCountPromise: Promise<number>;

    if (!isSuperAdmin && !isAdmin) {
      staffCountPromise = Promise.resolve(0);
      citizenCountPromise = this.prisma.users.count({
        where: { user_roles_user_roles_user_idTousers: { none: {} } },
      });
    } else if (isAdmin && !isSuperAdmin) {
      staffCountPromise = this.prisma.users.count({
        where: {
          AND: [
            { user_roles_user_roles_user_idTousers: { some: {} } },
            { user_roles_user_roles_user_idTousers: { none: { role: 'super_admin' } } },
          ],
        },
      });
      citizenCountPromise = this.prisma.users.count({
        where: { user_roles_user_roles_user_idTousers: { none: {} } },
      });
    } else {
      staffCountPromise = this.prisma.users.count({
        where: { user_roles_user_roles_user_idTousers: { some: {} } },
      });
      citizenCountPromise = this.prisma.users.count({
        where: { user_roles_user_roles_user_idTousers: { none: {} } },
      });
    }

    const [total, userRows, staff_count, citizen_count] = await Promise.all([
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
      staffCountPromise,
      citizenCountPromise,
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
      staff_count,
      citizen_count,
    };
  }

  // ---- Single user detail (masked) ----

  async detail(userId: string, requester?: StaffUser): Promise<AdminUserItem> {
    const u = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_profiles: true,
        user_roles_user_roles_user_idTousers: true,
      },
    });
    if (!u) throw new NotFoundException('User not found');

    const targetRoles = (u.user_roles_user_roles_user_idTousers || []).map(
      (r) => r.role as StaffRole,
    );

    const isSuperAdmin = requester?.roles.includes('super_admin') ?? false;
    const isAdmin = requester?.roles.includes('admin') ?? false;

    // Rule 1: Admin or other staff cannot see or track super_admin
    if (targetRoles.includes('super_admin') && !isSuperAdmin) {
      throw new NotFoundException('User not found');
    }

    // Rule 2: Other staff only see citizen users (no staff accounts)
    if (targetRoles.length > 0 && !isSuperAdmin && !isAdmin) {
      throw new NotFoundException('User not found');
    }

    const where = { user_id: userId };
    const [saved, applications, documents, bookings] = await Promise.all([
      this.prisma.saved_items.count({ where }),
      this.prisma.applications.count({ where }),
      this.prisma.user_documents.count({ where: { ...where, deleted_at: null } }),
      this.prisma.service_requests.count({ where }),
    ]);

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
      roles: targetRoles,
      last_login_at: u.last_login_at?.toISOString() ?? null,
      activity: { saved, applications, documents, bookings },
    };
  }

  // ---- Citizen statistics (staff accounts excluded) ----

  async stats(): Promise<AdminUserStats> {
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const midnight = new Date(new Date().setHours(0, 0, 0, 0));
    const week = new Date(now - 7 * DAY);
    const month = new Date(now - 30 * DAY);
    const citizen = { user_roles_user_roles_user_idTousers: { none: {} } };
    const count = (extra: object) => this.prisma.users.count({ where: { ...citizen, ...extra } });
    const profileWhere = { users: citizen };

    const [total, today, wk, mo, activeWk, activeMo, verified, suspended, deleted, states, categories] =
      await Promise.all([
        count({}),
        count({ created_at: { gte: midnight } }),
        count({ created_at: { gte: week } }),
        count({ created_at: { gte: month } }),
        count({ last_login_at: { gte: week } }),
        count({ last_login_at: { gte: month } }),
        count({ OR: [{ email_verified_at: { not: null } }, { phone_verified_at: { not: null } }] }),
        count({ status: 'suspended' }),
        this.prisma.audit_logs.count({
          where: { action: { in: ['user.self_delete', 'user.admin_delete'] }, created_at: { gte: month } },
        }),
        this.prisma.user_profiles.groupBy({ by: ['state_code'], where: profileWhere, _count: { _all: true } }),
        this.prisma.user_profiles.groupBy({ by: ['category'], where: profileWhere, _count: { _all: true } }),
      ]);

    const top = (rows: { key: string | null; n: number }[]) =>
      rows
        .map((r) => ({ key: r.key ?? 'Not set', count: r.n }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
      total,
      signups: { today, week: wk, month: mo },
      active: { week: activeWk, month: activeMo },
      verified,
      suspended,
      deleted_month: deleted,
      by_state: top(states.map((s) => ({ key: s.state_code, n: s._count._all }))),
      by_category: top(categories.map((c) => ({ key: c.category, n: c._count._all }))),
    };
  }

  /** Only plain citizen accounts can be erased by staff; staff must lose their roles first. */
  async assertDeletable(userId: string, actorId: string | null): Promise<void> {
    if (userId === actorId) throw new BadRequestException('You cannot delete your own account here.');
    const u = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { user_roles_user_roles_user_idTousers: true },
    });
    if (!u) throw new NotFoundException('User not found');
    if (u.user_roles_user_roles_user_idTousers.length > 0) {
      throw new BadRequestException('This is a staff account. Revoke all staff roles before deleting it.');
    }
  }

  // ---- Block / unblock ----

  async setStatus(
    userId: string,
    newStatus: 'active' | 'suspended',
    actorId: string | null,
    requester?: StaffUser,
  ): Promise<AdminUserItem> {
    const u = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles_user_roles_user_idTousers: true,
      },
    });
    if (!u) throw new NotFoundException('User not found');

    const targetRoles = (u.user_roles_user_roles_user_idTousers || []).map(
      (r) => r.role as StaffRole,
    );
    const isSuperAdmin = requester?.roles.includes('super_admin') ?? false;

    // Admin cannot modify super_admin accounts
    if (targetRoles.includes('super_admin') && !isSuperAdmin) {
      throw new NotFoundException('User not found');
    }

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

    return this.detail(userId, requester);
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
    requester?: StaffUser,
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

    return this.detail(userId, requester);
  }

  async revokeRole(
    userId: string,
    role: StaffRole,
    actorId: string | null,
    requester?: StaffUser,
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

    return this.detail(userId, requester);
  }
}
