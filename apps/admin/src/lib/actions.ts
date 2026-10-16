'use server';

import { revalidatePath } from 'next/cache';
import type {
  AdminBroadcastInput,
  AdminBroadcastResult,
  AdminInstitutionInput,
  AdminUserItem,
  GovServiceInput,
  InstitutionDetail,
  ManualAlertInput,
  ManualAlertResult,
  OpportunityInput,
  OpportunityStatus,
  OpportunityVersionListResponse,
  StatusChange,
  UpdateInput,
  WriteResult,
} from '@applyfields/types';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './api';

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

/** Broadcast an alert across In-App and Web Push channels to All, Subscribers, or Savers. */
export async function sendBroadcastAction(input: AdminBroadcastInput): Promise<ActionResponse<AdminBroadcastResult>> {
  const res = await apiPost<AdminBroadcastResult>('/admin/notifications/broadcast', input);
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

// ---------- Government Services (Session 06) ----------

export async function createServiceAction(input: GovServiceInput): Promise<ActionResponse<WriteResult>> {
  const res = await apiPost<WriteResult>('/admin/services', input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/services');
  return { ok: true, data: res.data! };
}

export async function saveServiceAction(id: string, input: GovServiceInput): Promise<ActionResponse<WriteResult>> {
  const res = await apiPut<WriteResult>(`/admin/services/${encodeURIComponent(id)}`, input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/services');
  revalidatePath(`/services/${id}`);
  return { ok: true, data: res.data! };
}

export async function publishServiceAction(id: string): Promise<ActionResponse<WriteResult>> {
  const res = await apiPost<WriteResult>(`/admin/services/${encodeURIComponent(id)}/publish`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/services');
  revalidatePath(`/services/${id}`);
  return { ok: true, data: res.data! };
}

export async function setServiceStatusAction(
  id: string,
  status: OpportunityStatus,
  reason?: string,
): Promise<ActionResponse<WriteResult>> {
  const res = await apiPost<WriteResult>(`/admin/services/${encodeURIComponent(id)}/status`, { status, reason });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/services');
  revalidatePath(`/services/${id}`);
  return { ok: true, data: res.data! };
}

export async function deleteServiceAction(id: string): Promise<ActionResponse<{ success: boolean }>> {
  const res = await apiDelete<{ success: boolean }>(`/admin/services/${encodeURIComponent(id)}`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/services');
  return { ok: true, data: res.data! };
}

/** Fetch version history for an opportunity. */
export async function getOpportunityVersionsAction(
  id: string,
): Promise<ActionResponse<OpportunityVersionListResponse>> {
  const res = await apiGet<OpportunityVersionListResponse>(
    `/admin/opportunities/${encodeURIComponent(id)}/versions`,
  );
  if (!res) return { ok: false, error: 'Failed to fetch version history' };
  return { ok: true, data: res };
}

/** Restore an approved previous version snapshot. */
export async function restoreOpportunityVersionAction(
  id: string,
  versionNo: number,
): Promise<ActionResponse<{ ok: boolean; version: number }>> {
  const res = await apiPost<{ ok: boolean; version: number }>(
    `/admin/opportunities/${encodeURIComponent(id)}/versions/${versionNo}/restore`,
  );
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${id}`);
  revalidatePath('/review');
  revalidatePath(`/review/${id}`);
  return { ok: true, data: res.data! };
}

/** Create a new institution / college */
export async function createCollegeAction(
  input: AdminInstitutionInput,
): Promise<ActionResponse<InstitutionDetail>> {
  const res = await apiPost<InstitutionDetail>('/admin/institutions', input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/colleges');
  return { ok: true, data: res.data! };
}

/** Update / edit / fill missing fields for an institution */
export async function updateCollegeAction(
  id: string,
  input: Partial<AdminInstitutionInput>,
): Promise<ActionResponse<InstitutionDetail>> {
  const res = await apiPatch<InstitutionDetail>(`/admin/institutions/${encodeURIComponent(id)}`, input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/colleges');
  return { ok: true, data: res.data! };
}

/** Delete an institution */
export async function deleteCollegeAction(
  id: string,
): Promise<ActionResponse<{ deleted: boolean; id: string }>> {
  const res = await apiDelete<{ deleted: boolean; id: string }>(`/admin/institutions/${encodeURIComponent(id)}`);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/colleges');
  return { ok: true, data: res.data! };
}

