'use client';

import { useState, useTransition } from 'react';
import { buttonClass, Badge, cn } from '@applyfields/ui';
import { ShieldCheck, ShieldOff, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  blockUserAction,
  unblockUserAction,
  grantRoleAction,
  revokeRoleAction,
} from '@/lib/actions';
import type { StaffRole } from '@applyfields/types';

const ALL_ROLES: StaffRole[] = ['super_admin', 'admin', 'reviewer', 'content_editor', 'support'];

export function UserStatusActions({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggle = () => {
    const action = status === 'active' ? blockUserAction : unblockUserAction;
    const label = status === 'active' ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${label} this user?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await action(userId);
      if (res.ok) router.refresh();
      else setError(res.error ?? `Failed to ${label}`);
    });
  };

  return (
    <div>
      <button
        onClick={toggle}
        disabled={isPending}
        className={buttonClass({
          variant: status === 'active' ? 'secondary' : 'primary',
          size: 'sm',
          className: status === 'active' ? 'border-red-300 text-red-700 hover:bg-red-50' : undefined,
        })}
      >
        {status === 'active' ? (
          <>
            <Lock className="mr-1.5 size-3.5" /> Block user
          </>
        ) : (
          <>
            <Unlock className="mr-1.5 size-3.5" /> Unblock user
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function UserRoleActions({
  userId,
  currentRoles,
}: {
  userId: string;
  currentRoles: StaffRole[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const grant = (role: StaffRole) => {
    if (!confirm(`Grant "${role.replace('_', ' ')}" to this user?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await grantRoleAction(userId, role);
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Failed to grant role');
    });
  };

  const revoke = (role: StaffRole) => {
    if (!confirm(`Revoke "${role.replace('_', ' ')}" from this user?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await revokeRoleAction(userId, role);
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Failed to revoke role');
    });
  };

  return (
    <div className="space-y-3">
      {/* Current roles */}
      {currentRoles.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {currentRoles.map((r) => (
            <span key={r} className="inline-flex items-center gap-1.5">
              <Badge tone="celadon" className="text-xs font-bold uppercase">
                <ShieldCheck className="mr-1 size-3" />
                {r.replace('_', ' ')}
              </Badge>
              <button
                onClick={() => revoke(r)}
                disabled={isPending}
                className="rounded p-0.5 text-teal/50 hover:text-red-600 transition-colors"
                title={`Revoke ${r}`}
              >
                <ShieldOff className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-teal/60 italic">No staff roles — regular citizen account</p>
      )}

      {/* Grant new role */}
      {ALL_ROLES.filter((r) => !currentRoles.includes(r)).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-teal/60 self-center mr-1">Grant:</span>
          {ALL_ROLES.filter((r) => !currentRoles.includes(r)).map((r) => (
            <button
              key={r}
              onClick={() => grant(r)}
              disabled={isPending}
              className={cn(
                buttonClass({ variant: 'secondary', size: 'sm' }),
                'text-xs',
              )}
            >
              + {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
