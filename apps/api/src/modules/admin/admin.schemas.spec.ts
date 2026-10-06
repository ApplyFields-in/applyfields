import { describe, expect, it } from 'vitest';
import { opportunityInputSchema, statusChangeSchema } from './admin.schemas.js';
import { slugify } from './opportunities-admin.service.js';
import { updateBlockers } from './updates-admin.service.js';

const valid = {
  title: 'SSC CGL 2026',
  type: 'govt_job',
  category: 'central_govt',
  organization_id: '6f1c2a54-3b7d-4c1e-9f0a-2d5b8e7c4a11',
  notification_number: '',
  summary: null,
  state_codes: ['all'],
  districts: [],
  vacancies_total: 17727,
  fee_text: '',
  application_start: '2026-09-22',
  application_end: '2026-10-21',
  notification_pdf_url: 'https://ssc.gov.in/cgl.pdf',
  official_page_url: '',
  apply_url: null,
  official_website: null,
  source_url: null,
  field_status: { syllabus: 'not_in_source' },
  eligibility: null,
  posts: [{ name: 'Assistant Section Officer', vacancies_total: 4500, pay_level: '', salary_text: null }],
  dates: [{ kind: 'exam_date', date: '2026-12-08', end_date: '', is_tentative: true, note: null }],
};

describe('opportunityInputSchema', () => {
  it('accepts a complete form and normalises empty values to null', () => {
    const out = opportunityInputSchema.parse(valid);
    expect(out.state_codes).toEqual(['ALL']);
    expect(out.notification_number).toBeNull();
    expect(out.official_page_url).toBeNull();
    expect(out.posts[0]?.pay_level).toBeNull();
    expect(out.dates[0]?.end_date).toBeNull();
  });

  it('refuses links that are not http(s) — no javascript: on the citizen site', () => {
    expect(opportunityInputSchema.safeParse({ ...valid, apply_url: 'javascript:alert(1)' }).success).toBe(false);
    expect(opportunityInputSchema.safeParse({ ...valid, apply_url: 'ssc.gov.in' }).success).toBe(false);
  });

  it('refuses bad dates and a start after the last date', () => {
    expect(opportunityInputSchema.safeParse({ ...valid, application_end: '21/10/2026' }).success).toBe(false);
    expect(opportunityInputSchema.safeParse({ ...valid, application_start: '2026-11-01' }).success).toBe(false);
  });

  it('needs at least one state', () => {
    expect(opportunityInputSchema.safeParse({ ...valid, state_codes: [] }).success).toBe(false);
  });
});

describe('statusChangeSchema', () => {
  it('needs a reason to archive or reject', () => {
    expect(statusChangeSchema.safeParse({ status: 'archived' }).success).toBe(false);
    expect(statusChangeSchema.safeParse({ status: 'archived', reason: 'Duplicate of SSC CGL' }).success).toBe(true);
    expect(statusChangeSchema.safeParse({ status: 'closed' }).success).toBe(true);
  });
});

describe('slugify', () => {
  it('makes readable URL slugs', () => {
    expect(slugify('SSC CGL 2026 — Notice!')).toBe('ssc-cgl-2026-notice');
    expect(slugify('   ')).toBe('opportunity');
  });
});

describe('updateBlockers', () => {
  const parent = { kind: 'opportunity' as const, id: 'x', title: 'SSC CGL 2026', status: 'published' as const };
  it('passes a linked update with an official link', () => {
    expect(updateBlockers({ title: 'Admit card out', url: 'https://ssc.gov.in/a', source_url: null, parent })).toEqual([]);
  });
  it('needs the parent job to be live first', () => {
    expect(updateBlockers({ title: 'Admit card out', url: 'https://ssc.gov.in/a', source_url: null, parent: { ...parent, status: 'draft' } })).toEqual([
      'Publish the job it belongs to first',
    ]);
  });
  it('needs a parent and a link', () => {
    expect(updateBlockers({ title: 'Result', url: null, source_url: null, parent: null })).toEqual(['The job or exam it belongs to', 'Official link']);
  });
});
