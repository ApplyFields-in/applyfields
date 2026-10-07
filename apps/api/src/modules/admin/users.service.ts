import { Injectable } from '@nestjs/common';
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
      email: u.email,
      phone: u.phone,
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
}
