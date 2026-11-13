import type { PartnerVerificationStatus } from '@applyfields/types';

import { C } from '@/theme';

export const STATUS_COLOR: Record<PartnerVerificationStatus, string> = {
  pending: C.warn,
  verified: C.good,
  rejected: C.bad,
};

/** partner_type / status → "Xerox printing" */
export const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
