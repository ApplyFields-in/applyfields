import type { AdminMeResponse, AdminUserList, StaffRole } from '@applyfields/types';
import { Badge, Card, EmptyState, PageHeader } from '@applyfields/ui';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { connection } from 'next/server';
import Link from 'next/link';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';
import { getMockAdminUsers } from '@/lib/mock-data';

export const metadata = { title: SECTIONS.users.title };

function when(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function RoleBadge({ role }: { role: StaffRole }) {
  switch (role) {
    case 'super_admin':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-500/30">
          <Shield className="size-3 text-amber-600" /> Super Admin
        </span>
      );
    case 'admin':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-teal/15 px-2 py-0.5 text-[11px] font-bold text-teal border border-teal/30">
          <ShieldCheck className="size-3 text-teal" /> Admin
        </span>
      );
    case 'reviewer':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-500/30">
          Reviewer
        </span>
      );
    case 'content_editor':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-500/30">
          Content Editor
        </span>
      );
    case 'support':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 px-2 py-0.5 text-[11px] font-bold text-purple-800 border border-purple-500/30">
          Support
        </span>
      );
    default:
      return (
        <Badge tone="celadon" className="text-[10px] uppercase">
          {String(role).replace('_', ' ')}
        </Badge>
      );
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; type?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const currentPage = Math.max(1, Number(sp.page) || 1);

  // Determine current logged-in staff permissions
  const me = await apiGet<AdminMeResponse>('/admin/me');
  const isSuperAdmin = me?.roles?.includes('super_admin') ?? false;
  const isAdmin = me?.roles?.includes('admin') ?? false;
  const canSeeStaff = isSuperAdmin || isAdmin;

  // Selected filter (only super_admin and admin can filter between staff and citizens)
  const activeType = canSeeStaff && (sp.type === 'staff' || sp.type === 'citizens') ? sp.type : 'all';

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (currentPage > 1) queryParams.set('page', String(currentPage));
  if (canSeeStaff && activeType !== 'all') queryParams.set('type', activeType);

  const qs = queryParams.toString();
  const endpoint = `/admin/users${qs ? `?${qs}` : ''}`;
  const data = await apiGet<
    AdminUserList & {
      page: number;
      limit: number;
      staff_count?: number;
      citizen_count?: number;
    }
  >(endpoint);

  const mockFallback = getMockAdminUsers({ q, type: activeType, page: currentPage });
  const displayData = data && data.users.length > 0 ? data : mockFallback;
  const isMock = !data || data.users.length === 0;

  const total = displayData.total ?? 0;
  const limit = displayData.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const staffCount = displayData.staff_count ?? 0;
  const citizenCount = displayData.citizen_count ?? 0;
  const allCount = staffCount + citizenCount;

  function tabUrl(type: 'all' | 'staff' | 'citizens') {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type !== 'all') p.set('type', type);
    const s = p.toString();
    return `/users${s ? `?${s}` : ''}`;
  }

  function pageUrl(targetPage: number) {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (canSeeStaff && activeType !== 'all') p.set('type', activeType);
    if (targetPage > 1) p.set('page', String(targetPage));
    const s = p.toString();
    return `/users${s ? `?${s}` : ''}`;
  }

  return (
    <>
      <PageHeader
        eyebrow="People"
        title={canSeeStaff ? 'Users & Staff' : 'Registered Citizens'}
        description={
          isSuperAdmin
            ? 'Complete directory of all citizen users and internal staff across all 5 privilege tiers.'
            : isAdmin
              ? 'Directory of registered citizens and internal staff team members.'
              : 'Registered citizen accounts and verification details.'
        }
        icon={<Users />}
        actions={
          <div className="flex items-center gap-2">
            {isMock && (
              <Badge tone="outline" className="border-amber-500/40 text-amber-800 bg-amber-500/10">
                Demo Mode
              </Badge>
            )}
            <Badge tone="celadon">
              {total} {total === 1 ? 'Account' : 'Accounts'}
            </Badge>
          </div>
        }
      />

      {/* Filter Tabs for Super Admin & Admin */}
      {canSeeStaff && (
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-4">
          <Link
            href={tabUrl('all')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              activeType === 'all'
                ? 'bg-teal text-cream shadow-sm'
                : 'bg-cream text-teal/80 hover:bg-cream/80 border border-line'
            }`}
          >
            <span>All Accounts</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeType === 'all' ? 'bg-cream/20 text-cream' : 'bg-tea/30 text-teal'
              }`}
            >
              {allCount}
            </span>
          </Link>

          <Link
            href={tabUrl('staff')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              activeType === 'staff'
                ? 'bg-teal text-cream shadow-sm'
                : 'bg-cream text-teal/80 hover:bg-cream/80 border border-line'
            }`}
          >
            <Shield className="size-3.5" />
            <span>Staff Team</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeType === 'staff' ? 'bg-cream/20 text-cream' : 'bg-tea/30 text-teal'
              }`}
            >
              {staffCount}
            </span>
          </Link>

          <Link
            href={tabUrl('citizens')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              activeType === 'citizens'
                ? 'bg-teal text-cream shadow-sm'
                : 'bg-cream text-teal/80 hover:bg-cream/80 border border-line'
            }`}
          >
            <User className="size-3.5" />
            <span>Citizens</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeType === 'citizens' ? 'bg-cream/20 text-cream' : 'bg-tea/30 text-teal'
              }`}
            >
              {citizenCount}
            </span>
          </Link>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <form method="GET" action="/users" className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
          <input
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Search by name, email, or phone…"
            className="h-10 w-full rounded-xl border border-line bg-cream pl-10 pr-20 text-sm text-ink placeholder:text-teal/50 focus:border-sea focus:outline-none"
          />
          {canSeeStaff && activeType !== 'all' && (
            <input type="hidden" name="type" value={activeType} />
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-teal px-3 py-1 text-xs font-semibold text-cream hover:bg-teal/90 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {displayData.users.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Users className="size-8 text-tea" />}
            title={q ? 'No matching users found' : 'No accounts found'}
            text={
              q
                ? `No accounts matched your search "${q}". Try another search term.`
                : activeType === 'staff'
                  ? 'No staff accounts currently in this view.'
                  : 'Citizen accounts will appear here immediately upon sign up on the public portal.'
            }
          />
        </Card>
      ) : (
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-teal/80">
                  <th className="py-2.5 pr-4 font-bold">User</th>
                  <th className="py-2.5 pr-4 font-bold">Role / Account</th>
                  <th className="py-2.5 pr-4 font-bold">Contact</th>
                  <th className="py-2.5 pr-4 font-bold">Demographics</th>
                  <th className="py-2.5 pr-4 font-bold">Verification</th>
                  <th className="py-2.5 pr-4 font-bold">Status</th>
                  <th className="py-2.5 font-bold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {displayData.users.map((u) => {
                  const isStaffMember = Boolean(u.roles && u.roles.length > 0);
                  return (
                    <tr key={u.id} className="hover:bg-tea/10 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isStaffMember ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-tea/40 text-teal'
                            }`}
                          >
                            {u.full_name
                              ? u.full_name.charAt(0).toUpperCase()
                              : (u.email?.charAt(0).toUpperCase() ?? 'U')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/users/${u.id}`}
                                className="font-bold text-teal leading-tight hover:underline"
                              >
                                {u.full_name || 'Profile incomplete'}
                              </Link>
                            </div>
                            <p className="text-xs font-mono text-teal/60 mt-0.5 truncate max-w-[180px]">
                              {u.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Account Role */}
                      <td className="py-3.5 pr-4">
                        {isStaffMember ? (
                          <div className="flex flex-col gap-1 items-start">
                            {u.roles?.map((role) => (
                              <RoleBadge key={role} role={role} />
                            ))}
                            <span className="text-[10px] text-teal/60 font-medium">Internal Staff</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5 items-start">
                            <Badge tone="outline" className="text-[10px] uppercase font-semibold text-teal/70">
                              Citizen
                            </Badge>
                            <span className="text-[10px] text-teal/50">Public User</span>
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 pr-4">
                        <div className="space-y-1 text-xs">
                          {u.email && (
                            <div className="flex items-center gap-1.5 text-teal/90">
                              <Mail className="size-3 text-sea" />
                              <span>{u.email}</span>
                            </div>
                          )}
                          {u.phone && (
                            <div className="flex items-center gap-1.5 text-teal/90">
                              <Phone className="size-3 text-sea" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                          {!u.email && !u.phone && (
                            <span className="text-teal/50 italic">—</span>
                          )}
                        </div>
                      </td>

                      {/* Demographics */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {u.category && (
                            <Badge tone="celadon" className="text-xs">
                              {u.category}
                            </Badge>
                          )}
                          {u.state_code && (
                            <Badge tone="tea" className="text-xs">
                              {u.state_code}
                            </Badge>
                          )}
                          {u.gender && (
                            <span className="text-xs text-teal/70 capitalize">
                              {u.gender}
                            </span>
                          )}
                          {!u.category && !u.state_code && !u.gender && (
                            <span className="text-xs text-teal/50 italic">None set</span>
                          )}
                        </div>
                      </td>

                      {/* Verification */}
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-col gap-1 text-xs">
                          {u.email && (
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                u.email_verified ? 'text-teal' : 'text-teal/50'
                              }`}
                            >
                              {u.email_verified ? (
                                <CheckCircle2 className="size-3 text-sea" />
                              ) : (
                                <XCircle className="size-3" />
                              )}
                              Email {u.email_verified ? 'verified' : 'unverified'}
                            </span>
                          )}
                          {u.phone && (
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                u.phone_verified ? 'text-teal' : 'text-teal/50'
                              }`}
                            >
                              {u.phone_verified ? (
                                <CheckCircle2 className="size-3 text-sea" />
                              ) : (
                                <XCircle className="size-3" />
                              )}
                              Phone {u.phone_verified ? 'verified' : 'unverified'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 pr-4">
                        <Badge tone={u.status === 'active' ? 'celadon' : 'outline'} className="text-xs">
                          {u.status}
                        </Badge>
                      </td>

                      {/* Registered */}
                      <td className="py-3.5 text-xs text-teal/80 whitespace-nowrap">
                        {when(u.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-4 text-xs text-teal">
              <div>
                Page {currentPage} of {totalPages} ({total} total)
              </div>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={pageUrl(currentPage - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-cream px-2.5 py-1.5 font-semibold hover:bg-cream/80"
                  >
                    <ChevronLeft className="size-3.5" /> Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-line/40 bg-cream/40 px-2.5 py-1.5 text-teal/40 cursor-not-allowed">
                    <ChevronLeft className="size-3.5" /> Previous
                  </span>
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={pageUrl(currentPage + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-cream px-2.5 py-1.5 font-semibold hover:bg-cream/80"
                  >
                    Next <ChevronRight className="size-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-line/40 bg-cream/40 px-2.5 py-1.5 text-teal/40 cursor-not-allowed">
                    Next <ChevronRight className="size-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
