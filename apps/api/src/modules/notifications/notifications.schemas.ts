import type { ManualAlertInput, NotificationPreferencesInput } from '@applyfields/types';
import { z } from 'zod';
import { MAX_REMINDER_DAYS, MUTABLE_TYPES } from './notification-rules.js';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const preferencesSchema = z.object({
  email_enabled: z.boolean(),
  muted_types: z.array(z.enum(MUTABLE_TYPES)).max(MUTABLE_TYPES.length),
  reminder_days_before: z.array(z.number().int().min(0).max(MAX_REMINDER_DAYS)).max(5),
});

/** A path on the website only (e.g. /jobs/ssc-cgl-2026) — never an outside or javascript: link. */
const sitePath = z
  .string()
  .trim()
  .max(300)
  .regex(/^\/(?!\/)[^\s\\]*$/, 'Must be a path on the website, like /jobs/ssc-cgl-2026');

export const manualAlertSchema = z.object({
  title: z.string().trim().min(3).max(150),
  body: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .transform((v) => v || null),
  link: z
    .union([z.literal(''), sitePath])
    .nullable()
    .transform((v) => v || null),
  audience: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('savers'), opportunity_slug: z.string().trim().min(1).max(200) }),
    z.object({ kind: z.literal('user'), email: z.email().max(320) }),
  ]),
});

const samePreferences: Same<z.infer<typeof preferencesSchema>, NotificationPreferencesInput> = true;
const sameAlert: Same<z.infer<typeof manualAlertSchema>, ManualAlertInput> = true;
void samePreferences;
void sameAlert;
