import type { AdminUserList } from '@applyfields/types';
import { Badge, Card, EmptyState, PageHeader } from '@applyfields/ui';
import { CheckCircle2, Mail, Phone, Users, XCircle } from 'lucide-react';
import { connection } from 'next/server';
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

export default async function UsersPage() {
  await connection();
  const data = await apiGet<AdminUserList>('/admin/users');

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Registered citizen accounts stored securely in Supabase PostgreSQL."
        icon={<Users />}
        actions={
          data ? (
            <Badge tone="celadon">
              {data.total} {data.total === 1 ? 'Citizen' : 'Citizens'} Registered
            </Badge>
          ) : undefined
        }
      />

      {!data ? (
        <ApiOffline />
      ) : data.users.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Users className="size-8 text-tea" />}
            title="No users registered yet"
            text="Citizen accounts will appear here immediately upon sign up on the public portal."
          />
        </Card>
      ) : (
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-teal/80">
                  <th className="py-2.5 pr-4 font-bold">Citizen</th>
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
                          <p className="font-bold text-teal leading-tight">
                            {u.full_name || 'Profile incomplete'}
                          </p>
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
        </Card>
      )}
    </>
  );
}
