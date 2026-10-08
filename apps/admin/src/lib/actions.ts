'use server';

import { revalidatePath } from 'next/cache';
import type { AdminUserItem, ManualAlertInput, ManualAlertResult, OpportunityInput, OpportunityStatus, StatusChange, UpdateInput, WriteResult } from '@applyfields/types';
import { apiDelete, apiPost, apiPut } from './api';

export interface ActionResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/** Publish an opportunity draft once required fields are checked. */
export async function publishOpportunityAction(id: string): Promise<ActionResponse<WriteResult>> {
  const res = await apiPost<WriteResult>(`/admin/opportunities/${encodeURIComponent(id)}/publish`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${id}`);
  revalidatePath('/review');
  revalidatePath(`/review/${id}`);
  revalidatePath('/');
  return { ok: true, data: res.data! };
}

/** Change opportunity status (unpublish → draft, close → closed, archive/reject → archived). */
export async function setOpportunityStatusAction(
  id: string,
  status: OpportunityStatus,
  reason?: string,
): Promise<ActionResponse<WriteResult>> {
  const body: StatusChange = {
    status: status as 'draft' | 'closed' | 'archived',
    reason,
  };
  const res = await apiPost<WriteResult>(`/admin/opportunities/${encodeURIComponent(id)}/status`, body);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${id}`);
  revalidatePath('/review');
  revalidatePath('/');
  return { ok: true, data: res.data! };
}

/** Save an opportunity (all fields). */
export async function saveOpportunityAction(id: string, input: OpportunityInput): Promise<ActionResponse<WriteResult>> {
  const res = await apiPut<WriteResult>(`/admin/opportunities/${encodeURIComponent(id)}`, input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${id}`);
  revalidatePath('/review');
  revalidatePath(`/review/${id}`);
  return { ok: true, data: res.data! };
}

/** Create a new opportunity manually. */
export async function createOpportunityAction(input: OpportunityInput): Promise<ActionResponse<WriteResult>> {
  const res = await apiPost<WriteResult>('/admin/opportunities', input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/opportunities');
  revalidatePath('/review');
  return { ok: true, data: res.data! };
}

/** Trigger hourly auto-close sweep right now. */
export async function closeExpiredOpportunitiesAction(): Promise<ActionResponse<{ closed: number }>> {
  const res = await apiPost<{ closed: number }>('/admin/opportunities/close-expired');
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/opportunities');
  revalidatePath('/');
  return { ok: true, data: res.data! };
}

/** Publish an update (admit card, result, answer key). */
export async function publishUpdateAction(id: string): Promise<ActionResponse<WriteResult>> {
  const res = await apiPost<WriteResult>(`/admin/updates/${encodeURIComponent(id)}/publish`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/updates');
  revalidatePath(`/updates/${id}`);
  return { ok: true, data: res.data! };
}

/** Change update status (draft or archived). */
export async function setUpdateStatusAction(
  id: string,
  status: 'draft' | 'archived',
  reason?: string,
): Promise<ActionResponse<WriteResult>> {
  const body: StatusChange = { status, reason };
  const res = await apiPost<WriteResult>(`/admin/updates/${encodeURIComponent(id)}/status`, body);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/updates');
  revalidatePath(`/updates/${id}`);
  return { ok: true, data: res.data! };
}

/** Save an update (all fields). */
export async function saveUpdateAction(id: string, input: UpdateInput): Promise<ActionResponse<WriteResult>> {
  const res = await apiPut<WriteResult>(`/admin/updates/${encodeURIComponent(id)}`, input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/updates');
  revalidatePath(`/updates/${id}`);
  return { ok: true, data: res.data! };
}

/** Create an update manually. */
export async function createUpdateAction(input: UpdateInput): Promise<ActionResponse<WriteResult>> {
  const res = await apiPost<WriteResult>('/admin/updates', input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/updates');
  return { ok: true, data: res.data! };
}

// ---------- User management (Session 02) ----------

/** Block (suspend) a user account. */
export async function blockUserAction(id: string): Promise<ActionResponse<AdminUserItem>> {
  const res = await apiPost<AdminUserItem>(`/admin/users/${encodeURIComponent(id)}/block`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  return { ok: true, data: res.data! };
}

/** Unblock (reactivate) a suspended user. */
export async function unblockUserAction(id: string): Promise<ActionResponse<AdminUserItem>> {
  const res = await apiPost<AdminUserItem>(`/admin/users/${encodeURIComponent(id)}/unblock`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  return { ok: true, data: res.data! };
}

/** Grant a staff role. */
export async function grantRoleAction(id: string, role: string): Promise<ActionResponse<AdminUserItem>> {
  const res = await apiPost<AdminUserItem>(`/admin/users/${encodeURIComponent(id)}/roles`, { role });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  return { ok: true, data: res.data! };
}

/** Revoke a staff role. */
export async function revokeRoleAction(id: string, role: string): Promise<ActionResponse<AdminUserItem>> {
  const res = await apiDelete<AdminUserItem>(`/admin/users/${encodeURIComponent(id)}/roles/${encodeURIComponent(role)}`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  return { ok: true, data: res.data! };
}

/** Send a manual alert (in-app + email) to everyone who saved a job, or to one user. */
export async function sendManualAlertAction(input: ManualAlertInput): Promise<ActionResponse<ManualAlertResult>> {
  const res = await apiPost<ManualAlertResult>('/admin/notifications/alert', input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/notifications');
  return { ok: true, data: res.data! };
}

/** Put a failed email back in the queue. */
export async function retryDeliveryAction(id: string): Promise<ActionResponse> {
  const res = await apiPost(`/admin/notifications/${encodeURIComponent(id)}/retry`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/notifications');
  return { ok: true };
}
