import type { AdminMeResponse, AdminUserItem } from '@applyfields/types';
import { Badge, Card, PageHeader } from '@applyfields/ui';
import { ArrowLeft, CheckCircle2, Mail, Phone, Shield, User, XCircle } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';
import { UserStatusActions, UserRoleActions } from '@/components/user-actions';

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

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [user, me] = await Promise.all([
    apiGet<AdminUserItem>(`/admin/users/${encodeURIComponent(id)}`),
    apiGet<AdminMeResponse>('/admin/me'),
  ]);

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="People" title="User not found" icon={<User />} />
        <Card className="p-8 text-center max-w-md mx-auto my-8">
          <p className="text-sm text-teal/80">
            This account does not exist or you do not have permission to view it.
          </p>
          <div className="mt-4">
            <Link
              href="/users"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-4 py-2 text-xs font-semibold text-teal hover:bg-cream/80"
            >
              <ArrowLeft className="size-3.5" /> Back to users
            </Link>
          </div>
        </Card>
      </>
    );
  }

  const isSuperAdmin = me?.roles?.includes('super_admin') ?? false;
  const isAdmin = me?.roles?.includes('admin') ?? false;
  const canManageStatus = isSuperAdmin || isAdmin;
  const isTargetStaff = Boolean(user.roles && user.roles.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="People"
        title={user.full_name || 'Profile incomplete'}
        description={`User ID: ${user.id}`}
        icon={isTargetStaff ? <Shield className="text-amber-600" /> : <User />}
        actions={
          <Link
            href="/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to users
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left: profile info */}
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal/80">
              Account info
            </h3>
            {isTargetStaff ? (
              <Badge tone="celadon" className="text-xs uppercase font-bold">
                Staff Account
              </Badge>
            ) : (
              <Badge tone="outline" className="text-xs uppercase font-medium">
                Citizen Account
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-sm">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div
                className={`size-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                  isTargetStaff ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-tea/40 text-teal'
                }`}
              >
                {user.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : (user.email?.charAt(0).toUpperCase() ?? 'U')}
              </div>
              <div>
                <p className="font-bold text-teal text-base">
                  {user.full_name || 'Profile incomplete'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    tone={user.status === 'active' ? 'celadon' : 'outline'}
                    className="text-xs"
                  >
                    {user.status}
                  </Badge>
                  {user.roles?.map((r) => (
                    <Badge key={r} tone="tea" className="text-[11px] uppercase font-bold">
                      {r.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact (masked) */}
            {user.email && (
              <div className="flex items-center gap-2 text-teal/90">
                <Mail className="size-4 text-sea" />
                <span>{user.email}</span>
                {user.email_verified ? (
                  <CheckCircle2 className="size-3.5 text-sea" />
                ) : (
                  <XCircle className="size-3.5 text-teal/40" />
                )}
                <span className="text-xs text-teal/60">
                  {user.email_verified ? 'verified' : 'unverified'}
                </span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-teal/90">
                <Phone className="size-4 text-sea" />
                <span>{user.phone}</span>
                {user.phone_verified ? (
                  <CheckCircle2 className="size-3.5 text-sea" />
                ) : (
                  <XCircle className="size-3.5 text-teal/40" />
                )}
                <span className="text-xs text-teal/60">
                  {user.phone_verified ? 'verified' : 'unverified'}
                </span>
              </div>
            )}

            {/* Demographics */}
            <div className="flex flex-wrap gap-2 pt-1">
              {user.gender && (
                <Badge tone="tea" className="text-xs capitalize">
                  {user.gender}
                </Badge>
              )}
              {user.category && (
                <Badge tone="celadon" className="text-xs">
                  {user.category}
                </Badge>
              )}
              {user.state_code && (
                <Badge tone="tea" className="text-xs">
                  {user.state_code}
                </Badge>
              )}
            </div>

            {/* Registered date */}
            <p className="text-xs text-teal/60 pt-1">
              Registered {when(user.created_at)}
            </p>
          </div>
        </Card>

        {/* Right: actions */}
        <div className="space-y-6">
          {/* Block / unblock */}
          {canManageStatus && (
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal/80">
                Account status
              </h3>
              <p className="text-xs text-teal/60">
                Blocking suspends the user&apos;s access. They can&apos;t log in or use saved data until unblocked.
              </p>
              <UserStatusActions userId={user.id} status={user.status} />
            </Card>
          )}

          {/* Roles - super_admin only */}
          {isSuperAdmin && (
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal/80">
                Staff roles
              </h3>
              <p className="text-xs text-teal/60">
                Only super admins can grant or revoke staff roles. Every change is recorded in the audit log.
              </p>
              <UserRoleActions
                userId={user.id}
                currentRoles={user.roles ?? []}
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
