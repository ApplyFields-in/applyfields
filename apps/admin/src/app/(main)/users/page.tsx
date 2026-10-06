import type { AdminUserList } from '@applyfields/types';
import { Badge, Card, EmptyState, PageHeader } from '@applyfields/ui';
import { CheckCircle2, ChevronLeft, ChevronRight, Mail, Phone, Search, Users, XCircle } from 'lucide-react';
import { connection } from 'next/server';
import Link from 'next/link';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';

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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (currentPage > 1) queryParams.set('page', String(currentPage));

  const qs = queryParams.toString();
  const endpoint = `/admin/users${qs ? `?${qs}` : ''}`;
  const data = await apiGet<AdminUserList & { page: number; limit: number }>(endpoint);

  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Registered citizen and staff accounts stored securely in Supabase PostgreSQL."
        icon={<Users />}
        actions={
          data ? (
            <Badge tone="celadon">
              {total} {total === 1 ? 'Account' : 'Accounts'} Registered
            </Badge>
          ) : undefined
        }
      />

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
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-teal px-3 py-1 text-xs font-semibold text-cream hover:bg-teal/90 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {!data ? (
        <ApiOffline />
      ) : data.users.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Users className="size-8 text-tea" />}
            title={q ? 'No matching users found' : 'No users registered yet'}
            text={
              q
                ? `No accounts matched your search "${q}". Try another search term.`
                : 'Citizen accounts will appear here immediately upon sign up on the public portal.'
            }
          />
        </Card>
      ) : (
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-teal/80">
                  <th className="py-2.5 pr-4 font-bold">User</th>
                  <th className="py-2.5 pr-4 font-bold">Contact</th>
                  <th className="py-2.5 pr-4 font-bold">Demographics</th>
                  <th className="py-2.5 pr-4 font-bold">Verification</th>
                  <th className="py-2.5 pr-4 font-bold">Status</th>
                  <th className="py-2.5 font-bold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.users.map((u) => (
                  <tr key={u.id} className="hover:bg-tea/10 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-tea/40 flex items-center justify-center font-bold text-teal text-xs shrink-0">
                          {u.full_name
                            ? u.full_name.charAt(0).toUpperCase()
                            : (u.email?.charAt(0).toUpperCase() ?? 'U')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-teal leading-tight">
                              {u.full_name || 'Profile incomplete'}
                            </p>
                            {u.roles && u.roles.length > 0 && (
                              <Badge tone="celadon" className="text-[10px] uppercase font-bold py-0.5">
                                {u.roles[0].replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-mono text-teal/60 mt-0.5 truncate max-w-[180px]">
                            {u.id}
                          </p>
                        </div>
                      </div>
                    </td>
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
                    <td className="py-3.5 pr-4">
                      <Badge tone={u.status === 'active' ? 'celadon' : 'outline'} className="text-xs">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-xs text-teal/80 whitespace-nowrap">
                      {when(u.created_at)}
                    </td>
                  </tr>
                ))}
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
                    href={`/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(currentPage - 1) }).toString()}`}
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
                    href={`/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(currentPage + 1) }).toString()}`}
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
