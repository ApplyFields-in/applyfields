import type {
  OpportunityInput,
  StatusChange,
  UpdateInput,
} from '@applyfields/types';
import { z } from 'zod';
import {
  date_kind,
  gender_rule,
  opportunity_category,
  opportunity_type,
  update_kind,
} from '../../generated/prisma/enums.js';

/* Request bodies for the Internal Portal write endpoints (validated by ZodPipe). */

/** Optional text: trimmed, '' becomes null. */
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => v || null);

/** http(s) only — never javascript: or data: links on the citizen site. '' becomes null. */
const optUrl = z
  .union([
    z.literal(''),
    z
      .url({ protocol: /^https?$/, error: 'Must be a full http(s) link' })
      .max(1000),
  ])
  .nullable()
  .transform((v) => v || null);

const optDate = z
  .union([z.literal(''), z.iso.date({ error: 'Use YYYY-MM-DD' })])
  .nullable()
  .transform((v) => v || null);

const optInt = (max: number) => z.number().int().min(0).max(max).nullable();

/** Short codes like AP, TS, ALL, OBC, PWBD. */
const codes = z
  .array(
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2,4}$/, 'Use short codes like AP, TS, ALL, OBC'),
  )
  .max(40);
const words = z.array(z.string().trim().min(1).max(200)).max(50);

const fieldStatus = z.record(
  z.string().max(60),
  z.enum(['available', 'not_in_source', 'pending', 'not_applicable']),
);

const eligibility = z.object({
  age_min: optInt(100),
  age_max: optInt(100),
  age_as_on_date: optDate,
  age_relaxations: z
    .array(
      z.object({
        category: z
          .enum(['GEN', 'OBC', 'SC', 'ST', 'EWS', 'PWBD', 'EXS'])
          .optional(),
        gender: z.enum(gender_rule).optional(),
        condition: z.string().max(300).optional(),
        years: z.number().min(0).max(30),
      }),
    )
    .max(30),
  qualification_level: optText(40),
  qualification_streams: words,
  min_percentage: z.number().min(0).max(100).nullable(),
  final_year_allowed: z.boolean().nullable(),
  gender: z.enum(gender_rule),
  domicile_states: codes,
  categories_allowed: codes,
  income_max: optInt(1_000_000_000),
  other_conditions: words,
  official_text: optText(20_000),
});

export const opportunityInputSchema = z
  .object({
    title: z.string().trim().min(3, 'Title is too short').max(300),
    type: z.enum(opportunity_type),
    category: z.enum(opportunity_category),
    organization_id: z.uuid(),
    notification_number: optText(200),
    summary: optText(2000),
    state_codes: codes.min(1, 'Add at least one state, or ALL'),
    districts: words,
    vacancies_total: optInt(10_000_000),
    fee_text: optText(5000),
    application_start: optDate,
    application_end: optDate,
    notification_pdf_url: optUrl,
    official_page_url: optUrl,
    apply_url: optUrl,
    official_website: optUrl,
    source_url: optUrl,
    field_status: fieldStatus,
    eligibility: eligibility.nullable(),
    posts: z
      .array(
        z.object({
          id: z.uuid().optional(),
          name: z.string().trim().min(1, 'Post name is required').max(300),
          vacancies_total: optInt(10_000_000),
          pay_level: optText(100),
          salary_text: optText(300),
        }),
      )
      .max(200),
    dates: z
      .array(
        z.object({
          id: z.uuid().optional(),
          kind: z.enum(date_kind),
          date: z.iso.date({ error: 'Use YYYY-MM-DD' }),
          end_date: optDate,
          is_tentative: z.boolean(),
          note: optText(300),
        }),
      )
      .max(50),
  })
  .refine(
    (o) =>
      !o.application_start ||
      !o.application_end ||
      o.application_start <= o.application_end,
    {
      message: 'Application opens after the last date',
      path: ['application_end'],
    },
  );

export const statusChangeSchema = z
  .object({
    status: z.enum(['draft', 'closed', 'archived']),
    reason: z.string().trim().max(1000).optional(),
  })
  .refine((s) => s.status !== 'archived' || (s.reason?.length ?? 0) >= 3, {
    message: 'Write a short reason when rejecting or archiving',
    path: ['reason'],
  });

export const updateInputSchema = z.object({
  kind: z.enum(update_kind),
  title: z.string().trim().min(3, 'Title is too short').max(300),
  date: optDate,
  url: optUrl,
  summary: optText(2000),
  effective_date: optDate.optional(),
  new_deadline: optDate.optional(),
  opportunity_id: z.uuid().nullable(),
  source_url: optUrl,
});

// Compile-time check: the validated shapes match the shared types the admin app sends.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const sameOpportunity: Same<
  z.infer<typeof opportunityInputSchema>,
  OpportunityInput
> = true;
const sameStatus: Same<z.infer<typeof statusChangeSchema>, StatusChange> = true;
const sameUpdate: Same<z.infer<typeof updateInputSchema>, UpdateInput> = true;
void [sameOpportunity, sameStatus, sameUpdate];
